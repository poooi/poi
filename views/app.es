import React from 'react'
import ReactDOM from 'react-dom'
import fs from 'fs-extra'
import path from 'path-extra'
import { Provider } from 'react-redux'
import { remote, webFrame } from 'electron'

import { store } from './create-store'
import ControlledTabArea from './tabarea'
import { PoiAlert } from './components/info/alert'
import PoiMapReminder from './components/info/map-reminder'
import { PoiControl } from './components/info/control'
import { Toastr } from './components/info/toastr'
import { ModalTrigger } from './components/etc/modal'
import { BasicAuth } from './utils/http-basic-auth'

// FIXME: Hack for letting react-bootstrap modal works under 16
import { Modal } from 'react-overlays'
Modal.prototype.componentWillMount = function () {
  this.focus = () => {}
}

const {EXROOT, $} = window
const config = remote.require('./lib/config')

// Disable OSX zoom
webFrame.setZoomLevelLimits(1, 1)

// Workaround for false BrowserWindow size
if (!config.get('poi.window.isMaximized', false) && !config.get('poi.window.isFullScreen', false) &&
  config.get('poi.window.width') && config.get('poi.window.height')) {
  remote.getCurrentWindow().setSize(config.get('poi.window.width'), config.get('poi.window.height'))
}

// Hackable panels
window.hack = {}

// Alert functions
require('./services/alert')

const { TitleBarWrapper } = require('./components/etc/menu')
const CustomCssInjector = () => {
  const cssPath = path.join(EXROOT, 'hack', 'custom.css')
  fs.ensureFileSync(cssPath)
  return (
    <link rel='stylesheet' id='custom-css' href={cssPath} />
  )
}

if (config.get('poi.useCustomTitleBar', process.platform === 'win32' || process.platform === 'linux')) {
  ReactDOM.render(
    <TitleBarWrapper />,
    $('title-bar')
  )
}
ReactDOM.render(
  <Provider store={store}>
    <PoiControl />
  </Provider>,
  $('poi-control')
)
ReactDOM.render(
  <Provider store={store}>
    <PoiAlert id='poi-alert' />
  </Provider>,
  $('poi-alert')
)
ReactDOM.render(
  <Provider store={store}>
    <PoiMapReminder id='poi-map-reminder'/>
  </Provider>,
  $('poi-map-reminder')
)
ReactDOM.render(
  <Provider store={store}>
    <ControlledTabArea />
  </Provider>,
  $('poi-nav-tabs')
)
ReactDOM.render(<ModalTrigger />, $('poi-modal-trigger'))
ReactDOM.render(<Toastr />, $('poi-toast-trigger'))
ReactDOM.render(<CustomCssInjector />, $('poi-css-injector'))
ReactDOM.render(<BasicAuth />, $('poi-auth-trigger'))
