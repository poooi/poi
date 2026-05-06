import type * as TouchBarUtil from 'lib/touchbar'
import type { RootState } from 'views/redux/reducer-factory'

import { Button, Position } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import { shell, clipboard, nativeImage, ipcRenderer, type IpcRendererEvent } from 'electron'
import fs from 'fs-extra'
import { padStart } from 'lodash'
import path from 'path'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css, styled } from 'styled-components'
import { CustomTag } from 'views/components/etc/custom-tag'
import { Tooltip } from 'views/components/etc/overlay'
import { getStore } from 'views/create-store'
import { config } from 'views/env'
import { toggleModal } from 'views/env-parts/modal'
import { error, success } from 'views/services/alert'
import { gameRefreshPage, gameReload } from 'views/services/utils'

const { openExternal } = shell

const openItemAsync = (dir: string, source?: string | null) => {
  openExternal(`file://${dir}`, {}).catch((err: Error) => {
    const prefix = (source && `${source}: `) || ''
    console.error(`${prefix}Failed to open item "${dir}" asynchronously`, err)
  })
}

const PoiControlTag = styled(CustomTag)<{
  tag?: string
  extend?: boolean
  children?: React.ReactNode
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
  const editableTimeoutRef = useRef(0)
  const propsRef = useRef({ muted, editable, t })
  // eslint-disable-next-line react-hooks/refs
  propsRef.current = { muted, editable, t }

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

  const handleScreenshotFailure = useCallback((err?: Error) => {
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
      const image = nativeImage.createFromDataURL(dataURL)
      if (toClipboard) {
        clipboard.writeImage(image)
        success(propsRef.current.t('screenshot saved to clipboard'))
      } else {
        const buf = usePNG ? image.toPNG() : image.toJPEG(80)
        const date = formatDate(new Date())
        const filename = path.join(screenshotPath, `${date}.${usePNG ? 'png' : 'jpg'}`)
        try {
          await fs.ensureDir(screenshotPath)
          await fs.writeFile(filename, buf)
          success(`${propsRef.current.t('screenshot saved to')} ${filename}`)
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          handleScreenshotFailure(error as Error)
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        handleScreenshotFailure(error as Error)
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
      config.removeListener('config.set', handleConfigChange)
      if (process.platform === 'darwin') {
        ipcRenderer.removeListener('touchbar', touchbarListener)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount-once; handleConfigChange and touchbarListener are stable

  if (process.platform === 'darwin') {
    const { updateTouchbarInfoIcons }: typeof TouchBarUtil = remote.require('./lib/touchbar')
    updateTouchbarInfoIcons()
  }

  const list = [
    {
      onClick: handleOpenDevTools,
      onContextMenu: handleOpenWebviewDevTools,
      label: t('Developer Tools'),
      icon: 'console',
    },
    {
      onClick: () => handleCapturePage(false),
      onContextMenu: () => handleCapturePage(true),
      label: t('Take a screenshot'),
      icon: 'camera',
    },
    {
      onClick: handleSetMuted,
      onContextMenu: null,
      label: muted ? t('Volume on') : t('Volume off'),
      icon: muted ? 'volume-off' : 'volume-up',
    },
    {
      onClick: handleOpenCacheFolder,
      onContextMenu: null,
      label: t('Open cache dir'),
      icon: 'social-media',
    },
    {
      onClick: handleOpenScreenshotFolder,
      onContextMenu: null,
      label: t('Open screenshot dir'),
      icon: 'media',
    },
    {
      onClick: handleJustifyLayout,
      onContextMenu: handleUnlockWebview,
      label: t('Auto adjust'),
      icon: 'fullscreen',
    },
    {
      onClick: handleSetEditable,
      onContextMenu: null,
      label: editable ? t('Lock panel') : t('Unlock panel'),
      icon: editable ? 'unlock' : 'lock',
    },
    {
      onClick: handleRefreshGameDialog,
      onContextMenu: gameReload,
      label: t('Refresh game'),
      icon: 'refresh',
    },
  ]

  // eslint-disable-next-line react-hooks/refs
  const listItems = list.map(({ label, ...props }) => (
    <Tooltip key={label} position={Position.TOP_LEFT} content={label} disabled={transition}>
      <Button {...(props as object)} minimal />
    </Tooltip>
  ))

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
