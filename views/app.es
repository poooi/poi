/* global $, getStore */

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { connect, Provider } from 'react-redux'
import { webFrame } from 'electron'
import * as remote from '@electron/remote'
import { get, pick, isEqual, entries, fromPairs, map } from 'lodash'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider } from 'styled-components'
import { ResizeSensor, Popover } from '@blueprintjs/core'
import { Responsive as ResponsiveReactGridLayout } from 'react-grid-layout'

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

import { ExpeditionPanel } from './components/main/parts/expedition-panel'
import { TaskPanel } from './components/main/parts/task-panel'
import { MiniShip } from './components/main/parts/mini-ship'
import { ResourcePanel } from './components/main/parts/resource-panel'
import { AdmiralPanel } from './components/main/parts/admiral-panel'
import { RepairPanel } from './components/main/parts/repair-panel'
import { ConstructionPanel } from './components/main/parts/construction-panel'

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

// Override maxsize
const defaultLayout = config.getDefault('poi.mainpanel.layout')
const configLayout = config.get('poi.mainpanel.layout')
const keys = ['minW', 'maxW', 'minH', 'maxH']
const newLayout = fromPairs(
  map(entries(defaultLayout), ([bp, conf]) => [
    bp,
    map(conf, (panelConf, i) => ({
      ...get(configLayout, [bp, i], panelConf),
      ...pick(panelConf, keys),
    })),
  ]),
)

if (!isEqual(newLayout, configLayout)) {
  config.set('poi.mainpanel.layout', newLayout)
}

// polyfill for old layouts
function layoutConfigOutdated(layoutConfig) {
  return (
    !layoutConfig.sm.find((a) => a.i === 'repair-panel') ||
    !layoutConfig.lg.find((a) => a.i === 'repair-panel')
  )
}

function layoutConfigFix(layoutConfig) {
  if (layoutConfigOutdated(layoutConfig)) {
    return defaultLayout
  }
  return defaultLayout
}

if (layoutConfigOutdated(config.get('poi.mainpanel.layout', defaultLayout))) {
  config.set('poi.mainpanel.layout', defaultLayout)
}

const configKey = ['x', 'y', 'h', 'w', 'i', 'minW', 'maxW', 'minH', 'maxH']

function isPositionEqual(pos1, pos2) {
  return isEqual(pick(pos1, configKey), pick(pos2, configKey))
}

function isLayoutEqual(layout1, layout2) {
  return Object.keys(layout1)
    .map((i) => isPositionEqual(layout1[i], layout2[i]))
    .reduce((a, b) => a && b)
}

function isLayoutsEqual(layouts1, layouts2) {
  if (layouts1 == undefined || layouts2 == undefined) {
    return false
  }
  return Object.keys(layouts1)
    .map((layoutName) => isLayoutEqual(layouts1[layoutName], layouts2[layoutName]))
    .reduce((a, b) => a && b)
}

@connect((state) => ({
  isHorizontal: get(state, 'config.poi.layout.mode', 'horizontal') === 'horizontal',
  reversed: get(state, 'config.poi.layout.reverse', false),
  isolateGameWindow: get(state, 'config.poi.layout.isolate', false),
  grid: get(state, 'config.poi.layout.grid', false),
  layouts: layoutConfigFix(get(state, 'config.poi.mainpanel.layout', defaultLayout)),
  theme: get(state, 'config.poi.appearance.theme', 'dark'),
}))
class Poi extends Component {
  handleResize = (entries) => {
    entries.forEach((entry) => {
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

  onLayoutChange = (layout, layouts) => {
    if (!isLayoutsEqual(layouts, config.get('poi.mainpanel.layout'))) {
      config.set('poi.mainpanel.layout', layouts)
    }
  }

  render() {
    const { isHorizontal, reversed, isolateGameWindow, grid, theme } = this.props
    if (grid) {
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
                  flexFlow: `${isHorizontal ? 'row' : 'column'}${
                    reversed ? '-reverse' : ''
                  } nowrap`,
                  ...(!isHorizontal && { overflow: 'hidden' }),
                }}
              >
                <ResponsiveReactGridLayout
                  layouts={this.props.layouts}
                  // onLayoutChange={this.onLayoutChange}
                  rowHeight={10}
                  margin={[3, 3]}
                  cols={{ lg: 40, sm: 10 }}
                  breakpoints={{ lg: 750, sm: 0 }}
                  width={1800}
                  isResizable={true}
                  isDraggable={true}
                  compactType="horizontal"
                >
                  <div className="teitoku-panel" key="teitoku-panel">
                    <AdmiralPanel editable={this.props.editable} />
                  </div>
                  <div className="resource-panel" key="resource-panel">
                    <ResourcePanel editable={this.props.editable} />
                  </div>
                  <div className="repair-panel panel-col" key="repair-panel">
                    <RepairPanel editable={this.props.editable} />
                  </div>
                  <div className="construction-panel panel-col" key="construction-panel">
                    <ConstructionPanel editable={this.props.editable} />
                  </div>
                  <div className="expedition-panel" key="expedition-panel">
                    <ExpeditionPanel editable={this.props.editable} />
                  </div>
                  <div className="task-panel" key="task-panel">
                    <TaskPanel editable={this.props.editable} />
                  </div>
                  <div className="kan-game-wrapper" key="poi-main">
                    <KanGameWrapper key="frame" />
                  </div>
                </ResponsiveReactGridLayout>
                <PoiApp />
              </poi-main>
            </ResizeSensor>
            <ModalTrigger />
            <BasicAuth />
          </>
        </ThemeProvider>
      )
    }
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
              {this.props.isolateGameWindow ? (
                <KanGameWindowWrapper />
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
