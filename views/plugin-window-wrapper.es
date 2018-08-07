import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import path from 'path-extra'
import { TitleBar } from 'electron-react-titlebar'
import { screen } from 'electron'
import { normalizeURL } from 'views/utils/tools'
import { WindowEnv } from 'views/components/etc/window-env'
import { PluginWrap } from './plugin-wrapper'

const pickOptions = ['ROOT', 'EXROOT', 'toast', 'notify', 'toggleModal', 'i18n', 'config', 'getStore']

const { workArea } = screen.getPrimaryDisplay()
const { config } = window
const getPluginWindowRect = plugin => {
  const defaultRect = plugin.windowMode ? { width: 800, height: 700 } : { width: 600, height: 500 }
  let { x, y, width, height } = config.get(`plugin.${plugin.id}.bounds`, defaultRect)
  if (x == null || y == null) {
    return defaultRect
  }
  const validate = (n, min, range) => (n != null && n >= min && n < min + range)
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


export class PluginWindowWrap extends PureComponent {
  constructor(props) {
    super(props)
    this.containerEl = document.createElement('div')
    this.containerEl.id = "plugin-mountpoint"
    this.containerEl.style['display'] = 'flex'
    this.containerEl.style['flex-direction'] = "column"
    this.containerEl.style['height'] = "100vh"
    this.externalWindow = null
  }

  state = {}

  pluginContainer = React.createRef()

  componentDidMount() {
    try {
      this.initWindow()
      config.addListener('config.set', this.handleZoom)
    } catch(e) {
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
    const windowFeatures = Object.keys(windowOptions).map(key => {
      switch (key) {
      case 'x': return `left=${windowOptions.x}`
      case 'y': return `top=${windowOptions.y}`
      case 'width': return `width=${windowOptions.width}`
      case 'height': return `height=${windowOptions.height}`
      }
    }).join(',')
    this.externalWindow = window.open(`file:///${__dirname}/../index-plugin.html?${this.props.plugin.id}`, `plugin[${this.props.plugin.id}]`, windowFeatures)
    this.externalWindow.addEventListener('DOMContentLoaded', e => {
      this.externalWindow.document.head.innerHTML =
`<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="script-src https://www.google-analytics.com 'self' file://* 'unsafe-inline'">
<link rel="stylesheet" type="text/css" id="bootstrap-css">
<link rel="stylesheet" type="text/css" id="fontawesome-css">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('assets/css/app.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('assets/css/global.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('electron-react-titlebar/assets/style.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('react-resizable/css/styles.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('react-grid-layout/css/styles.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('views/components/etc/assets/avatar.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('views/components/etc/assets/scroll-shadow.css'))}">`
      if (process.platform === 'darwin') {
        const div = document.createElement("div")
        div.style.position = "absolute"
        div.style.top = 0
        div.style.height = "23px"
        div.style.width = "100%"
        div.style["-webkit-app-region"] = "drag"
        div.style["pointer-events"] = "none"
        this.externalWindow.document.body.appendChild(div)
      }
      this.externalWindow.document.body.appendChild(this.containerEl)
      this.externalWindow.document.title = this.props.plugin.name
      this.externalWindow.isWindowMode = true
      if (require.resolve(path.join(__dirname, 'env-parts', 'theme')).endsWith('.es')) {
        this.externalWindow.require('@babel/register')(this.externalWindow.require(path.join(window.ROOT, 'babel.config')))
      }
      this.externalWindow.$ = param => this.externalWindow.document.querySelector(param)
      this.externalWindow.$$ = param => this.externalWindow.document.querySelectorAll(param)
      this.externalWindow.remote = this.externalWindow.require('electron').remote
      this.externalWindow.remote.require('./lib/utils').stopFileNavigate(this.externalWindow.remote.getCurrentWebContents().id)
      for (const pickOption of pickOptions) {
        this.externalWindow[pickOption] = window[pickOption]
      }
      this.externalWindow.require(require.resolve('./env-parts/theme'))
      this.externalWindow.addEventListener('beforeunload', () => {
        config.set(`plugin.${this.props.plugin.id}.bounds`, this.externalWindow.remote.getCurrentWindow().getBounds())
        try {
          this.props.closeWindowPortal()
        } catch(e) {
          console.error(e)
        }
      })
      this.setState({ loaded: true }, () => this.onZoomChange(config.get('poi.zoomLevel', 1)))
    })
  }


  onZoomChange = (value) => {
    this.pluginContainer.current.style.zoom = value
  }

  handleZoom = (path, value) => {
    if (path === 'poi.zoomLevel') {
      this.onZoomChange(value)
    }
  }

  focusWindow = () => this.externalWindow.require('electron').remote.getCurrentWindow().focus()

  render() {
    if (this.state.hasError || !this.state.loaded) return null
    return ReactDOM.createPortal(
      <>
        {
          window.config.get('poi.useCustomTitleBar', process.platform === 'win32' || process.platform === 'linux') &&
          <TitleBar icon={path.join(window.ROOT, 'assets', 'icons', 'poi_32x32.png')} currentWindow={this.externalWindow.require('electron').remote.getCurrentWindow()} />
        }
        <WindowEnv.Provider value={{
          window: this.externalWindow,
          mountPoint: this.containerEl,
        }}>
          <div className="poi-app-tabpane poi-plugin" style={{ flex: 1, overflow: 'auto' }} ref={this.pluginContainer}>
            <PluginWrap
              key={this.props.plugin.id}
              plugin={this.props.plugin}
            />
          </div>
        </WindowEnv.Provider>
      </>,
      this.externalWindow.document.querySelector('#plugin-mountpoint'))
  }
}
