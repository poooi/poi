/* global config */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Trans } from 'react-i18next'
import styled from 'styled-components'

import defaultLayout from './default-layout'
import { layoutResizeObserver } from 'views/services/layout'
import { ExpeditionPanel } from './parts/expedition-panel'
import { TaskPanel } from './parts/task-panel'
import { MiniShip } from './parts/mini-ship'
import { ResourcePanel } from './parts/resource-panel'
import { AdmiralPanel } from './parts/admiral-panel'
import { RepairPanel } from './parts/repair-panel'
import { ConstructionPanel } from './parts/construction-panel'
import { Responsive as ResponsiveReactGridLayout } from 'react-grid-layout'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './assets/main.css'

const MiniShipContainer = styled.div`
  font-size: 14px;
  .bp3-card {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
`

@connect((state, props) => ({
  layouts: get(state, 'config.poi.mainpanel.layout', defaultLayout),
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
    // polyfill for old layouts
    if (!this.props.layouts.sm.find(a => a.i === 'repair-panel') || !this.props.layouts.lg.find(a => a.i === 'repair-panel')) {
      config.set('poi.mainpanel.layout', defaultLayout)
    }
    layoutResizeObserver.observe(this.mainpane)
  }

  render() {
    return (
      <div
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
          <MiniShipContainer
            className="miniship"
            key="miniship"
            id="MiniShip"
            ref={ref => {
              this.miniship = ref
            }}
          >
            <MiniShip editable={this.props.editable} />
          </MiniShipContainer>
          <div className="repair-panel panel-col" key="repair-panel">
            <RepairPanel editable={this.props.editable} />
          </div>
          <div className="construction-panel panel-col" key="construction-panel">
            <ConstructionPanel editable={this.props.editable} />
          </div>
          <div className="expedition-panel" key="expedition-panel">
            <ExpeditionPanel editable={this.props.editable} />
          </div>
          <div
            className="task-panel"
            key="task-panel"
            ref={ref => {
              this.taskPanel = ref
            }}
          >
            <TaskPanel editable={this.props.editable} />
          </div>
        </ResponsiveReactGridLayout>
      </div>
    )
  }
}

export const displayName = (
  <span>
    <FontAwesome name="home" /> <Trans>main:Overview</Trans>
  </span>
)
