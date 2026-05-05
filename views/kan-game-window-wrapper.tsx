import type * as WebContentUtils from 'lib/webcontent-utils'
import type { ReactNode } from 'react'
import type { RootState } from 'views/redux/reducer-factory'

import { BlueprintProvider } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import { TitleBar } from 'electron-react-titlebar/renderer'
import { debounce } from 'lodash'
import { join } from 'path'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { useSelector } from 'react-redux'
import { styled, StyleSheetManager } from 'styled-components'
import { appMenu } from 'views/components/etc/menu'
import { dispatch, getStore } from 'views/create-store'
import { config, ROOT } from 'views/env'
import {
  createLayoutWebviewWindowUseFixedResolutionAction,
  createLayoutWebviewSizeAction,
} from 'views/redux/actions/layout'
import { fileUrl, loadScript } from 'views/utils/tools'

import { loadStyle } from './env-parts/theme'
import { KanGameWrapper } from './kan-game-wrapper'

declare global {
  interface Window {
    externalWindow?: Window
  }
}

const { BrowserWindow, screen } = remote
const { workArea } = screen.getPrimaryDisplay()

interface WindowRect {
  x?: number
  y?: number
  width: number
  height: number
}

const getPluginWindowRect = (): WindowRect => {
  const defaultRect: WindowRect = { width: 1200, height: 780 }
  const bounds = config.get('poi.kangameWindow.bounds', defaultRect) ?? defaultRect
  let { x, y, width, height } = bounds
  if (x == null || y == null) {
    return defaultRect
  }
  const validate = (n: number, min: number, range: number) =>
    n != null && n >= min && n < min + range
  const withinDisplay = (d: Electron.Display) => {
    const wa = d.workArea
    return validate(x!, wa.x, wa.width) && validate(y!, wa.y, wa.height)
  }
  if (!screen.getAllDisplays().some(withinDisplay)) {
    x = workArea.x
    y = workArea.y
  }
  if (width == null) {
    width = defaultRect.width
  }
  if (height == null) {
    height = defaultRect.height
  }
  return { x, y, width, height }
}

const PoiAppTabpane = styled.div`
  flex: 1;
  height: 100%;
  width: 100%;
  overflow: auto;
`

const FloatContainer = styled.div`
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 1000;
`

interface Props {
  titleExtra?: ReactNode
  pinned: boolean
}

// ---------------------------------------------------------------------------
// Error boundary — preserves componentDidCatch semantics
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode
  onCatch: (error: Error, info: React.ErrorInfo) => void
}

class KanGameWindowErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(error, info)
    this.setState({ hasError: true })
    this.props.onCatch(error, info)
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

// ---------------------------------------------------------------------------
// Inner functional component
// ---------------------------------------------------------------------------

