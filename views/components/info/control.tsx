import type * as TouchBarUtil from 'lib/touchbar'
import type { RootState } from 'views/redux/reducer-factory'

import { Button, Icon, type IconName, Popover, Position, Tooltip } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import { shell, nativeImage, ipcRenderer, type IpcRendererEvent } from 'electron'
import fs from 'fs-extra'
import { padStart } from 'lodash'
import path from 'path'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css, styled } from 'styled-components'
import { CustomTag } from 'views/components/etc/custom-tag'
import { getStore } from 'views/create-store'
import { config } from 'views/env'
import { toggleModal } from 'views/env-parts/modal'
import { error, success } from 'views/services/alert'
import { writeClipboardImage } from 'views/services/clipboard'
import { gameRefreshPage, gameReload } from 'views/services/utils'

const { openExternal } = shell

const openItemAsync = (dir: string, source?: string | null) => {
  openExternal(`file://${dir}`, {}).catch((err: Error) => {
    const prefix = (source && `${source}: `) || ''
    console.error(`${prefix}Failed to open item "${dir}" asynchronously`, err)
  })
}

const PoiControlTag = styled(CustomTag)<{
  extend?: boolean
  onTransitionEnd?: () => void
}>`
  width: 0;
  transition: 0.3s 0.2s;
  display: flex;
  flex-direction: row;
  ${({ extend }) =>
    extend
      ? css`
          flex: 0 0 270px;
        `
      : css`
          flex: 0 0 120px;
        `}
`

const PoiControlInner = styled.div`
  white-space: nowrap;
  overflow: hidden;
  flex: 1;
`

const ContextIcon = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  .context-icon-badge {
    position: absolute;
    right: -5px;
    bottom: -5px;
    display: flex;
    padding: 1px;
    border-radius: 50%;
    background-color: var(--bp-intent-primary-rest);
    color: var(--bp-intent-primary-foreground);
  }
