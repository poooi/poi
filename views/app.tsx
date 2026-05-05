import type { ConfigInstance } from 'lib/config'

import { ResizeSensor, Popover, BlueprintProvider, Button } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import { webFrame } from 'electron'
import React, { useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { useDispatch, useSelector, Provider } from 'react-redux'

import '../assets/css/app.css'
import '../assets/css/global.css'
import { styled, ThemeProvider } from 'styled-components'

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
import { createLayoutUpdateAction } from './redux/actions/layout'
import { darkTheme, lightTheme } from './theme'
import { POPOVER_MODIFIERS } from './utils/tools'

const config: ConfigInstance = remote.require('./lib/config')

// Disable OSX zoom
webFrame.setVisualZoomLevelLimits(1, 1)

// Alert functions
require('./services/alert')

// configure Popover (including Tooltip)
// ATTENTION default props will be overridden by providing props
Popover.defaultProps.modifiers = POPOVER_MODIFIERS

const PinButton = styled(Button)`
  align-self: center;
  -webkit-app-region: no-drag;
`

const Poi = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const isHorizontal = useSelector(
    (state: RootState) => (state.config?.poi?.layout?.mode ?? 'horizontal') === 'horizontal',
  )
  const pinConfig = useSelector((state: RootState) => state.config?.poi?.plugin?.pin?.kangame)
  const reversed = useSelector((state: RootState) => state.config?.poi?.layout?.reverse ?? false)
  const isolateGameWindow = useSelector(
    (state: RootState) => state.config?.poi?.layout?.isolate ?? false,
  )
  const theme = useSelector((state: RootState) => state.config?.poi?.appearance?.theme ?? 'dark')

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      entries.forEach((entry) => {
        const { width, height } = entry.contentRect
        if (
          width !== 0 &&
          height !== 0 &&
          (width !== getStore('layout.window.width') || height !== getStore('layout.window.height'))
        ) {
          dispatch(createLayoutUpdateAction({ window: { width, height } }))
        }
      })
    },
    [dispatch],
  )

  const handlePin = () => {
    if (pinConfig) {
      config.delete('poi.plugin.pin.kangame')
    } else {
      const mainWindow = remote.getCurrentWindow()
      const bounds = mainWindow.getBounds()
      const kangameWindow = remote.BrowserWindow.getAllWindows().find((win) =>
        win.webContents.getURL().includes('kangame'),
      )
      const kangameBounds = kangameWindow?.getBounds()
      config.set('poi.plugin.pin.kangame', {
        deltaX: (kangameBounds?.x ?? bounds.x) - bounds.x,
        deltaY: (kangameBounds?.y ?? bounds.y) - bounds.y,
        width: kangameBounds?.width ?? bounds.width,
        height: kangameBounds?.height ?? bounds.height,
      })
    }
  }

  const pinButton = (
    <PinButton
      icon={pinConfig ? 'pin' : 'unpin'}
      active={!!pinConfig}
      minimal
      onClick={() => handlePin()}
      title={pinConfig ? t('setting:Unpin') : t('setting:Pin')}
      small
    />
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
            {isolateGameWindow ? (
              <KanGameWindowWrapper titleExtra={pinButton} pinned={!!pinConfig} />
            ) : (
              <KanGameWrapper key="frame" />
            )}
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
        <BlueprintProvider portalContainer={document.body}>
          <Poi />
        </BlueprintProvider>
      </WindowEnv.Provider>
    </Provider>
  </I18nextProvider>,
)
