import { ResizeSensor, Popover } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import { webFrame } from 'electron'
import { get } from 'lodash-es'
import React, { useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { useDispatch, useSelector, Provider } from 'react-redux'
import { ThemeProvider } from 'styled-components'

import '../assets/css/app.css'
import '../assets/css/global.css'
import './services/alert'
import type { RootState } from './redux/reducer-factory'

import BasicAuth from './components/etc/http-basic-auth'
import { TitleBarWrapper } from './components/etc/menu'
import ModalTrigger from './components/etc/modal'
import { WindowEnv } from './components/etc/window-env'
import { store, getStore } from './create-store'
import i18next from './env-parts/i18next'
import { KanGameWindowWrapper } from './kan-game-window-wrapper'
import { KanGameWrapper } from './kan-game-wrapper'
import { PoiApp } from './poi-app'
import { darkTheme, lightTheme } from './theme'
import { POPOVER_MODIFIERS } from './utils/tools'

const config = remote.require('./lib/config')

// Disable OSX zoom
webFrame.setVisualZoomLevelLimits(1, 1)

// configure Popover (including Tooltip)
// ATTENTION default props will be overridden by providing props
Popover.defaultProps.modifiers = POPOVER_MODIFIERS

const Poi = () => {
  const dispatch = useDispatch()
  const isHorizontal = useSelector(
    (state: RootState) => get(state, 'config.poi.layout.mode', 'horizontal') === 'horizontal',
  )
  const reversed = useSelector((state: RootState) => get(state, 'config.poi.layout.reverse', false))
  const isolateGameWindow = useSelector((state: RootState) =>
    get(state, 'config.poi.layout.isolate', false),
  )
  const theme = useSelector((state: RootState) => get(state, 'config.poi.appearance.theme', 'dark'))

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      entries.forEach((entry) => {
        const { width, height } = entry.contentRect
        if (
          width !== 0 &&
          height !== 0 &&
          (width !== getStore('layout.window.width') || height !== getStore('layout.window.height'))
        ) {
          dispatch({
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
    },
    [dispatch],
  )

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
        <ResizeSensor onResize={handleResize}>
          <poi-main
            style={{
              flexFlow: `${isHorizontal ? 'row' : 'column'}${reversed ? '-reverse' : ''} nowrap`,
              ...(!isHorizontal && { overflow: 'hidden' }),
            }}
          >
            {isolateGameWindow ? <KanGameWindowWrapper /> : <KanGameWrapper key="frame" />}
            <PoiApp />
          </poi-main>
        </ResizeSensor>
        <ModalTrigger />
        <BasicAuth />
      </>
    </ThemeProvider>
  )
}

const ReactRoot = createRoot(document.getElementById('poi')!)
ReactRoot.render(
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
)
