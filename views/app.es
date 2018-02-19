import React, { Fragment, Component } from 'react'
import ReactDOM from 'react-dom'
import fs from 'fs-extra'
import path from 'path-extra'
import { connect, Provider } from 'react-redux'
import { remote, webFrame } from 'electron'
import { get } from 'lodash'
import { I18nextProvider } from 'react-i18next'

import '../assets/css/app.css'
import '../assets/css/global.css'

import { store } from './create-store'
import { Toastr } from './components/info/toastr'
import { ModalTrigger } from './components/etc/modal'
import { BasicAuth } from './utils/http-basic-auth'
import { TitleBarWrapper } from './components/etc/menu'
import { KanGameWrapper } from './kan-game-wrapper'
import { PoiApp } from './poi-app'
import { layoutResizeObserver } from 'views/services/layout'
import i18next from './env-parts/i18next'

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

@connect(state => ({
  isHorizontal: get(state, 'config.poi.layout', 'horizontal') === 'horizontal',
  reversed: get(state, 'config.poi.reverseLayout', false),
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
      <Fragment>
        <CustomCssInjector />
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
          <KanGameWrapper />
          <PoiApp />
        </poi-main>
        <ModalTrigger />
        <Toastr />
        <BasicAuth />
      </Fragment>
    )
  }
}

ReactDOM.render(
  <I18nextProvider i18n={i18next} >
    <Provider store={store} >
      <Poi />
    </Provider>
  </I18nextProvider>,
  $('#poi')
)
