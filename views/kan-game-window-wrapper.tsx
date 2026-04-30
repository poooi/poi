import type { ConfigValue } from 'lib/config'
import type { ConfigPath } from 'views/env'

import * as remote from '@electron/remote'
import { TitleBar } from 'electron-react-titlebar/renderer'
import { debounce } from 'lodash'
import { join } from 'path'
import React, { PureComponent, createRef } from 'react'
import ReactDOM from 'react-dom'
import { styled, StyleSheetManager } from 'styled-components'
import { appMenu } from 'views/components/etc/menu'
import { WindowEnv } from 'views/components/etc/window-env'
import { dispatch, getStore } from 'views/create-store'
import { config, ROOT } from 'views/env'
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

interface KanGameWindowWrapperState {
  loaded?: boolean
  id?: number
  hasError?: boolean
}

export class KanGameWindowWrapper extends PureComponent<
  Record<string, never>,
  KanGameWindowWrapperState
> {
  containerEl: HTMLDivElement
  externalWindow: Window | null = null
  currentWindow: Electron.BrowserWindow | null = null
  resizable: boolean | undefined
  kangameContainer = createRef<HTMLDivElement>()

  constructor(props: Record<string, never>) {
    super(props)
    this.containerEl = document.createElement('div')
    this.containerEl.id = 'plugin-mountpoint'
    this.containerEl.style.display = 'flex'
    this.containerEl.style.flexDirection = 'column'
    this.containerEl.style.height = '100vh'
  }

  state: KanGameWindowWrapperState = {}

  componentDidMount() {
    try {
      this.initWindow()
      config.addListener('config.set', this.handleConfigChange)
    } catch (e) {
      console.error(e)
    }
  }

  componentWillUnmount() {
    config.removeListener('config.set', this.handleConfigChange)
    try {
      if (this.externalWindow) {
        this.externalWindow.onbeforeunload = null
        this.externalWindow.close()
      }
      window.externalWindow = undefined
    } catch (e) {
      console.error(e)
    }
  }

  componentDidCatch = (error: Error, info: React.ErrorInfo) => {
    console.error(error, info)
    this.setState({ hasError: true })
    try {
      if (this.externalWindow) {
        this.externalWindow.onbeforeunload = null
        this.externalWindow.close()
      }
    } catch (e) {
      console.error(e)
    }
  }

  handleConfigChange = <P extends ConfigPath, V extends ConfigValue<P>>(path: P, value: V) => {
    if (!this.externalWindow && !this.currentWindow) return
    switch (path) {
      case 'poi.webview.windowUseFixedResolution': {
        this.currentWindow!.setResizable(!value)
        this.resizable = !value as boolean
        if (value) {
          const width = config.get('poi.webview.windowWidth', 1200)
          this.currentWindow!.setContentSize(
            width,
            Math.round(
              (width / 1200) * 720 + this.getYOffset() * config.get('poi.appearance.zoom', 1),
            ),
          )
        }
        dispatch({
          type: '@@LayoutUpdate/webview/windowUseFixedResolution',
          value,
        })
        break
      }
      case 'poi.webview.windowWidth': {
        if (typeof value === 'number') {
          this.currentWindow!.setContentSize(
            value,
            Math.round(
              (value / 1200) * 720 + this.getYOffset() * config.get('poi.appearance.zoom', 1),
            ),
          )
        }
        break
      }
      case 'poi.appearance.zoom': {
        if (typeof value === 'number') {
          this.onZoomChange(value)
        }
        break
      }
    }
  }

  useCustomTitlebar = () =>
    config.get(
      'poi.appearance.customtitlebar',
      process.platform === 'win32' || process.platform === 'linux',
    )

  getYOffset = () => (this.useCustomTitlebar() ? 60 : 30)

  initWindow = () => {
    const windowOptions = getPluginWindowRect()
    const windowUseFixedResolution = config.get('poi.webview.windowUseFixedResolution', true)
    if (windowUseFixedResolution) {
      windowOptions.width = config.get('poi.webview.windowWidth', 1200) as number
      windowOptions.height = Math.round(
        (windowOptions.width / 1200) * 720 +
          this.getYOffset() * (config.get('poi.appearance.zoom', 1) as number),
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
    this.externalWindow = open(
      `${fileUrl(join(ROOT, 'index-plugin.html'))}?kangame`,
      'plugin[kangame]',
      windowFeatures +
        ',nodeIntegration=no,nodeIntegrationInSubFrames=yes,webSecurity=no,contextIsolation=no',
    )
    this.externalWindow!.addEventListener('DOMContentLoaded', () => {
      this.currentWindow =
        BrowserWindow.getAllWindows().find((a) =>
          a.webContents.getURL().endsWith('index-plugin.html?kangame'),
        ) ?? null
      loadScript(
        fileUrl(require.resolve('assets/js/webview-window-preload.js')),
        this.externalWindow!.document,
      )
      this.currentWindow!.setResizable(!windowUseFixedResolution)
      this.resizable = !windowUseFixedResolution
      this.currentWindow!.setAspectRatio(1200 / 720, {
        width: 0,
        height: Math.round(this.getYOffset() * config.get('poi.appearance.zoom', 1)),
      })
      this.externalWindow!.addEventListener(
        'resize',
        debounce(() => {
          if (process.platform !== 'darwin') {
            this.currentWindow!.setContentSize(
              Math.round(this.externalWindow!.innerWidth * config.get('poi.appearance.zoom', 1)),
              Math.round(
                ((this.externalWindow!.innerWidth / 1200) * 720 + this.getYOffset()) *
                  config.get('poi.appearance.zoom', 1),
              ),
            )
          }
          getStore('layout.webview.ref')?.executeJavaScript('window.align()')
          const wv = this.externalWindow!.document.querySelector('webview')
          if (wv) {
            const { width: windowWidth, height: windowHeight } = wv.getBoundingClientRect()
            dispatch({
              type: '@@LayoutUpdate/webview/size',
              value: { windowWidth, windowHeight },
            })
          }
        }, 200),
      )
      this.externalWindow!.document.head.innerHTML = `<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="script-src https://www.google-analytics.com 'self' file://* 'unsafe-inline'">
<link rel="stylesheet" type="text/css" id="bootstrap-css">
<link rel="stylesheet" type="text/css" id="normalize-css">
<link rel="stylesheet" type="text/css" id="blueprint-css">
<link rel="stylesheet" type="text/css" id="blueprint-icon-css">
<link rel="stylesheet" type="text/css" id="fontawesome-css">
<link rel="stylesheet" type="text/css" href="${fileUrl(require.resolve('assets/css/app.css'))}">
<link rel="stylesheet" type="text/css" href="${fileUrl(require.resolve('assets/css/global.css'))}">
<link rel="stylesheet" type="text/css" href="${fileUrl(
        require.resolve('electron-react-titlebar/style'),
      )}">`
      if (process.platform === 'darwin') {
        const div = document.createElement('div')
        div.style.position = 'absolute'
        div.style.top = '0'
        div.style.height = '23px'
        div.style.width = '100%'
        div.style.setProperty('-webkit-app-region', 'drag')
        div.style.setProperty('pointer-events', 'none')
        this.externalWindow!.document.body.appendChild(div)
      } else {
        this.currentWindow!.setMenu(appMenu)
        this.currentWindow!.setAutoHideMenuBar(true)
        this.currentWindow!.setMenuBarVisibility(false)
      }
      this.externalWindow!.document.body.appendChild(this.containerEl)
      this.externalWindow!.document.title = 'poi'
      loadStyle(this.externalWindow!.document, this.currentWindow!, false)
      const { stopFileNavigate, handleWebviewPreloadHack } =
        remote.require('./lib/webcontent-utils')
      stopFileNavigate(this.currentWindow!.webContents.id)
      handleWebviewPreloadHack(this.currentWindow!.webContents.id)
      this.externalWindow!.addEventListener('beforeunload', () => {
        config.set('poi.kangameWindow.bounds', this.currentWindow!.getBounds())
      })
      if (windowUseFixedResolution) {
        const width = config.get('poi.webview.windowWidth', 1200) as number
        this.currentWindow!.setContentSize(
          width,
          Math.round(
            (width / 1200) * 720 +
              this.getYOffset() * (config.get('poi.appearance.zoom', 1) as number),
          ),
        )
      }
      this.currentWindow!.blur()
      this.currentWindow!.focus()
      this.setState(
        {
          loaded: true,
          id: this.currentWindow!.id,
        },
        () => this.onZoomChange(config.get('poi.appearance.zoom', 1)),
      )
    })
  }

  checkBrowserWindowExistence = () => {
    if (!this.state.id || !BrowserWindow.fromId(this.state.id) || !this.currentWindow) {
      if (this.state.loaded) {
        console.warn('Webview window not exists. Removing window...')
        config.set('poi.layout.isolate', false)
      }
      return false
    }
    return true
  }

  forceSyncZoom = (count = 0) => {
    const webview = getStore('layout.webview.ref')
    if (webview) {
      webview.forceSyncZoom()
    } else if (count < 20) {
      setTimeout(() => this.forceSyncZoom(count + 1), 100)
    }
  }

  onZoomChange = (value: number) => {
    if (
      this.state.loaded &&
      this.checkBrowserWindowExistence() &&
      this.currentWindow?.webContents
    ) {
      const [width, height] = this.currentWindow!.getContentSize()
      this.currentWindow!.setContentSize(width - 10, height - 10)
      this.currentWindow!.setContentSize(width, height)

      this.currentWindow!.webContents.setZoomFactor(value)
      this.forceSyncZoom()
    }
  }

  focusWindow = () => {
    if (this.checkBrowserWindowExistence()) {
      this.currentWindow!.focus()
    }
  }

  render() {
    if (
      this.state.hasError ||
      !this.state.loaded ||
      !this.externalWindow ||
      !this.checkBrowserWindowExistence()
    )
      return null
    return ReactDOM.createPortal(
      <>
        {this.useCustomTitlebar() && (
          <TitleBar
            icon={join(ROOT, 'assets', 'icons', 'poi_32x32.png')}
            browserWindowId={this.currentWindow!.id}
          />
        )}
        <WindowEnv.Provider
          value={{
            window: this.externalWindow,
            mountPoint: this.containerEl,
          }}
        >
          <StyleSheetManager target={this.externalWindow.document.head}>
            <PoiAppTabpane className="poi-app-tabpane" ref={this.kangameContainer}>
              <KanGameWrapper windowMode key="window" />
            </PoiAppTabpane>
          </StyleSheetManager>
        </WindowEnv.Provider>
      </>,
      this.externalWindow.document.querySelector('#plugin-mountpoint')!,
    )
  }
}
