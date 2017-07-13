import path from 'path-extra'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Tab, Tabs, Panel } from 'react-bootstrap'
import { ExpeditionPanel, RepairPanel, ConstructionPanel, TaskPanel, MiniShip, ResourcePanel, AdmiralPanel } from './parts'

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
          <link rel="stylesheet" href={path.join(__dirname, 'assets', 'main.css')} />
          {
            (this.props.layout == 'horizontal' || this.props.doubleTabbed) ?
              <div className="panel-col main-area-horizontal">
                <div className="panel-col teitoku-panel-area">
                  <AdmiralPanel />
                </div>
                <div className="panel-row bottom-area">
                  <div className="panel-col half bottom-left-area">
                    <div className="panel-col resource-panel resource-panel-area-horizontal" ref="resourcePanel">
                      <ResourcePanel />
                    </div>
                    <div className="miniship miniship-area-horizontal" id='MiniShip' ref="miniship">
                      <MiniShip />
                    </div>
                  </div>
                  <div className="panel-col half bottom-left-area">
                    <Panel className="combined-panels panel-col combined-panels-area-horizontal">
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
                    <div className="expedition-panel expedition-panel-area-horizontal">
                      <ExpeditionPanel />
                    </div>
                    <div className="task-panel task-panel-area-horizontal" ref="taskPanel">
                      <TaskPanel />
                    </div>
                  </div>
                </div>
              </div>
              :
              <div className="panel-row main-area-vertical">
                <div className="panel-col left-area" style={{width: "60%"}}>
                  <div className="panel-col teitoku-panel-area">
                    <AdmiralPanel />
                  </div>
                  <div className="panel-row bottom-area">
                    <div className="panel-col half left-bottom-area">
                      <div className="panel-col resource-panel resource-panel-area-vertical" ref="resourcePanel">
                        <ResourcePanel />
                      </div>
                      <div className="panel-col task-panel-area task-panel-area-vertical" ref="taskPanel">
                        <TaskPanel />
                      </div>
                    </div>
                    <div className="panel-col half right-bottom-area">
                      <Panel className="combined-panels panel-col combined-panels-area-vertical">
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
                      <div className="panel-col expedition-panel expedition-panel-area-vertical">
                        <ExpeditionPanel />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="miniship panel-col" id='MiniShip' ref="miniship" style={{width:"40%"}}>
                  <MiniShip />
                </div>
              </div>
          }
        </div>
      )
    }
  }),
}
