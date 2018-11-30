/* global $ */

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { connect, Provider } from 'react-redux'
import { remote, webFrame } from 'electron'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider } from 'styled-components'
import { getStoreConfig } from 'views/utils/tools'

import '../assets/css/app.css'
import '../assets/css/global.css'

import { store } from './create-store'
import { WindowEnv } from './components/etc/window-env'
import { ModalTrigger } from './components/etc/modal'
import { BasicAuth } from './utils/http-basic-auth'
import { TitleBarWrapper } from './components/etc/menu'
import { KanGameWrapper } from './kan-game-wrapper'
import { KanGameWindowWrapper } from './kan-game-window-wrapper'
import { PoiApp } from './poi-app'
import { layoutResizeObserver } from 'views/services/layout'
import i18next from './env-parts/i18next'
import { darkTheme, lightTheme } from './theme'

const config = remote.require('./lib/config')

// Disable OSX zoom
webFrame.setVisualZoomLevelLimits(1, 1)

// Hackable panels
window.hack = {}

// Alert functions
require('./services/alert')

@connect(state => ({
  isHorizontal: getStoreConfig(state, 'poi.layout.mode', 'horizontal') === 'horizontal',
  reversed: getStoreConfig(state, 'poi.layout.reverse', false),
  isolateGameWindow: getStoreConfig(state, 'poi.layout.isolate', false),
  theme: getStoreConfig(state, 'poi.appearance.theme', 'dark'),
}))
class Poi extends Component {
  componentWillUnmount() {
    layoutResizeObserver.unobserve(this.poimain)
  }

  componentDidMount() {
    layoutResizeObserver.observe(this.poimain)
  }
  render() {
    const { isHorizontal, reversed, theme } = this.props
    return (
      <ThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
        <>
          {config.get(
            'poi.appearance.customtitlebar',
            process.platform === 'win32' || process.platform === 'linux',
          ) && (
            <title-bar>
              <TitleBarWrapper />
            </title-bar>
          )}
          <poi-main
            ref={ref => {
              this.poimain = ref
            }}
            style={{
              flexFlow: `${isHorizontal ? 'row' : 'column'}${reversed ? '-reverse' : ''} nowrap`,
              ...(!isHorizontal && { overflow: 'hidden' }),
            }}
          >
            {this.props.isolateGameWindow ? <KanGameWindowWrapper /> : <KanGameWrapper />}
            <PoiApp />
          </poi-main>
          <ModalTrigger />
          <BasicAuth />
        </>
      </ThemeProvider>
    )
  }
}

ReactDOM.render(
  <I18nextProvider i18n={i18next}>
    <Provider store={store}>
      <WindowEnv.Provider
        value={{
          window,
          mountPoint: document.body,
        }}
      >
        <Poi />
      </WindowEnv.Provider>
    </Provider>
  </I18nextProvider>,
  $('#poi'),
)
