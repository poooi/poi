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
import { TitleBarWrapper } from './components/etc/menu'

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

const CustomCssInjector = () => {
  const cssPath = path.join(EXROOT, 'hack', 'custom.css')
  fs.ensureFileSync(cssPath)
  return (
    <link rel='stylesheet' id='custom-css' href={cssPath} />
  )
}

ReactDOM.render(
  <Provider store={store}>
    <div>
      { config.get('poi.useCustomTitleBar', process.platform === 'win32' || process.platform === 'linux') && ReactDOM.createPortal(<TitleBarWrapper />, $('title-bar')) }
      { ReactDOM.createPortal(<PoiControl />, $('poi-control')) }
      { ReactDOM.createPortal(<PoiAlert id='poi-alert' />, $('poi-alert')) }
      { ReactDOM.createPortal(<PoiMapReminder id='poi-map-reminder'/>, $('poi-map-reminder')) }
      <ControlledTabArea />
      { ReactDOM.createPortal(<ModalTrigger />, $('poi-modal-trigger')) }
      { ReactDOM.createPortal(<Toastr />, $('poi-toast-trigger')) }
      { ReactDOM.createPortal(<CustomCssInjector />, $('poi-css-injector')) }
      { ReactDOM.createPortal(<BasicAuth />, $('poi-auth-trigger')) }
    </div>
  </Provider>,
  $('poi-nav-tabs')
)
