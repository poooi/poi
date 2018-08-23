import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Tab, Tabs, Panel } from 'react-bootstrap'
import { translate, Trans } from 'react-i18next'

import defaultLayout from './default-layout'
import { layoutResizeObserver } from 'views/services/layout'
import { ExpeditionPanel } from './parts/expedition-panel'
import { RepairPanel } from './parts/repair-panel'
import { ConstructionPanel } from './parts/construction-panel'
import { TaskPanel } from './parts/task-panel'
import { MiniShip } from './parts/miniship'
import { ResourcePanel } from './parts/resource-panel'
import { AdmiralPanel } from './parts/admiral-panel'
import { Responsive as ResponsiveReactGridLayout } from 'react-grid-layout'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './assets/main.css'

const { config } = window

@translate(['main'])
@connect((state, props) => ({
  layouts: get(state, 'config.poi.mainpanel.layout', defaultLayout),
  editable: get(state, 'config.poi.layouteditable', false),
  mainpanewidth: get(state, 'layout.mainpane.width', 450),
  zoomLevel: get(state, 'config.poi.zoomLevel', 1),
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
    this.combinedpane = document.querySelector('.MainView .combined-panels')
    layoutResizeObserver.observe(this.mainpane)
    layoutResizeObserver.observe(this.combinedpane)
  }

  render() {
    const { t } = this.props
    return (
      <div className='main-panel-content' ref={ref => { this.mainpane = ref }}>
        <ResponsiveReactGridLayout
          onLayoutChange={this.onLayoutChange}
          layouts={this.props.layouts}
          rowHeight={10}
          margin={[3, 3]}
          cols={{ lg: 20, sm: 10 }}
          breakpoints={{ lg: 750, sm: 0 }}
          width={this.props.mainpanewidth / this.props.zoomLevel}
          isResizable={this.props.editable}
          isDraggable={this.props.editable}
          compactType="vertical"
          preventCollision={true}
        >
          <div className="teitoku-panel" key="teitoku-panel">
            <AdmiralPanel />
          </div>
          <div className="resource-panel" key="resource-panel">
            <ResourcePanel />
          </div>
          <div className="miniship" key="miniship" id='MiniShip' ref={ref => { this.miniship = ref }}>
            <MiniShip />
          </div>
          <Panel className="combined-panels panel-col" key="combined-panels">
            <Panel.Body>
              <Tabs defaultActiveKey={1} animation={false} id="dock-panel-tabs" className="dock-panel-tabs">
                <Tab eventKey={1} title={t('main:Docking')}>
                  <div className="ndock-panel flex">
                    <RepairPanel />
                  </div>
                </Tab>
                <Tab eventKey={2} title={t('main:Construction')}>
                  <div className="kdock-panel flex">
                    <ConstructionPanel />
                  </div>
                </Tab>
              </Tabs>
            </Panel.Body>
          </Panel>
          <div className="expedition-panel" key="expedition-panel">
            <ExpeditionPanel />
          </div>
          <div className="task-panel" key="task-panel" ref={(ref) => { this.taskPanel = ref }}>
            <TaskPanel />
          </div>
        </ResponsiveReactGridLayout>
      </div>
    )
  }
}

export const displayName = <span><FontAwesome name='home' /> <Trans>main:Overview</Trans></span>
