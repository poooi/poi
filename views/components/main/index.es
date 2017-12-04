import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Tab, Tabs, Panel } from 'react-bootstrap'
import { ExpeditionPanel, RepairPanel, ConstructionPanel, TaskPanel, MiniShip, ResourcePanel, AdmiralPanel } from './parts'

import './assets/main.css'

const {i18n} = window
const __ = i18n.main.__.bind(i18n.main)

export default {
  name: 'MainView',
  displayName: <span><FontAwesome name='home' />{__(' Overview')}</span>,
  reactClass: connect((state, props) => ({
    layout: get(state, 'config.poi.layout', 'horizontal'),
    doubleTabbed: get(state, 'config.poi.tabarea.double', false),
  }))(class reactClass extends Component {
    static propTypes = {
      layout: PropTypes.string.isRequired,
      doubleTabbed: PropTypes.bool.isRequired,
    }
    render() {
      return (
        <div className='main-panel-content'>
          <div className={classnames({
            "main-area-horizontal": this.props.layout == 'horizontal' || this.props.doubleTabbed,
            "main-area-vertical": this.props.layout != 'horizontal' && !this.props.doubleTabbed,
          })}>
            <div className="teitoku-panel">
              <AdmiralPanel />
            </div>
            <div className="resource-panel" ref={(ref) => { this.resourcePanel = ref }}>
              <ResourcePanel />
            </div>
            <div className="miniship" id='MiniShip' ref={(ref) => { this.miniship = ref }}>
              <MiniShip />
            </div>
            <Panel className="combined-panels panel-col">
              <Tabs defaultActiveKey={1} animation={false} id="dock-panel-tabs">
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
            </Panel>
            <div className="expedition-panel">
              <ExpeditionPanel />
            </div>
            <div className="task-panel" ref={(ref) => { this.taskPanel = ref }}>
              <TaskPanel />
            </div>
          </div>
        </div>
      )
    }
  }),
}
