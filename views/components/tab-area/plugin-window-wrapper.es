/* global config, ROOT */
import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import path from 'path-extra'
import { TitleBar } from 'electron-react-titlebar'
import { screen, remote } from 'electron'
import { fileUrl } from 'views/utils/tools'
import { WindowEnv } from 'views/components/etc/window-env'
import styled, { StyleSheetManager } from 'styled-components'
import { loadStyle } from 'views/env-parts/theme'
import { appMenu } from 'views/components/etc/menu'

import { PluginWrap } from './plugin-wrapper'

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
const { BrowserWindow } = remote
const ipc = remote.require('./lib/ipc')
const { workArea } = screen.getPrimaryDisplay()
const getPluginWindowRect = plugin => {
  const defaultRect = plugin.windowMode ? { width: 800, height: 700 } : { width: 600, height: 500 }
  let { x, y, width, height } = config.get(`plugin.${plugin.id}.bounds`, defaultRect)
  if (x == null || y == null) {
    return defaultRect
  }
  const validate = (n, min, range) => n != null && n >= min && n < min + range
  const withinDisplay = d => {
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

const stylesheetTagsWithID = [
  'bootstrap',
  'normalize',
  'blueprint',
  'blueprint-icon',
  'fontawesome',
]
  .map(id => `<link rel="stylesheet" type="text/css" id="${id}-css">`)
  .join('')

const stylesheetTagsWithHref = [
  'assets/css/app.css',
  'assets/css/global.css',
  'electron-react-titlebar/assets/style.css',
  'react-resizable/css/styles.css',
  'react-grid-layout/css/styles.css',
]
  .map(href => `<link rel="stylesheet" type="text/css" href="${fileUrl(require.resolve(href))}">`)
  .join('')

export class PluginWindowWrap extends PureComponent {
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

  pluginContainer = React.createRef()

  componentDidMount() {
    try {
      this.initWindow()
      config.addListener('config.set', this.handleZoom)
    } catch (e) {
      console.error(e)
      this.props.closeWindowPortal()
    }
  }

  componentWillUnmount() {
    config.removeListener('config.set', this.handleZoom)
    try {
      this.externalWindow.close()
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
      this.externalWindow.close()
    } catch (e) {
      console.error(e)
    }
  }

  initWindow = () => {
    const windowOptions = getPluginWindowRect(this.props.plugin)
    const windowFeatures = Object.keys(windowOptions)
      .map(key => {
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
    const URL = `${fileUrl(path.join(ROOT, 'index-plugin.html'))}?${this.props.plugin.id}`
    this.externalWindow = open(
      URL,
      `plugin[${this.props.plugin.id}]`,
      windowFeatures + ',nodeIntegration=no',
    )
    this.externalWindow.addEventListener('DOMContentLoaded', e => {
      this.currentWindow = BrowserWindow.getAllWindows().find(a =>
        a.getURL().endsWith(this.props.plugin.id),
      )
      this.externalWindow.document.head.innerHTML = `<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="script-src https://www.google-analytics.com 'self' file://* 'unsafe-inline'">
${stylesheetTagsWithID}${stylesheetTagsWithHref}`
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
      this.externalWindow.document.title = this.props.plugin.name
      this.externalWindow.isWindowMode = true
      loadStyle(this.externalWindow.document, this.currentWindow, false)
      remote.require('./lib/utils').stopFileNavigate(this.currentWindow.webContents.id)
      for (const pickOption of pickOptions) {
        this.externalWindow[pickOption] = window[pickOption]
      }
      this.externalWindow.addEventListener('beforeunload', () => {
        this.setState({
          loaded: false,
        })
        config.set(`plugin.${this.props.plugin.id}.bounds`, this.currentWindow.getBounds())
        try {
          this.props.closeWindowPortal()
        } catch (e) {
          console.error(e)
        }
      })
      this.setState(
        {
          loaded: true,
          id: this.currentWindow.id,
        },
        () => this.onZoomChange(config.get('poi.appearance.zoom', 1)),
      )
    })
  }

  checkBrowserWindowExistence = () => {
    if (!this.state.id || !BrowserWindow.fromId(this.state.id) || !this.currentWindow) {
      console.warn('Plugin window not exists. Removing window...')
      try {
        this.props.closeWindowPortal()
      } catch (e) {
        console.error(e)
      }
      return false
    }
    return true
  }

  onZoomChange = value => {
    if (this.checkBrowserWindowExistence()) {
      this.currentWindow.webContents.setZoomFactor(value)
    }
  }

  handleZoom = (path, value) => {
    if (path === 'poi.appearance.zoom') {
      this.onZoomChange(value)
    }
  }

  focusWindow = () => {
    if (this.checkBrowserWindowExistence()) {
      this.currentWindow.focus()
    } else {
      setImmediate(() => {
        ipc.access('MainWindow').ipcFocusPlugin(this.props.plugin.id)
      })
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
        {config.get(
          'poi.appearance.customtitlebar',
          process.platform === 'win32' || process.platform === 'linux',
        ) && (
          <TitleBar
            icon={path.join(ROOT, 'assets', 'icons', 'poi_32x32.png')}
            currentWindow={this.currentWindow}
          />
        )}
        <WindowEnv.Provider
          value={{
            window: this.externalWindow,
            mountPoint: this.containerEl,
          }}
        >
          <StyleSheetManager target={this.externalWindow.document.head}>
            <PoiAppTabpane className="poi-app-tabpane" ref={this.pluginContainer}>
              <PluginWrap key={this.props.plugin.id} plugin={this.props.plugin} />
            </PoiAppTabpane>
          </StyleSheetManager>
        </WindowEnv.Provider>
      </>,
      this.externalWindow.document.querySelector('#plugin-mountpoint'),
    )
  }
}
