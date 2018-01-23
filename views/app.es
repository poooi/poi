import React, { Fragment } from 'react'
import ReactDOM from 'react-dom'
import fs from 'fs-extra'
import path from 'path-extra'
import { Provider } from 'react-redux'
import { remote, webFrame } from 'electron'

import '../assets/css/app.css'
import '../assets/css/global.css'

import { store } from './create-store'
import ControlledTabArea from './tabarea'
import { PoiAlert } from './components/info/alert'
import PoiMapReminder from './components/info/map-reminder'
import { PoiControl } from './components/info/control'
import { Toastr } from './components/info/toastr'
import { ModalTrigger } from './components/etc/modal'
import { BasicAuth } from './utils/http-basic-auth'
import { TitleBarWrapper } from './components/etc/menu'
import WebView from 'react-electron-web-view'

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
    <Fragment>
      <CustomCssInjector />
      <title-bar>
        { config.get('poi.useCustomTitleBar', process.platform === 'win32' || process.platform === 'linux') && <TitleBarWrapper />}
      </title-bar>
      <poi-main>
        <kan-game>
          <div className="kan-game-warpper">
            <div id="webview-wrapper" style={{ height: 480 }}>
              <WebView
                src={config.get('poi.homepage', 'http://www.dmm.com/netgame/social/application/-/detail/=/app_id=854854/')}
                plugins
                disablewebsecurity
                webpreferences="allowRunningInsecureContent=no"
                preload={`${__dirname}/../assets/js/webview-preload.js`}
                style={{ height: '100%' }}
              />
            </div>
            <hr />
            <poi-info>
              <poi-control><PoiControl /></poi-control>
              <poi-alert><PoiAlert id='poi-alert' /></poi-alert>
              <poi-map-reminder><PoiMapReminder id='poi-map-reminder'/></poi-map-reminder>
            </poi-info>
            <hr />
          </div>
        </kan-game>
        <ModalTrigger />
        <Toastr />
        <BasicAuth />
        <poi-app>
          <div id='poi-app-container' className='poi-app-container'>
            <poi-nav>
              <poi-nav-tabs>
                <ControlledTabArea />
              </poi-nav-tabs>
            </poi-nav>
          </div>
        </poi-app>
      </poi-main>
    </Fragment>
  </Provider>,
  $('poi')
)
