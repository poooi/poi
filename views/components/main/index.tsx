import type { Layout, Layouts } from 'react-grid-layout'
import type { RootState } from 'views/redux/reducer-factory'

import { ResizeSensor } from '@blueprintjs/core'
import { get, pick, isEqual, entries, fromPairs, map } from 'lodash-es'
import React, { useCallback } from 'react'
import FontAwesome from 'react-fontawesome'
import { Responsive as ResponsiveReactGridLayout } from 'react-grid-layout'
import { Trans } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { styled } from 'styled-components'
import { getStore } from 'views/create-store'
import { config } from 'views/env'

import { AdmiralPanel } from './parts/admiral-panel'
import { ConstructionPanel } from './parts/construction-panel'
import { ExpeditionPanel } from './parts/expedition-panel'
import { MiniShip } from './parts/mini-ship'
import { RepairPanel } from './parts/repair-panel'
import { ResourcePanel } from './parts/resource-panel'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import { TaskPanel } from './parts/task-panel'

const MainPanelContent = styled.div`
  position: relative;
  transition: all 0.3s ease-in-out;
  font-size: 12px;

  .react-grid-item {
    padding: 1px;
    overflow: visible;
  }

  .countdown-timer-label {
    flex: none;
  }
`

const defaultLayout = config.getDefault('poi.mainpanel.layout')
const configLayout = config.get('poi.mainpanel.layout')
const keys = ['minW', 'maxW', 'minH', 'maxH'] as const
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const newLayout = fromPairs(
  map(entries(defaultLayout), ([bp, conf]) => [
    bp,
    map(conf, (panelConf, i) => ({
      ...get(configLayout, [bp, i], panelConf),
      ...pick(panelConf, keys),
    })),
  ]),
) as unknown as Layouts

if (!isEqual(newLayout, configLayout)) {
  config.set('poi.mainpanel.layout', newLayout)
}

function layoutConfigOutdated(layoutConfig: Layouts): boolean {
  return (
    !layoutConfig.sm.find((a) => a.i === 'repair-panel') ||
    !layoutConfig.lg.find((a) => a.i === 'repair-panel')
  )
}

function layoutConfigFix(layoutConfig: Layouts): Layouts {
  if (layoutConfigOutdated(layoutConfig)) {
    return defaultLayout
  }
  return layoutConfig
}

if (layoutConfigOutdated(config.get('poi.mainpanel.layout', defaultLayout))) {
  config.set('poi.mainpanel.layout', defaultLayout)
}

const configKey = ['x', 'y', 'h', 'w', 'i', 'minW', 'maxW', 'minH', 'maxH'] as const

function isPositionEqual(pos1: Layout, pos2: Layout): boolean {
  return isEqual(pick(pos1, configKey), pick(pos2, configKey))
}

function isLayoutEqual(layout1: Layout[], layout2: Layout[]): boolean {
  return layout1
    .map((_, i) => isPositionEqual(layout1[i], layout2[i]))
    .reduce((a, b) => a && b, true)
}

function isLayoutsEqual(layouts1: Layouts, layouts2: Layouts): boolean {
  if (layouts1 == null || layouts2 == null) return false
  return Object.keys(layouts1)
    .map((layoutName) => isLayoutEqual(layouts1[layoutName], layouts2[layoutName]))
    .reduce((a, b) => a && b, true)
}

interface MainViewInnerProps {
  layouts: Layouts
  editable: boolean
  mainpanewidth: number
  dispatch: ReturnType<typeof useDispatch>
}

const MainViewInner = ({ layouts, editable, mainpanewidth, dispatch }: MainViewInnerProps) => {
  const onLayoutChange = useCallback((_layout: Layout[], newLayouts: Layouts) => {
    const currentLayouts = config.get('poi.mainpanel.layout')
    if (!isLayoutsEqual(newLayouts, currentLayouts)) {
      config.set('poi.mainpanel.layout', newLayouts)
    }
  }, [])

  const handleResize = useCallback(
    (resizeEntries: ResizeObserverEntry[]) => {
      resizeEntries.forEach((entry) => {
        const { width, height } = entry.contentRect
        if (
          width !== 0 &&
          height !== 0 &&
          (width !== getStore('layout.mainpane.width') ||
            height !== getStore('layout.mainpane.height'))
        ) {
          dispatch({ type: '@@LayoutUpdate', value: { mainpane: { width, height } } })
        }
      })
    },
    [dispatch],
  )

  return (
    <ResizeSensor onResize={handleResize}>
      <MainPanelContent className="main-panel-content">
        <ResponsiveReactGridLayout
          onLayoutChange={onLayoutChange}
          layouts={layouts}
          rowHeight={10}
          margin={[3, 3]}
          cols={{ lg: 20, sm: 10 }}
          breakpoints={{ lg: 750, sm: 0 }}
          width={mainpanewidth}
          isResizable={editable}
          isDraggable={editable}
          compactType="vertical"
        >
          <div className="teitoku-panel" key="teitoku-panel">
            <AdmiralPanel editable={editable} />
          </div>
          <div className="resource-panel" key="resource-panel">
            <ResourcePanel editable={editable} />
          </div>
          <div className="miniship" key="miniship">
            <MiniShip editable={editable} />
          </div>
          <div className="repair-panel panel-col" key="repair-panel">
            <RepairPanel editable={editable} />
          </div>
          <div className="construction-panel panel-col" key="construction-panel">
            <ConstructionPanel editable={editable} />
          </div>
          <div className="expedition-panel" key="expedition-panel">
            <ExpeditionPanel editable={editable} />
          </div>
          <div className="task-panel" key="task-panel">
            <TaskPanel editable={editable} />
          </div>
        </ResponsiveReactGridLayout>
      </MainPanelContent>
    </ResizeSensor>
  )
}

const MainView = () => {
  const dispatch = useDispatch()
  const layouts = useSelector((state: RootState) =>
    layoutConfigFix(state.config?.poi?.mainpanel?.layout ?? defaultLayout),
  )
  const editable = useSelector((state: RootState) => state.config?.poi?.layout?.editable ?? false)
  const mainpanewidth = useSelector((state: RootState) => state.layout?.mainpane?.width ?? 450)
  return (
    <MainViewInner
      layouts={layouts}
      editable={editable}
      mainpanewidth={mainpanewidth}
      dispatch={dispatch}
    />
  )
}

export const reactClass = MainView

export const name = 'main-view'

export const displayName = <Trans>main:Overview</Trans>

export const icon = <FontAwesome name="home" />
