import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import path from 'path-extra'
import { TitleBar } from 'electron-react-titlebar'
import { normalizeURL } from 'views/utils/tools'

const pickOptions = ['ROOT', 'EXROOT', 'toast', 'notify', 'toggleModal', 'i18n', 'config', 'getStore']

export class PluginWindowWrap extends PureComponent {
  constructor(props) {
    super(props)
    this.containerEl = document.createElement('div')
    this.containerEl.className = "poi-app-tabpane poi-plugin"
    this.externalWindow = null
  }

  state = {}

  componentDidMount() {
    this.externalWindow = window.open(`file:///${__dirname}/index-plugin.html?${this.props.plugin.id}`, 'plugin')
    this.externalWindow.addEventListener('DOMContentLoaded', e => {
      this.externalWindow.document.head.innerHTML =
`<meta charset="utf-8">
<link rel="stylesheet" id="bootstrap-css">
<link rel="stylesheet" id="fontawesome-css">
<link rel="stylesheet" href="${normalizeURL(require.resolve('assets/css/app.css'))}">
<link rel="stylesheet" href="${normalizeURL(require.resolve('assets/css/global.css'))}">`
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
      for (const pickOption of pickOptions) {
        this.externalWindow[pickOption] = window[pickOption]
      }
      this.externalWindow.require(require.resolve('./env-parts/theme'))
      this.externalWindow.addEventListener('beforeunload', () => {
        this.props.closeWindowPortal()
      })
      window.addEventListener(`${this.props.plugin.id}-focus`, this.focusWindow)
      this.setState({ loaded: true })
    })
  }

  componentWillUnmount() {
    window.removeEventListener(`${this.props.plugin.id}-focus`, this.focusWindow)
    this.externalWindow.close()
  }

  componentDidCatch = (error, info) => {
    console.error(error, info)
    this.setState({
      hasError: true,
    })
    this.externalWindow.close()
  }

  focusWindow = e => this.externalWindow.require('electron').remote.getCurrentWindow().focus()

  render() {
    if (this.state.hasError || !this.state.loaded) return null
    return ReactDOM.createPortal(
      <div>
        {
          window.config.get('poi.useCustomTitleBar', process.platform === 'win32' || process.platform === 'linux') &&
          <TitleBar icon={path.join(window.ROOT, 'assets', 'icons', 'poi_32x32.png')} currentWindow={this.externalWindow.require('electron').remote.getCurrentWindow()}>
            <link rel="stylesheet" type="text/css" href={require.resolve('electron-react-titlebar/assets/style.css')} />
          </TitleBar>
        }
        <this.props.plugin.reactClass />
      </div>,
      this.externalWindow.document.querySelector('.poi-plugin'))
  }
}
