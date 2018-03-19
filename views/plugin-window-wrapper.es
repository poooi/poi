import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import path from 'path-extra'

export class PluginWindowWrap extends PureComponent {
  constructor(props) {
    super(props)
    this.containerEl = document.createElement('div')
    this.containerEl.className = "poi-app-tabpane poi-plugin"
    this.externalWindow = null
  }

  state = {}

  componentDidMount() {
    this.externalWindow = window.open('', '', 'width=600,height=500')
    this.externalWindow.document.head.innerHTML =
`<meta charset="utf-8">
<link rel="stylesheet" id="bootstrap-css">
<link rel="stylesheet" id="fontawesome-css">`
    this.externalWindow.document.body.appendChild(this.containerEl)
    this.externalWindow.document.title = this.props.plugin.id
    this.externalWindow.isWindowMode = true
    this.externalWindow.require('coffee-script/register')
    this.externalWindow.require('@babel/register')(this.externalWindow.require(path.join(window.ROOT, 'babel.config')))
    this.externalWindow.config = window.config
    this.externalWindow.getStore = window.getStore
    this.externalWindow.require(path.join(__dirname, 'env'))
    this.externalWindow.addEventListener('beforeunload', () => {
      this.props.closeWindowPortal()
    })
    window.addEventListener(`${this.props.plugin.id}-focus`, this.focusWindow)
    this.setState({ loaded: true })
  }

  componentWillUnmount() {
    window.removeEventListener(`${this.props.plugin.id}-focus`, this.focusWindow)
    this.externalWindow.close()
  }

  focusWindow = e => this.externalWindow.focus()

  render() {
    return this.state.loaded ? ReactDOM.createPortal(<this.props.plugin.reactClass />, this.externalWindow.document.querySelector('.poi-plugin')) : null
  }
}
