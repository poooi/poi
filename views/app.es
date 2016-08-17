import React from 'react'
import ReactDOM from 'react-dom'
import fs from 'fs-extra'
import path from 'path-extra'
import { Provider } from 'react-redux'

import { store } from './create-store'
import ControlledTabArea from './tabarea'
import { PoiAlert } from './components/info/alert'
import PoiMapReminder from './components/info/map-reminder'
import { PoiControl } from './components/info/control'
import { ModalTrigger } from './components/etc/modal'

const {ROOT, EXROOT, $} = window

// Disable OSX zoom
require('electron').webFrame.setZoomLevelLimits(1, 1)

// Hackable panels
window.hack = {}

// Alert functions
require('./services/alert')

// Module path
require('module').globalPaths.push(path.join(ROOT, "node_modules"))

// poi menu
require('./components/etc/menu')

const CustomCssInjector = () => {
  let cssPath = path.join(EXROOT, 'hack', 'custom.css')
  fs.ensureFileSync(cssPath)
  return (
    <link rel='stylesheet' id='custom-css' href={cssPath} />
  )
}

window.isMain = true

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
ReactDOM.render(<CustomCssInjector />, $('poi-css-injector'))
