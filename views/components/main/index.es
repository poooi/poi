/* global config */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Trans } from 'react-i18next'
import styled from 'styled-components'
import { Responsive as ResponsiveReactGridLayout } from 'react-grid-layout'

import defaultLayout from './default-layout'
import { layoutResizeObserver } from 'views/services/layout'
import { ExpeditionPanel } from './parts/expedition-panel'
import { TaskPanel } from './parts/task-panel'
import { MiniShip } from './parts/mini-ship'
import { ResourcePanel } from './parts/resource-panel'
import { AdmiralPanel } from './parts/admiral-panel'
import { RepairPanel } from './parts/repair-panel'
import { ConstructionPanel } from './parts/construction-panel'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const MainPanelContent = styled.div`
  position: relative;
  transition: all 0.3s ease-in-out;
  margin-top: -4px;
  font-size: 12px;

  .react-grid-item {
    padding: 1px;
    overflow: visible;
  }

  .countdown-timer-label {
    flex: none;
  }
`


// polyfill for old layouts
function layoutConfigOutdated(layoutConfig) {
  return !layoutConfig.sm.find(a => a.i === 'repair-panel') || !layoutConfig.lg.find(a => a.i === 'repair-panel')
}

function layoutConfigFix(layoutConfig) {
  if (layoutConfigOutdated(layoutConfig)) {
    return defaultLayout
  }
  return layoutConfig
}

if (layoutConfigOutdated(config.get('poi.mainpanel.layout', defaultLayout))) {
  config.set('poi.mainpanel.layout', defaultLayout)
}

@connect((state, props) => ({
  layouts: layoutConfigFix(get(state, 'config.poi.mainpanel.layout', defaultLayout)),
  editable: get(state, 'config.poi.layout.editable', false),
  mainpanewidth: get(state, 'layout.mainpane.width', 450),
}))
export class reactClass extends Component {
  static propTypes = {
    layouts: PropTypes.object.isRequired,
  }

  onLayoutChange = (layout, layouts) => {
    config.set('poi.mainpanel.layout', layouts)
  }

  componentWillUnmount() {
    layoutResizeObserver.unobserve(this.mainpane)
  }

  componentDidMount() {
    layoutResizeObserver.observe(this.mainpane)
  }

  render() {
    return (
      <MainPanelContent
        className="main-panel-content"
        ref={ref => {
          this.mainpane = ref
        }}
      >
        <ResponsiveReactGridLayout
          onLayoutChange={this.onLayoutChange}
          layouts={this.props.layouts}
          rowHeight={10}
          margin={[3, 3]}
          cols={{ lg: 20, sm: 10 }}
          breakpoints={{ lg: 750, sm: 0 }}
          width={this.props.mainpanewidth}
          isResizable={this.props.editable}
          isDraggable={this.props.editable}
          compactType="vertical"
        >
          <div className="teitoku-panel" key="teitoku-panel">
            <AdmiralPanel editable={this.props.editable} />
          </div>
          <div className="resource-panel" key="resource-panel">
            <ResourcePanel editable={this.props.editable} />
          </div>
          <div className="miniship" key="miniship">
            <MiniShip editable={this.props.editable} />
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
        </ResponsiveReactGridLayout>
      </MainPanelContent>
    )
  }
}

export const displayName = <><FontAwesome name="home" /> <Trans>main:Overview</Trans></>
