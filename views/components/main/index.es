import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Trans } from 'react-i18next'

import defaultLayout from './default-layout'
import { layoutResizeObserver } from 'views/services/layout'
import { ExpeditionPanel } from './parts/expedition-panel'
import { TaskPanel } from './parts/task-panel'
import { MiniShip } from './parts/mini-ship'
import { ResourcePanel } from './parts/resource-panel'
import { AdmiralPanel } from './parts/admiral-panel'
import { DockPanel } from './parts/dock-panel'
import { Responsive as ResponsiveReactGridLayout } from 'react-grid-layout'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './assets/main.css'

const { config } = window

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
    layoutResizeObserver.unobserve(this.combinedpane)
  }

  componentDidMount() {
    this.combinedpane = document.querySelector('.main-view .combined-panels')
    layoutResizeObserver.observe(this.mainpane)
    layoutResizeObserver.observe(this.combinedpane)
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
          <div
            className="miniship"
            key="miniship"
            id="MiniShip"
            ref={ref => {
              this.miniship = ref
            }}
          >
            <MiniShip editable={this.props.editable} />
          </div>
          <div className="combined-panels panel-col" key="combined-panels">
            <DockPanel editable={this.props.editable} />
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