const KanGameWindowWrapperInner = ({ titleExtra, pinned, windowRefsRef }: InnerProps) => {
  // Config values from Redux store (replaces config event listener)
  const zoom = useSelector((state: RootState) => state.config?.poi?.appearance?.zoom ?? 1)
  const windowUseFixedResolution = useSelector(
    (state: RootState) => state.config?.poi?.webview?.windowUseFixedResolution ?? true,
  )
  const windowWidth = useSelector(
    (state: RootState) => state.config?.poi?.webview?.windowWidth ?? 1200,
  )
  const customTitlebar = useSelector(
    (state: RootState) =>
      state.config?.poi?.appearance?.customtitlebar ??
      (process.platform === 'win32' || process.platform === 'linux'),
  )

  const [loaded, setLoaded] = useState(false)
  const [windowId, setWindowId] = useState<number | undefined>()

  // Stable container element created once
  const containerElRef = useRef<HTMLDivElement | null>(null)
  if (containerElRef.current === null) {
    const el = document.createElement('div')
    el.id = 'plugin-mountpoint'
    el.style.display = 'flex'
    el.style.flexDirection = 'column'
    el.style.height = '100vh'
    containerElRef.current = el
  }
  const containerEl = containerElRef.current

  const externalWindowRef = useRef<Window | null>(null)
  const currentWindowRef = useRef<Electron.BrowserWindow | null>(null)
  const kangameContainerRef = useRef<HTMLDivElement>(null)

  // Latest-value refs: allow effects to read current values without becoming
  // reactive to them (avoids unintended cross-effect triggers).
  const latestZoom = useRef(zoom)
  const latestWindowWidth = useRef(windowWidth)
  const latestCustomTitlebar = useRef(customTitlebar)
  latestZoom.current = zoom
  latestWindowWidth.current = windowWidth
  latestCustomTitlebar.current = customTitlebar

  const getYOffset = useCallback(() => (latestCustomTitlebar.current ? 60 : 30), [])

  // Loaded state ref — allows callbacks to see the current loaded value without
  // being listed as deps and triggering unnecessary re-renders.
  const loadedRef = useRef(loaded)
  const windowIdRef = useRef(windowId)
  loadedRef.current = loaded
  windowIdRef.current = windowId

  const checkBrowserWindowExistence = useCallback(() => {
    if (
      !windowIdRef.current ||
      !BrowserWindow.fromId(windowIdRef.current) ||
      !currentWindowRef.current
    ) {
      if (loadedRef.current) {
        console.warn('Webview window not exists. Removing window...')
        config.set('poi.layout.isolate', false)
      }
      return false
    }
    return true
  }, [])

  const forceSyncZoom = useCallback((count = 0) => {
    const webview = getStore('layout.webview.ref')
    if (webview) {
      webview.forceSyncZoom()
    } else if (count < 20) {
      setTimeout(() => forceSyncZoom(count + 1), 100)
    }
  }, [])

  const onZoomChange = useCallback(
    (value: number) => {
      if (
        loadedRef.current &&
        checkBrowserWindowExistence() &&
        currentWindowRef.current?.webContents
      ) {
        const [width, height] = currentWindowRef.current.getContentSize()
        currentWindowRef.current.setContentSize(width - 10, height - 10)
        currentWindowRef.current.setContentSize(width, height)
        currentWindowRef.current.webContents.setZoomFactor(value)
        forceSyncZoom()
      }
    },
    [checkBrowserWindowExistence, forceSyncZoom],
  )

  // Keep a ref so the mount effect below can read the initial value at open time
  const latestWindowUseFixedResolution = useRef(windowUseFixedResolution)
  latestWindowUseFixedResolution.current = windowUseFixedResolution

  // Mount: open the external window once
  useEffect(() => {
    const windowOptions = getPluginWindowRect()
    const initialWindowUseFixedResolution = latestWindowUseFixedResolution.current
    if (initialWindowUseFixedResolution) {
      windowOptions.width = latestWindowWidth.current
      windowOptions.height = Math.round(
        (windowOptions.width / 1200) * 720 + getYOffset() * latestZoom.current,
      )
    }
    const windowFeatures = Object.keys(windowOptions)
      .map((key) => {
        switch (key) {
          case 'x':
            return `left=${windowOptions.x}`
          case 'y':
            return `top=${windowOptions.y}`
          case 'width':
            return `width=${windowOptions.width}`
          case 'height':
            return `height=${windowOptions.height}`
        }
      })
      .join(',')

    const extWindow = open(
      `${fileUrl(join(ROOT, 'index-plugin.html'))}?kangame`,
      'plugin[kangame]',
      windowFeatures +
        ',nodeIntegration=no,nodeIntegrationInSubFrames=yes,webSecurity=no,contextIsolation=no',
    )
    externalWindowRef.current = extWindow
    windowRefsRef.current.externalWindow = extWindow

    extWindow?.addEventListener('DOMContentLoaded', () => {
      const curWindow =
        BrowserWindow.getAllWindows().find((a) =>
          a.webContents.getURL().endsWith('index-plugin.html?kangame'),
        ) ?? null
      currentWindowRef.current = curWindow
      windowRefsRef.current.currentWindow = curWindow

      loadScript(
        fileUrl(require.resolve('assets/js/webview-window-preload.js')),
        extWindow!.document,
      )
      curWindow?.setClosable(false)
      curWindow?.setResizable(!initialWindowUseFixedResolution)
      curWindow?.setAspectRatio(1200 / 720, {
        width: 0,
        height: Math.round(getYOffset() * latestZoom.current),
      })

      extWindow?.addEventListener(
        'resize',
        debounce(() => {
          if (process.platform !== 'darwin') {
            curWindow?.setContentSize(
              Math.round(extWindow.innerWidth * latestZoom.current),
              Math.round(((extWindow.innerWidth / 1200) * 720 + getYOffset()) * latestZoom.current),
            )
          }
          getStore('layout.webview.ref')?.executeJavaScript('window.align()')
          const wv = extWindow.document.querySelector('webview')
          if (wv) {
            const { width: wvWidth, height: wvHeight } = wv.getBoundingClientRect()
            dispatch(
              createLayoutWebviewSizeAction({ windowWidth: wvWidth, windowHeight: wvHeight }),
            )
          }
        }, 200),
      )

      extWindow!.document.head.innerHTML = `<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="script-src https://www.google-analytics.com 'self' file://* 'unsafe-inline'">
<link rel="stylesheet" type="text/css" id="bootstrap-css">
<link rel="stylesheet" type="text/css" id="normalize-css">
<link rel="stylesheet" type="text/css" id="blueprint-css">
<link rel="stylesheet" type="text/css" id="blueprint-icon-css">
<link rel="stylesheet" type="text/css" id="fontawesome-css">
<link rel="stylesheet" type="text/css" href="${fileUrl(require.resolve('assets/css/app.css'))}">
<link rel="stylesheet" type="text/css" href="${fileUrl(require.resolve('assets/css/global.css'))}">
<link rel="stylesheet" type="text/css" href="${fileUrl(require.resolve('electron-react-titlebar/style'))}">`

      if (process.platform === 'darwin') {
        const div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.top = '0'
        div.style.height = '23px'
        div.style.width = '100%'
        div.style.setProperty('-webkit-app-region', 'drag')
        div.style.setProperty('pointer-events', 'none')
        extWindow!.document.body.appendChild(div)
      } else {
        curWindow?.setMenu(appMenu)
        curWindow?.setAutoHideMenuBar(true)
        curWindow?.setMenuBarVisibility(false)
      }

      extWindow!.document.body.appendChild(containerEl)
      extWindow!.document.title = 'poi'
      loadStyle(extWindow!.document, curWindow!, false)

      const { stopFileNavigate, handleWebviewPreloadHack }: typeof WebContentUtils =
        remote.require('./lib/webcontent-utils')
      stopFileNavigate(curWindow!.webContents.id)
      handleWebviewPreloadHack(curWindow!.webContents.id)

      extWindow?.addEventListener('beforeunload', () => {
        const bounds = curWindow?.getBounds()
        config.set('poi.kangameWindow.bounds', bounds)
      })

      if (initialWindowUseFixedResolution) {
        const w = latestWindowWidth.current
        curWindow?.setContentSize(
          w,
          Math.round((w / 1200) * 720 + getYOffset() * latestZoom.current),
        )
      }

      curWindow?.blur()
      curWindow?.focus()
      setLoaded(true)
      setWindowId(curWindow?.id)
    })

    return () => {
      try {
        if (externalWindowRef.current) {
          externalWindowRef.current.onbeforeunload = null
          currentWindowRef.current?.setClosable(true)
          externalWindowRef.current.close()
        }
      } catch (e) {
        console.error(e)
      } finally {
        // eslint-disable-next-line react-hooks/exhaustive-deps -- windowRefsRef.current is a stable object; clearing fields at unmount time is intentional
        windowRefsRef.current.externalWindow = null
        // eslint-disable-next-line react-hooks/exhaustive-deps -- same as above
        windowRefsRef.current.currentWindow = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Effect: run zoom change whenever zoom or loaded changes
  useEffect(() => {
    if (!loaded) return
    onZoomChange(zoom)
  }, [zoom, loaded, onZoomChange])

  // Effect: apply windowUseFixedResolution changes after window is open
  useEffect(() => {
    if (!loaded || !currentWindowRef.current) return
    currentWindowRef.current.setResizable(!windowUseFixedResolution)
    if (windowUseFixedResolution) {
      const w = latestWindowWidth.current
      currentWindowRef.current.setContentSize(
        w,
        Math.round((w / 1200) * 720 + getYOffset() * latestZoom.current),
      )
    }
    dispatch(createLayoutWebviewWindowUseFixedResolutionAction(windowUseFixedResolution))
  }, [windowUseFixedResolution, loaded, getYOffset])

  // Effect: apply windowWidth changes after window is open
  useEffect(() => {
    if (!loaded || !currentWindowRef.current) return
    currentWindowRef.current.setContentSize(
      windowWidth,
      Math.round((windowWidth / 1200) * 720 + getYOffset() * latestZoom.current),
    )
  }, [windowWidth, loaded, getYOffset])

  if (!loaded || !externalWindowRef.current || !checkBrowserWindowExistence()) return null

  return ReactDOM.createPortal(
    <BlueprintProvider portalContainer={containerEl}>
      <StyleSheetManager target={externalWindowRef.current.document.head}>
        {customTitlebar ? (
          <TitleBar
            icon={join(ROOT, 'assets', 'icons', 'poi_32x32.png')}
            browserWindowId={currentWindowRef.current!.id}
            disableClose
            disableMaximize={pinned || windowUseFixedResolution}
            disableMinimize={pinned}
          >
            {titleExtra}
          </TitleBar>
        ) : (
          <FloatContainer>{titleExtra}</FloatContainer>
        )}
        <PoiAppTabpane className="poi-app-tabpane" ref={kangameContainerRef}>
          <KanGameWrapper windowMode key="window" />
        </PoiAppTabpane>
      </StyleSheetManager>
    </BlueprintProvider>,
    externalWindowRef.current.document.querySelector('#plugin-mountpoint')!,
  )
}

// ---------------------------------------------------------------------------
// Public export: inner component wrapped in the error boundary
// ---------------------------------------------------------------------------

interface WindowRefs {
  externalWindow: Window | null
  currentWindow: Electron.BrowserWindow | null
}

interface InnerProps extends Props {
  windowRefsRef: React.MutableRefObject<WindowRefs>
}

export const KanGameWindowWrapper = ({ titleExtra, pinned }: Props) => {
  // Shared ref object that the inner component populates.  The error boundary
  // reads from it in onCatch so it can close the window after a render error.
  const windowRefsRef = useRef<WindowRefs>({ externalWindow: null, currentWindow: null })

  const handleCatch = useCallback((_error: Error, _info: React.ErrorInfo) => {
    try {
      const { externalWindow, currentWindow } = windowRefsRef.current
      if (externalWindow) {
        externalWindow.onbeforeunload = null
        currentWindow?.setClosable(true)
        externalWindow.close()
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  return (
    <KanGameWindowErrorBoundary onCatch={handleCatch}>
      <KanGameWindowWrapperInner
        titleExtra={titleExtra}
        pinned={pinned}
        windowRefsRef={windowRefsRef}
      />
    </KanGameWindowErrorBoundary>
  )
}
