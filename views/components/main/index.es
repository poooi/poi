import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Tab, Tabs, Panel } from 'react-bootstrap'
import { ExpeditionPanel, RepairPanel, ConstructionPanel, TaskPanel, MiniShip, ResourcePanel, AdmiralPanel } from './parts'
import { Responsive, WidthProvider } from 'react-grid-layout'
import defaultLayout from './default-layout'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './assets/main.css'

const { i18n, config } = window
const __ = i18n.main.__.bind(i18n.main)
const ResponsiveReactGridLayout = WidthProvider(Responsive)

export default {
  name: 'MainView',
  displayName: <span><FontAwesome name='home' />{__(' Overview')}</span>,
  reactClass: connect((state, props) => ({
    layouts: get(state, 'config.poi.mainpanel.layout', defaultLayout),
    editable: get(state, 'config.poi.layouteditable', false),
  }))(class reactClass extends Component {
    static propTypes = {
      layouts: PropTypes.object.isRequired,
    }

    onLayoutChange = (layout, layouts) => {
      config.set('poi.mainpanel.layout', layouts)
    }

    render() {
      return (
        <div className='main-panel-content'>
          <ResponsiveReactGridLayout
            onLayoutChange={this.onLayoutChange}
            layouts={this.props.layouts}
            rowHeight={10}
            margin={[3, 3]}
            cols={{ lg: 20, sm: 10 }}
            breakpoints={{ lg: 750, sm: 0 }}
            measureBeforeMount
            isResizable={this.props.editable}
            isDraggable={this.props.editable}
            compactType="vertical"
          >
            <div className="teitoku-panel" key="teitoku-panel">
              <AdmiralPanel />
            </div>
            <div className="resource-panel" key="resource-panel" ref={(ref) => { this.resourcePanel = ref }}>
              <ResourcePanel />
            </div>
            <div className="miniship" key="miniship" id='MiniShip' ref={(ref) => { this.miniship = ref }}>
              <MiniShip />
            </div>
            <Panel className="combined-panels panel-col" key="combined-panels">
              <Panel.Body>
                <Tabs defaultActiveKey={1} animation={false} id="dock-panel-tabs" className="dock-panel-tabs">
                  <Tab eventKey={1} title={__('Docking')}>
                    <div className="ndock-panel flex">
                      <RepairPanel />
                    </div>
                  </Tab>
                  <Tab eventKey={2} title={__('Construction')}>
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
  }),
}
