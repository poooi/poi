/* global $, getStore */

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { connect, Provider } from 'react-redux'
import { remote, webFrame } from 'electron'
import { get } from 'lodash'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider } from 'styled-components'
import { ResizeSensor, Popover } from '@blueprintjs/core'

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
import i18next from './env-parts/i18next'
import { darkTheme, lightTheme } from './theme'
import { POPOVER_MODIFIERS } from './utils/tools'

const config = remote.require('./lib/config')

// Disable OSX zoom
webFrame.setVisualZoomLevelLimits(1, 1)

// Hackable panels
window.hack = {}

// Alert functions
require('./services/alert')

// configure Popover (including Tooltip)
// ATTENTION default props will be overriden by providing props
Popover.defaultProps.modifiers = POPOVER_MODIFIERS
Popover.defaultProps.boundary = 'viewport'

@connect(state => ({
  isHorizontal: get(state, 'config.poi.layout.mode', 'horizontal') === 'horizontal',
  reversed: get(state, 'config.poi.layout.reverse', false),
  isolateGameWindow: get(state, 'config.poi.layout.isolate', false),
  theme: get(state, 'config.poi.appearance.theme', 'dark'),
}))
class Poi extends Component {
  handleResize = entries => {
    entries.forEach(entry => {
      const { width, height } = entry.contentRect
      if (
        width !== 0 &&
        height !== 0 &&
        (width !== getStore('layout.window.width') || height !== getStore('layout.window.height'))
      ) {
        this.props.dispatch({
          type: '@@LayoutUpdate',
          value: {
            window: {
              width,
              height,
            },
          },
        })
      }
    })
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
          <ResizeSensor onResize={this.handleResize}>
            <poi-main
              style={{
                flexFlow: `${isHorizontal ? 'row' : 'column'}${reversed ? '-reverse' : ''} nowrap`,
                ...(!isHorizontal && { overflow: 'hidden' }),
              }}
            >
              {this.props.isolateGameWindow ? <KanGameWindowWrapper /> : <KanGameWrapper />}
              <PoiApp />
            </poi-main>
          </ResizeSensor>
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
