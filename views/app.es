import React, { Component, unstable_AsyncMode as Async } from 'react'
import ReactDOM from 'react-dom'
import { connect, Provider } from 'react-redux'
import { remote, webFrame } from 'electron'
import { get } from 'lodash'
import { I18nextProvider } from 'react-i18next'

import '../assets/css/app.css'
import '../assets/css/global.css'

import { store } from './create-store'
import { Toastr } from './components/info/toastr'
import { WindowEnv } from './components/etc/window-env'
import { ModalTrigger } from './components/etc/modal'
import { BasicAuth } from './utils/http-basic-auth'
import { TitleBarWrapper } from './components/etc/menu'
import { KanGameWrapper } from './kan-game-wrapper'
import { KanGameWindowWrapper } from './kan-game-window-wrapper'
import { PoiApp } from './poi-app'
import { layoutResizeObserver } from 'views/services/layout'
import i18next from './env-parts/i18next'

const {$} = window
const config = remote.require('./lib/config')

// Disable OSX zoom
webFrame.setVisualZoomLevelLimits(1, 1)

// Workaround for false BrowserWindow size
if (!config.get('poi.window.isMaximized', false) && !config.get('poi.window.isFullScreen', false) &&
  config.get('poi.window.width') && config.get('poi.window.height')) {
  remote.getCurrentWindow().setSize(config.get('poi.window.width'), config.get('poi.window.height'))
}

// Hackable panels
window.hack = {}

// Alert functions
require('./services/alert')



@connect(state => ({
  isHorizontal: get(state, 'config.poi.layout', 'horizontal') === 'horizontal',
  reversed: get(state, 'config.poi.reverseLayout', false),
  isolateGameWindow: get(state, 'config.poi.isolateGameWindow', false),
}))
class Poi extends Component {
  componentWillUnmount() {
    layoutResizeObserver.unobserve(this.poimain)
  }

  componentDidMount() {
    layoutResizeObserver.observe(this.poimain)
  }
  render() {
    const { isHorizontal, reversed } = this.props
    return (
      <>
        {
          config.get('poi.useCustomTitleBar', process.platform === 'win32' || process.platform === 'linux') &&
          <title-bar>
            <TitleBarWrapper />
          </title-bar>
        }
        <poi-main
          ref={ref => { this.poimain = ref }}
          style={{
            flexFlow: `${isHorizontal ? 'row' : 'column'}${reversed ? '-reverse' : ''} nowrap`,
            ...!isHorizontal && { overflow: 'hidden' },
          }}
        >
          {
            this.props.isolateGameWindow ?
              <KanGameWindowWrapper /> :
              <KanGameWrapper />
          }
          <PoiApp />
        </poi-main>
        <ModalTrigger />
        <Toastr />
        <BasicAuth />
      </>
    )
  }
}

ReactDOM.render(
  <I18nextProvider i18n={i18next} >
    <Provider store={store} >
      <WindowEnv.Provider value={{
        window,
        mountPoint: document.body,
      }}>
        <Async>
          <Poi />
        </Async>
      </WindowEnv.Provider>
    </Provider>
  </I18nextProvider>,
  $('#poi')
)