`

/**
 * The alternate action of a toolbar button is bound to right click, which is
 * undiscoverable and unreachable on a touchpad-only setup. Reuse the base icon
 * so the popped-up button still reads as "the same button", and badge it with
 * the icon of what the alternate action actually does.
 */
const AlternateIcon = ({ icon, badge }: { icon: IconName; badge: IconName }) => (
  <ContextIcon>
    <Icon icon={icon} />
    <Icon className="context-icon-badge" icon={badge} size={10} />
  </ContextIcon>
)

interface ControlItem {
  onClick: (event: React.MouseEvent) => void
  onContextMenu?: (event: React.MouseEvent) => void
  label: string
  icon: IconName
  /** Label of the right-click action, shown on the popped-up alternate button. */
  altLabel?: string
  /** Badge overlaid on the alternate button's icon. */
  altIcon?: IconName
}

/**
 * Both overlays open on the same delay, so the alternate button arrives with
 * the tooltip rather than trailing behind it.
 */
const HOVER_OPEN_DELAY = 100

/** Slide duration of the alternate popup; mirrored in `.poi-control-alt-portal`. */
const TRANSITION_DURATION = 100

/**
 * Distance from the button to its tooltip. A column with an alternate action
 * clears the popup that occupies the space right above the button; the popup
 * opens on the same delay as the tooltip, so this stays constant instead of
 * following the popup's open state and moving the tooltip mid-hover.
 */
const offsetModifiers = (distance: number) => ({
  offset: { options: { offset: [0, distance] as [number, number] } },
})
const alternateOffset = offsetModifiers(42)
const plainOffset = offsetModifiers(8)

const ControlButton = ({
  item: { onClick, onContextMenu, label, icon, altLabel, altIcon },
  disabled,
  activeLabel,
  onLabel,
  onLabelEnd,
}: {
  item: ControlItem
  /** Suppress both overlays while the toolbar is sliding open or shut. */
  disabled: boolean
  /** Label this column is currently showing, or null when another column is. */
  activeLabel: string | null
  onLabel: (column: string, text: string) => void
  onLabelEnd: () => void
}) => {
  const alternate = onContextMenu && altIcon && (
    <Button
      icon={<AlternateIcon icon={icon} badge={altIcon} />}
      onClick={onContextMenu}
      onMouseEnter={() => onLabel(label, altLabel ?? label)}
      onMouseLeave={onLabelEnd}
      onFocus={() => onLabel(label, altLabel ?? label)}
      onBlur={onLabelEnd}
      minimal
    />
  )

  // The tooltip has to sit outside the popover, not inside it: Popover
  // force-disables a Tooltip child of its own while it is open, which would
  // kill the label the moment the alternate button appears. Both wrap the
  // button in a target element of their own, so the tooltip still anchors to
  // the button's column, and neither clones away the handlers below.
  return (
    <Tooltip
      // never empty: an empty content makes Popover skip the overlay entirely
      content={activeLabel ?? label}
      isOpen={!disabled && activeLabel != null}
      position={Position.TOP}
      modifiers={alternate ? alternateOffset : plainOffset}
    >
      <Popover
        content={alternate || undefined}
        disabled={disabled || !alternate}
        interactionKind="hover"
        placement="top"
        minimal
        portalClassName="poi-control-alt-portal"
        hoverOpenDelay={HOVER_OPEN_DELAY}
        // leaves with the tooltip; travel between the button and the popup is
        // already covered by Popover's own event-queue flush, not by this delay
        hoverCloseDelay={0}
        // the outgoing popup has to be gone before the next column's opens,
        // otherwise two alternate buttons are on screen at once
        transitionDuration={TRANSITION_DURATION}
      >
        <Button
          icon={icon}
          onClick={onClick}
          onContextMenu={onContextMenu}
          onMouseEnter={() => onLabel(label, label)}
          onMouseLeave={onLabelEnd}
          onFocus={() => onLabel(label, label)}
          onBlur={onLabelEnd}
          minimal
        />
      </Popover>
    </Tooltip>
  )
}

const formatDate = (date: Date): string => {
  const pad2 = (x: number) => padStart(String(x), 2, '0')
  const yyyy = date.getFullYear()
  const mm = pad2(date.getMonth() + 1)
  const dd = pad2(date.getDate())
  const datePart = `${yyyy}-${mm}-${dd}`
  const hh = pad2(date.getHours())
  const min = pad2(date.getMinutes())
  const ss = pad2(date.getSeconds())
  const timePart = `${hh}.${min}.${ss}`
  return `${datePart}T${timePart}`
}

const editableConfigList = [
  'poi.mainpanel.layout',
  'poi.webview.ratio.horizontal',
  'poi.webview.ratio.vertical',
  'poi.tabarea.overlaypanelwidth',
  'poi.tabarea.mainpanelwidth',
  'poi.tabarea.mainpanelheight',
]

export const PoiControl = () => {
  const { t } = useTranslation()
  const muted = useSelector((state: RootState) => state.config?.poi?.content?.muted ?? false)
  const editable = useSelector((state: RootState) => state.config?.poi?.layout?.editable ?? false)

  const [extend, setExtend] = useState(false)
  const [transition, setTransition] = useState(false)
  // Which column owns the tooltip, and what it reads. Held for the whole row so
  // that claiming it for one column drops it from the previous one in the same
  // update -- per-column state let both linger on screen together.
  const [activeColumn, setActiveColumn] = useState<[string, string] | null>(null)
  const labelTimeoutRef = useRef(0)
  const editableTimeoutRef = useRef(0)
  const propsRef = useRef({ muted, editable, t })
  // eslint-disable-next-line react-hooks/refs
  propsRef.current = { muted, editable, t }

  const handleLabel = useCallback((column: string, text: string) => {
    clearTimeout(labelTimeoutRef.current)
    labelTimeoutRef.current = window.setTimeout(
      () => setActiveColumn([column, text]),
      HOVER_OPEN_DELAY,
    )
  }, [])

  // Reaching the alternate button means leaving the main one. Hold the label
  // across that gap so it hands over instead of closing and reopening.
  const handleLabelEnd = useCallback(() => {
    clearTimeout(labelTimeoutRef.current)
    labelTimeoutRef.current = window.setTimeout(() => setActiveColumn(null), HOVER_OPEN_DELAY)
  }, [])

  const disableEditableMsg = useCallback(() => {
    clearTimeout(editableTimeoutRef.current)
    editableTimeoutRef.current = window.setTimeout(() => {
      config.set('poi.layout.editable', false)
      window.toast(propsRef.current.t('You can unlock it manually'), {
        title: propsRef.current.t('Panel locked'),
      })
    }, 60000)
  }, [])

  const enableEditableMsg = useCallback(() => {
    window.toast(
      propsRef.current.t('If no changes, panel will be locked automatically in 1 minute'),
      { title: propsRef.current.t('Panel unlocked') },
    )
    disableEditableMsg()
  }, [disableEditableMsg])

  const handleSetMuted = useCallback(() => {
    config.set('poi.content.muted', !propsRef.current.muted)
  }, [])

  const handleSetEditable = useCallback(() => {
    if (!propsRef.current.editable) {
      enableEditableMsg()
    } else {
      clearTimeout(editableTimeoutRef.current)
    }
    config.set('poi.layout.editable', !propsRef.current.editable)
  }, [enableEditableMsg])

  const handleConfigChange = useCallback(
    (_path: string, _value: unknown) => {
      if (editableConfigList.includes(_path) && propsRef.current.editable) {
        disableEditableMsg()
      }
    },
    [disableEditableMsg],
  )

  const handleScreenshotFailure = useCallback((err?: unknown) => {
    if (err) console.error(err)
    error(propsRef.current.t('Failed to save the screenshot'))
  }, [])

  const handleScreenshotCaptured = useCallback(
    async (dataURL: string, toClipboard?: boolean) => {
      const screenshotPath = config.get(
        'poi.misc.screenshot.path',
        `${remote.getGlobal('DEFAULT_SCREENSHOT_PATH')}`,
      )!
      const usePNG = config.get('poi.misc.screenshot.format', 'png') === 'png'
      if (toClipboard) {
        // The renderer has no clipboard module in Electron 44, so the main
        // process builds the image and writes it.
        try {
          const copied = await writeClipboardImage(dataURL)
          if (!copied) {
            handleScreenshotFailure(new Error('Failed to write the screenshot to the clipboard'))
            return
          }
          success(propsRef.current.t('screenshot saved to clipboard'))
        } catch (error) {
          handleScreenshotFailure(error)
        }
      } else {
        const image = nativeImage.createFromDataURL(dataURL)
        const buf = usePNG ? image.toPNG() : image.toJPEG(80)
        const date = formatDate(new Date())
        const filename = path.join(screenshotPath, `${date}.${usePNG ? 'png' : 'jpg'}`)
        try {
          await fs.ensureDir(screenshotPath)
          await fs.writeFile(filename, buf)
          success(`${propsRef.current.t('screenshot saved to')} ${filename}`)
        } catch (error) {
          handleScreenshotFailure(error)
        }
      }
    },
    [handleScreenshotFailure],
  )

  const handleCapturePageOverWebContent = useCallback(
    async (toClipboard?: boolean) => {
      const { width, height } = getStore('layout.webview')
      const webContentId = getStore('layout.webview.ref')?.getWebContentsId()
      if (webContentId == null) {
        handleScreenshotFailure(new Error('WebContent is not available'))
        return
      }
      const actualSize = { width: Math.round(width), height: Math.round(height) }
      const rect = {
        x: 0,
        y: 0,
        width: Math.floor(width * devicePixelRatio),
        height: Math.floor(height * devicePixelRatio),
      }
      try {
        const dataURL =
          (await ipcRenderer.invoke('screenshot::get', webContentId, rect, actualSize)) ||
          (await remote.webContents.fromId(webContentId)?.capturePage(rect))
            ?.resize(actualSize)
            ?.toDataURL()
        handleScreenshotCaptured(dataURL, toClipboard)
      } catch (error) {
        handleScreenshotFailure(error)
      }
    },
    [handleScreenshotCaptured, handleScreenshotFailure],
  )

  const handleCapturePageOverCanvas = useCallback(
    async (toClipboard?: boolean) => {
      const ref = getStore('layout.webview.ref')
      const webContents = ref?.getWebContents()
      if (!webContents) {
        await handleCapturePageOverWebContent(toClipboard)
        return
      }
      const dataURL = `${await webContents.executeJavaScript(`capture(${!!toClipboard})`)}`
      if (!dataURL) {
        await handleCapturePageOverWebContent(toClipboard)
      } else {
        await handleScreenshotCaptured(dataURL, toClipboard)
      }
    },
    [handleCapturePageOverWebContent, handleScreenshotCaptured],
  )

  const handleCapturePage = useCallback(
    async (toClipboard?: boolean) => {
      if (config.get('poi.misc.screenshot.usecanvas')) {
        handleCapturePageOverCanvas(toClipboard)
      } else {
        handleCapturePageOverWebContent(toClipboard)
      }
    },
    [handleCapturePageOverCanvas, handleCapturePageOverWebContent],
  )

  const handleOpenCacheFolder = useCallback(() => {
    try {
      const dir = config.get('poi.misc.cache.path', `${remote.getGlobal('DEFAULT_CACHE_PATH')}`)
      fs.ensureDirSync(dir)
      fs.ensureDirSync(path.join(dir, 'KanColle'))
      fs.ensureDirSync(path.join(dir, 'ShiroPro'))
      fs.ensureDirSync(path.join(dir, 'Shinken'))
      fs.ensureDirSync(path.join(dir, 'Kanpani'))
      fs.ensureDirSync(path.join(dir, 'FlowerKnightGirls'))
      fs.ensureDirSync(path.join(dir, 'ToukenRanbu'))
      openItemAsync(dir, 'handleOpenCacheFolder')
    } catch (_) {
      toggleModal(propsRef.current.t('Open cache dir'), propsRef.current.t('NoPermission'), [])
    }
  }, [])

  const handleOpenMakaiFolder = useCallback(() => {
    let dir = config.get('poi.misc.cache.path', `${remote.getGlobal('DEFAULT_CACHE_PATH')}`)
    dir = path.join(dir, 'KanColle', 'kcs2', 'resources', 'ship')
    try {
      fs.ensureDirSync(dir)
      openItemAsync(dir, 'handleOpenMakaiFolder')
    } catch (_) {
      toggleModal(propsRef.current.t('Open makai dir'), propsRef.current.t('NoPermission'), [])
    }
  }, [])
  void handleOpenMakaiFolder

  const handleOpenScreenshotFolder = useCallback(() => {
    try {
      const screenshotPath = config.get(
        'poi.misc.screenshot.path',
        `${remote.getGlobal('DEFAULT_SCREENSHOT_PATH')}`,
      )
      if (screenshotPath) {
        fs.ensureDirSync(screenshotPath)
        openItemAsync(screenshotPath, 'handleOpenScreenshotFolder')
      }
    } catch (_) {
      toggleModal(propsRef.current.t('Open screenshot dir'), propsRef.current.t('NoPermission'), [])
    }
  }, [])

  const handleOpenDevTools = useCallback(() => {
    remote.getCurrentWindow().webContents.openDevTools({ mode: 'detach' })
    setTimeout(() => {
      getStore('layout.webview.ref')?.executeJavaScript('window.align()')
    }, 500)
  }, [])

  const handleOpenWebviewDevTools = useCallback(() => {
    getStore('layout.webview.ref')?.openDevTools()
  }, [])

  const handleUnlockWebview = useCallback(() => {
    getStore('layout.webview.ref')?.executeJavaScript('window.unalign()')
  }, [])

  const handleJustifyLayout = useCallback((e: React.MouseEvent) => {
    getStore('layout.webview.ref')?.executeJavaScript('window.align()')
    e.preventDefault()
  }, [])

  const handleRefreshGameDialog = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey) {
      gameRefreshPage()
      return
    }
    toggleModal(
      propsRef.current.t('Confirm Refreshing'),
      <div>
        <Trans i18nKey="RefreshGameDialogTip">
          Are you sure to refresh the game?
          <ul>
            <li>Refresh page is the same as pressing F5.</li>
            <li>
              Reload game reloads only the game frame, this is usually faster but could result in
              catbomb.
            </li>
          </ul>
          Tip: Right clicking on this button reloads the game and Left clicking with Shift key
          pressed refreshes the page, both are <b>without confirmation</b>, use at your own risk.
        </Trans>
      </div>,
      [
        { name: propsRef.current.t('Refresh page'), func: gameRefreshPage, style: 'warning' },
        { name: propsRef.current.t('Reload game'), func: gameReload, style: 'danger' },
      ],
    )
  }, [])

  const handleTouchbar = useCallback(
    (msg: string) => {
      const { toggleRefreshConfirm, renderMainTouchbar }: typeof TouchBarUtil =
        remote.require('./lib/touchbar')
      switch (msg) {
        case 'refresh':
          toggleModal(
            propsRef.current.t('Confirm Refreshing'),
            <div>
              <Trans i18nKey="RefreshGameDialogTip">
                Are you sure to refresh the game?
                <ul>
                  <li>Refresh page is the same as pressing F5.</li>
                  <li>
                    Reload game reloads only the game frame, this is usually faster but could result
                    in catbomb.
                  </li>
                </ul>
                Tip: Right clicking on this button reloads the game and Left clicking with Shift key
                pressed refreshes the page, both are <b>without confirmation</b>, use at your own
                risk.
              </Trans>
            </div>,
            [
              {
                name: propsRef.current.t('Refresh page'),
                func: gameRefreshPage,
                style: 'warning',
              },
              { name: propsRef.current.t('Reload game'), func: gameReload, style: 'danger' },
            ],
            () => renderMainTouchbar(),
          )
          toggleRefreshConfirm(
            propsRef.current.t('Refresh page'),
            propsRef.current.t('Reload game'),
          )
          break
        case 'adjust':
          window.dispatchEvent(new Event('resize'))
          break
        case 'unlock':
          handleUnlockWebview()
          break
        case 'screenshotdir':
          handleOpenScreenshotFolder()
          break
        case 'cachedir':
          handleOpenCacheFolder()
          break
        case 'volume':
          handleSetMuted()
          break
        case 'screenshot':
          handleCapturePage()
          break
        case 'gameReload':
          gameReload()
          break
        case 'gameRefreshPage':
          gameRefreshPage()
          break
        case 'edit':
          handleSetEditable()
          break
        default:
      }
    },
    [
      handleUnlockWebview,
      handleOpenScreenshotFolder,
      handleOpenCacheFolder,
      handleSetMuted,
      handleCapturePage,
      handleSetEditable,
    ],
  )

  const touchbarListener = useCallback(
    (_event: IpcRendererEvent, message: string) => handleTouchbar(message),
    [handleTouchbar],
  )

  useEffect(() => {
    if (propsRef.current.editable) disableEditableMsg()
    config.addListener('config.set', handleConfigChange)
    if (process.platform === 'darwin') {
      ipcRenderer.addListener('touchbar', touchbarListener)
    }
    return () => {
      clearTimeout(labelTimeoutRef.current)
      config.removeListener('config.set', handleConfigChange)
      if (process.platform === 'darwin') {
        ipcRenderer.removeListener('touchbar', touchbarListener)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount-once; handleConfigChange and touchbarListener are stable

  // keep the touchbar icons in sync with the states they reflect; this is a
  // synchronous remote IPC call, so run it as an effect instead of in render
  useEffect(() => {
    if (process.platform === 'darwin') {
      const { updateTouchbarInfoIcons }: typeof TouchBarUtil = remote.require('./lib/touchbar')
      updateTouchbarInfoIcons()
    }
  }, [muted, editable])

  const listItems = useMemo(() => {
    const list: ControlItem[] = [
      {
        onClick: handleOpenDevTools,
        onContextMenu: handleOpenWebviewDevTools,
        label: t('Developer Tools'),
        icon: 'console',
        altLabel: t('Game view developer tools'),
        altIcon: 'application',
      },
      {
        onClick: () => handleCapturePage(false),
        onContextMenu: () => handleCapturePage(true),
        label: t('Take a screenshot'),
        icon: 'camera',
        altLabel: t('Copy screenshot to clipboard'),
        altIcon: 'clipboard',
      },
      {
        onClick: handleSetMuted,
        label: muted ? t('Volume on') : t('Volume off'),
        icon: muted ? 'volume-off' : 'volume-up',
      },
      {
        onClick: handleOpenCacheFolder,
        label: t('Open cache dir'),
        icon: 'social-media',
      },
      {
        onClick: handleOpenScreenshotFolder,
        label: t('Open screenshot dir'),
        icon: 'media',
      },
      {
        onClick: handleJustifyLayout,
        onContextMenu: handleUnlockWebview,
        label: t('Auto adjust'),
        icon: 'fullscreen',
        altLabel: t('Unlock game view'),
        altIcon: 'unlock',
      },
      {
        onClick: handleSetEditable,
        label: editable ? t('Lock panel') : t('Unlock panel'),
        icon: editable ? 'unlock' : 'lock',
      },
      {
        onClick: handleRefreshGameDialog,
        onContextMenu: gameReload,
        label: t('Refresh game'),
        icon: 'refresh',
        altLabel: t('Reload game'),
        altIcon: 'application',
      },
    ]
    // eslint-disable-next-line react-hooks/refs -- handlers read propsRef in events only, not during render
    return list.map((item) => (
      <ControlButton
        key={item.label}
        item={item}
        disabled={transition}
        activeLabel={activeColumn?.[0] === item.label ? activeColumn[1] : null}
        onLabel={handleLabel}
        onLabelEnd={handleLabelEnd}
      />
    ))
  }, [
    t,
    muted,
    editable,
    transition,
    activeColumn,
    handleLabel,
    handleLabelEnd,
    handleOpenDevTools,
    handleOpenWebviewDevTools,
    handleCapturePage,
    handleSetMuted,
    handleOpenCacheFolder,
    handleOpenScreenshotFolder,
    handleJustifyLayout,
    handleUnlockWebview,
    handleSetEditable,
    handleRefreshGameDialog,
  ])

  return (
    <PoiControlTag tag="poi-control" extend={extend} onTransitionEnd={() => setTransition(false)}>
      <PoiControlInner>{listItems}</PoiControlInner>
      <div>
        <Button
          icon={extend ? 'chevron-left' : 'chevron-right'}
          onClick={() => {
            setExtend((e) => !e)
            setTransition(true)
          }}
          minimal
        />
      </div>
    </PoiControlTag>
  )
}
