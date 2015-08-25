path = require 'path-extra'
i18n = require 'i18n'
{__, __n} = i18n
{layout, ROOT, $, $$, React, ReactBootstrap} = window
{TabbedArea, TabPane, Grid, Col, Row, Accordion, Panel, Nav, NavItem, TabbedArea, TabPane} = ReactBootstrap
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
    handleSelect: (key) ->
      @setState {key}
      @forceUpdate()
    componentDidMount: ->
      window.addEventListener 'layout.change', @handleChangeLayout
    componentWillUnmount: ->
      window.removeEventListener 'layout.change', @handleChangeLayout
    shouldComponentUpdate: (nextProps, nextState)->
      false
    render: ->
      <div>
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'main.css')} />

      {
        if @state.layout == 'horizonal' or window.doubleTabbed
          [
            <div className="panel-col">
              <div className="panel-col teitoku-panel">
                <TeitokuPanel />
              </div>
              <div className="panel-row">
                <div className="panel-col half">
                  <div className="panel-col resource-panel" ref="resourcePanel" >
                    <ResourcePanel />
                  </div>
                  <div className="miniship" id={MiniShip.name} ref="miniship">
                    {React.createElement MiniShip.reactClass}
                  </div>
                </div>
                <div className="panel-col half">
                  <Panel className="combinedPanels panel-col">
                    <TabbedArea activeKey={@state.key} onSelect={@handleSelect}>
                     <TabPane eventKey={1} tab={__ 'Docking'}>
                       <div className="ndock-panel flex">
                         <NdockPanel />
                       </div>
                     </TabPane>
                     <TabPane eventKey={2} tab={__ 'Construction'}>
                       <div className="kdock-panel flex">
                         <KdockPanel />
                       </div>
                     </TabPane>
                    </TabbedArea>
                  </Panel>
                  <div className="mission-panel" ref="missionPanel" >
                    <MissionPanel />
                  </div>
                  <div className="task-panel" ref="taskPanel" >
                    <TaskPanel />
                  </div>
                </div>
              </div>
            </div>
          ]
        else
          [
            <div className="panel-row">
              <div className="panel-col" style={width: "60%"}>
                <div className="panel-col teitoku-panel">
                  <TeitokuPanel />
                </div>
                <div className="panel-row">
                  <div className="panel-col half">
                    <div className="panel-col resource-panel" ref="resourcePanel" >
                      <ResourcePanel />
                    </div>
                    <div className="panel-col task-panel" ref="taskPanel" >
                      <TaskPanel />
                    </div>
                  </div>
                  <div className="panel-col half">
                    <Panel className="combinedPanels panel-col">
                      <TabbedArea activeKey={@state.key} onSelect={@handleSelect}>
                       <TabPane eventKey={1} tab={__ 'Docking'}>
                         <div className="panel-col ndock-panel flex">
                           <NdockPanel />
                         </div>
                       </TabPane>
                       <TabPane eventKey={2} tab={__ 'Construction'}>
                         <div className="panel-col kdock-panel flex">
                           <KdockPanel />
                         </div>
                       </TabPane>
                      </TabbedArea>
                    </Panel>
                    <div className="panel-col mission-panel" ref="missionPanel" >
                      <MissionPanel />
                    </div>
                  </div>
                </div>
              </div>
              <div className="miniship panel-col" id={MiniShip.name} ref="miniship" style={width:"40%"}>
                {React.createElement MiniShip.reactClass}
              </div>
            </div>
          ]
        }
      </div>
