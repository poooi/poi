path = require 'path-extra'
__ = i18n.__.bind(i18n)
__n = i18n.__n.bind(i18n)
{layout, ROOT, $, $$, React, ReactBootstrap} = window
{Tab, Tabs, Grid, Col, Row, Accordion, Panel, Nav, NavItem} = ReactBootstrap
{MissionPanel, NdockPanel, KdockPanel, TaskPanel, MiniShip, ResourcePanel, TeitokuPanel} = require './parts'
module.exports =
  name: 'MainView'
  priority: 0
  displayName: <span><FontAwesome key={0} name='home' />{__ ' Overview'}</span>
  description: '概览面板，提供基本的概览界面'
  reactClass: React.createClass
    getInitialState: ->
      layout: window.layout
      key: 1
    handleChangeLayout: (e) ->
      @setState
        layout: e.detail.layout
    componentDidMount: ->
      window.addEventListener 'layout.change', @handleChangeLayout
    componentWillUnmount: ->
      window.removeEventListener 'layout.change', @handleChangeLayout
    shouldComponentUpdate: (nextProps, nextState) ->
      false
    render: ->
      <div>
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'main.css')} />
      {
        if @state.layout == 'horizontal' or window.doubleTabbed
          <div className="panel-col main-area-horizontal">
            <div className="panel-col teitoku-panel-area">
              <TeitokuPanel />
            </div>
            <div className="panel-row bottom-area">
              <div className="panel-col half bottom-left-area">
                <div className="panel-col resource-panel resource-panel-area-horizontal" ref="resourcePanel">
                  <ResourcePanel />
                </div>
                <div className="miniship miniship-area-horizontal" id={MiniShip.name} ref="miniship">
                  {React.createElement MiniShip.reactClass}
                </div>
              </div>
              <div className="panel-col half bottom-left-area">
                <Panel className="combined-panels panel-col combined-panels-area-horizontal">
                  <Tabs defaultActiveKey={1} animation={false}>
                    <Tab eventKey={1} title={__ 'Docking'}>
                      <div className="ndock-panel flex">
                        <NdockPanel />
                      </div>
                    </Tab>
                    <Tab eventKey={2} title={__ 'Construction'}>
                      <div className="kdock-panel flex">
                        <KdockPanel />
                      </div>
                    </Tab>
                  </Tabs>
                </Panel>
                <div className="mission-panel mission-panel-area-horizontal" ref="missionPanel">
                  <MissionPanel />
                </div>
                <div className="task-panel task-panel-area-horizontal" ref="taskPanel">
                  <TaskPanel />
                </div>
              </div>
            </div>
          </div>
        else
          <div className="panel-row main-area-vertical">
            <div className="panel-col left-area" style={width: "60%"}>
              <div className="panel-col teitoku-panel-area">
                <TeitokuPanel />
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
                    <Tabs defaultActiveKey={1} animation={false}>
                      <Tab eventKey={1} title={__ 'Docking'}>
                        <div className="ndock-panel flex">
                          <NdockPanel />
                        </div>
                      </Tab>
                      <Tab eventKey={2} title={__ 'Construction'}>
                        <div className="kdock-panel flex">
                          <KdockPanel />
                        </div>
                      </Tab>
                    </Tabs>
                  </Panel>
                  <div className="panel-col mission-panel mission-panel-area-vertical" ref="missionPanel">
                    <MissionPanel />
                  </div>
                </div>
              </div>
            </div>
            <div className="miniship panel-col" id={MiniShip.name} ref="miniship" style={width:"40%"}>
              {React.createElement MiniShip.reactClass}
            </div>
          </div>
        }
      </div>
