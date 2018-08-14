import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import path from 'path-extra'
import { TitleBar } from 'electron-react-titlebar'
import { screen } from 'electron'
import { normalizeURL } from 'views/utils/tools'
import { WindowEnv } from 'views/components/etc/window-env'
import { KanGameWrapper } from './kan-game-wrapper'
import { debounce } from 'lodash'

const pickOptions = ['ROOT', 'EXROOT', 'toast', 'notify', 'toggleModal', 'i18n', 'config', 'getStore']

const { workArea } = screen.getPrimaryDisplay()
const { config } = window
const getPluginWindowRect = () => {
  const defaultRect = { width: 800, height: 542 }
  let { x, y, width, height } = config.get('poi.kangameWindow.bounds', defaultRect)
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


export class KanGameWindowWrapper extends PureComponent {
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

  kangameContainer = React.createRef()

  componentDidMount() {
    try {
      this.initWindow()
      // config.addListener('config.set', this.handleZoom)
    } catch(e) {
      console.error(e)
      this.props.closeWindowPortal()
    }
  }

  componentWillUnmount() {
    // config.removeListener('config.set', this.handleZoom)
    try {
      this.externalWindow.remote.getCurrentWindow().setClosable(true)
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
      this.externalWindow.remote.getCurrentWindow().setClosable(true)
      this.externalWindow.close()
    } catch (e) {
      console.error(e)
    }
  }

  initWindow = () => {
    const windowOptions = getPluginWindowRect()
    const windowFeatures = Object.keys(windowOptions).map(key => {
      switch (key) {
      case 'x': return `left=${windowOptions.x}`
      case 'y': return `top=${windowOptions.y}`
      case 'width': return `width=${windowOptions.width}`
      case 'height': return `height=${windowOptions.height}`
      }
    }).join(',')
    this.externalWindow = window.open(`file:///${__dirname}/../index-plugin.html?kangame`, 'plugin[kangame]', windowFeatures)
    this.externalWindow.addEventListener('DOMContentLoaded', e => {
      this.externalWindow.document.head.innerHTML =
`<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="script-src https://www.google-analytics.com 'self' file://* 'unsafe-inline'">
<link rel="stylesheet" type="text/css" id="bootstrap-css">
<link rel="stylesheet" type="text/css" id="fontawesome-css">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('assets/css/app.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('assets/css/global.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('electron-react-titlebar/assets/style.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('views/components/info/assets/alert.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('views/components/info/assets/control.css'))}">
<link rel="stylesheet" type="text/css" href="${normalizeURL(require.resolve('views/components/info/assets/map-reminder.css'))}">`
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
      this.externalWindow.document.title = 'poi'
      this.externalWindow.isWindowMode = true
      if (require.resolve(path.join(__dirname, 'env-parts', 'theme')).endsWith('.es')) {
        this.externalWindow.require('@babel/register')(this.externalWindow.require(path.join(window.ROOT, 'babel.config')))
      }
      this.externalWindow.$ = param => this.externalWindow.document.querySelector(param)
      this.externalWindow.$$ = param => this.externalWindow.document.querySelectorAll(param)
      this.externalWindow.remote = this.externalWindow.require('electron').remote
      this.externalWindow.remote.getCurrentWindow().setAspectRatio(800 / 480, { width: 0, height: 62 })
      this.externalWindow.addEventListener('resize', debounce(() => {
        if (process.platform !== 'darwin') {
          this.externalWindow.remote.getCurrentWindow().setSize(this.externalWindow.innerWidth, Math.round(this.externalWindow.innerWidth / 800 * 480 + 62))
        }
        if (window.getStore('layout.webview.ref')) {
          window.getStore('layout.webview.ref').executeJavaScript('window.align()')
        }
      }, 200))
      this.externalWindow.remote.require('./lib/utils').stopFileNavigate(this.externalWindow.remote.getCurrentWebContents().id)
      for (const pickOption of pickOptions) {
        this.externalWindow[pickOption] = window[pickOption]
      }
      this.externalWindow.require(require.resolve('./env-parts/theme'))
      window.externalWindow = this.externalWindow
      this.externalWindow.remote.getCurrentWindow().setClosable(false)
      this.externalWindow.onbeforeunload = (e) => {
        config.set(`poi.kangameWindow.bounds`, this.externalWindow.remote.getCurrentWindow().getBounds())
      }
      this.setState({ loaded: true }, () => this.onZoomChange(config.get('poi.zoomLevel', 1)))
    })
  }


  onZoomChange = (value) => {
    this.kangameContainer.current.style.zoom = value
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
          <div className="poi-app-tabpane poi-plugin" style={{ flex: 1, overflow: 'auto' }} ref={this.kangameContainer}>
            <KanGameWrapper windowMode />
          </div>
        </WindowEnv.Provider>
      </>,
      this.externalWindow.document.querySelector('#plugin-mountpoint'))
  }
}
