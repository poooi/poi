/* global config, ROOT, getStore, dispatch */
import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import path from 'path-extra'
import { TitleBar } from 'electron-react-titlebar/renderer'
import * as remote from '@electron/remote'
import { fileUrl, loadScript } from 'views/utils/tools'
import { WindowEnv } from 'views/components/etc/window-env'
import { KanGameWrapper } from './kan-game-wrapper'
import { debounce } from 'lodash'
import styled, { StyleSheetManager } from 'styled-components'
import { loadStyle } from './env-parts/theme'
import { appMenu } from 'views/components/etc/menu'

const pickOptions = [
  'ROOT',
  'EXROOT',
  'toast',
  'notify',
  'toggleModal',
  'i18n',
  'config',
  'getStore',
]

const { BrowserWindow, screen } = remote
const { workArea } = screen.getPrimaryDisplay()
const getPluginWindowRect = () => {
  const defaultRect = { width: 1200, height: 780 }
  let { x, y, width, height } = config.get('poi.kangameWindow.bounds', defaultRect)
  if (x == null || y == null) {
    return defaultRect
  }
  const validate = (n, min, range) => n != null && n >= min && n < min + range
  const withinDisplay = (d) => {
    const wa = d.workArea
    return validate(x, wa.x, wa.width) && validate(y, wa.y, wa.height)
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

export class KanGameWindowWrapper extends PureComponent {
  constructor(props) {
    super(props)
    this.containerEl = document.createElement('div')
    this.containerEl.id = 'plugin-mountpoint'
    this.containerEl.style['display'] = 'flex'
    this.containerEl.style['flex-direction'] = 'column'
    this.containerEl.style['height'] = '100vh'
    this.externalWindow = null
  }

  state = {}

  kangameContainer = React.createRef()

  componentDidMount() {
    try {
      this.initWindow()
      config.addListener('config.set', this.handleConfigChange)
    } catch (e) {
      console.error(e)
      this.props.closeWindowPortal()
    }
  }

  componentWillUnmount() {
    config.removeListener('config.set', this.handleConfigChange)
    try {
      this.externalWindow.onbeforeunload = null
      this.externalWindow.close()
      delete window.externalWindow
    } catch (e) {
      console.error(e)
    }
  }

  componentDidCatch = (error, info) => {
    console.error(error, info)
    this.setState({
      hasError: true,
    })
    try {
      this.externalWindow.onbeforeunload = null
      this.externalWindow.close()
    } catch (e) {
      console.error(e)
    }
  }

  handleConfigChange = (path, value) => {
    if (!this.externalWindow && !this.currentWindow) return
    switch (path) {
      case 'poi.webview.windowUseFixedResolution': {
        this.currentWindow.setResizable(!value)
        this.resizable = !value
        if (value) {
          const width = config.get('poi.webview.windowWidth', 1200)
          this.currentWindow.setContentSize(
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
        this.currentWindow.setContentSize(
          value,
          Math.round(
            (value / 1200) * 720 + this.getYOffset() * config.get('poi.appearance.zoom', 1),
          ),
        )
        break
      }
      case 'poi.appearance.zoom': {
        this.onZoomChange(value)
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
      windowOptions.width = config.get('poi.webview.windowWidth', 1200)
      windowOptions.height = Math.round(
        (windowOptions.width / 1200) * 720 +
          this.getYOffset() * config.get('poi.appearance.zoom', 1),
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
      `${fileUrl(path.join(ROOT, 'index-plugin.html'))}?kangame`,
      'plugin[kangame]',
      windowFeatures +
        ',nodeIntegration=no,nodeIntegrationInSubFrames=yes,webSecurity=no,contextIsolation=no',
    )
    this.externalWindow.addEventListener('DOMContentLoaded', (e) => {
      this.currentWindow = BrowserWindow.getAllWindows().find((a) =>
        a.getURL().endsWith('index-plugin.html?kangame'),
      )
      loadScript(
        fileUrl(require.resolve('assets/js/webview-window-preload.js')),
        this.externalWindow.document,
      )
      this.currentWindow.setResizable(!windowUseFixedResolution)
      this.resizable = !windowUseFixedResolution
      this.currentWindow.setAspectRatio(1200 / 720, {
        width: 0,
        height: Math.round(this.getYOffset() * config.get('poi.appearance.zoom', 1)),
      })
      this.externalWindow.addEventListener(
        'resize',
        debounce(() => {
          if (process.platform !== 'darwin') {
            this.currentWindow.setContentSize(
              Math.round(this.externalWindow.innerWidth * config.get('poi.appearance.zoom', 1)),
              Math.round(
                ((this.externalWindow.innerWidth / 1200) * 720 + this.getYOffset()) *
                  config.get('poi.appearance.zoom', 1),
              ),
            )
          }
          if (getStore('layout.webview.ref')) {
            getStore('layout.webview.ref').executeJavaScript('window.align()')
          }
          if (this.externalWindow.document.querySelector('webview')) {
            const { width: windowWidth, height: windowHeight } = this.externalWindow.document
              .querySelector('webview')
              .getBoundingClientRect()
            dispatch({
              type: '@@LayoutUpdate/webview/size',
              value: {
                windowWidth,
                windowHeight,
              },
            })
          }
        }, 200),
      )
      this.externalWindow.document.head.innerHTML = `<meta charset="utf-8">
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
        div.style.top = 0
        div.style.height = '23px'
        div.style.width = '100%'
        div.style['-webkit-app-region'] = 'drag'
        div.style['pointer-events'] = 'none'
        this.externalWindow.document.body.appendChild(div)
      } else {
        this.currentWindow.setMenu(appMenu)
        this.currentWindow.setAutoHideMenuBar(true)
        this.currentWindow.setMenuBarVisibility(false)
      }
      this.externalWindow.document.body.appendChild(this.containerEl)
      this.externalWindow.document.title = 'poi'
      this.externalWindow.isWindowMode = true
      loadStyle(this.externalWindow.document, this.currentWindow, false)
      const { stopFileNavigate, handleWebviewPreloadHack } =
        remote.require('./lib/webcontent-utils')
      stopFileNavigate(this.currentWindow.webContents.id)
      handleWebviewPreloadHack(this.currentWindow.webContents.id)
      for (const pickOption of pickOptions) {
        this.externalWindow[pickOption] = window[pickOption]
      }
      this.externalWindow.addEventListener('beforeunload', (e) => {
        config.set('poi.kangameWindow.bounds', this.currentWindow.getBounds())
      })
      if (windowUseFixedResolution) {
        const width = config.get('poi.webview.windowWidth', 1200)
        this.currentWindow.setContentSize(
          width,
          Math.round(
            (width / 1200) * 720 + this.getYOffset() * config.get('poi.appearance.zoom', 1),
          ),
        )
      }
      this.currentWindow.blur()
      this.currentWindow.focus()
      this.setState(
        {
          loaded: true,
          id: this.currentWindow.id,
        },
        () => this.onZoomChange(config.get('poi.appearance.zoom', 1)),
      )

      // workaround for https://github.com/electron/electron/issues/22440
      const unsetResizable = debounce(() => {
        this.currentWindow.setResizable(true)
      }, 200)

      const setResizable = () => {
        this.currentWindow.setResizable(this.resizable)
      }

      this.currentWindow.on('minimize', unsetResizable)
      this.currentWindow.on('maximize', unsetResizable)

      this.currentWindow.on('restore', setResizable)
      this.currentWindow.on('unmaximize', setResizable)
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

  onZoomChange = (value) => {
    if (
      this.state.loaded &&
      this.checkBrowserWindowExistence() &&
      this.currentWindow.getContentSize &&
      this.currentWindow.webContents &&
      this.currentWindow.webContents.setZoomFactor
    ) {
      // Workaround for ResizeObserver not fired on zoomFactor change
      const [width, height] = this.currentWindow.getContentSize()
      this.currentWindow.setContentSize(width - 10, height - 10)
      this.currentWindow.setContentSize(width, height)

      this.currentWindow.webContents.setZoomFactor(value)
      this.forceSyncZoom()
    }
  }

  focusWindow = () => {
    if (this.checkBrowserWindowExistence()) {
      this.currentWindow.focus()
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
            icon={path.join(ROOT, 'assets', 'icons', 'poi_32x32.png')}
            browserWindowId={this.currentWindow.id}
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
      this.externalWindow.document.querySelector('#plugin-mountpoint'),
    )
  }
}
