path = require 'path-extra'
{layout, ROOT, $, $$, React, ReactBootstrap} = window
{Grid, Col} = ReactBootstrap
{TeitokuPanel, MissionPanel, NdockPanel, KdockPanel, TaskPanel} = require './parts'
module.exports =
  name: 'MainView'
  priority: 0
  displayName: '概览'
  description: '概览面板，提供基本的概览界面'
  reactClass: React.createClass
    getInitialState: ->
      xs: if layout == 'horizonal' then 6 else 3
    handleChangeLayout: (e) ->
      {layout} = e.detail
      @setState
        xs: if layout == 'horizonal' then 6 else 3
    componentDidMount: ->
      window.addEventListener 'layout.change', @handleChangeLayout
    componentWillUnmount: ->
      window.removeEventListener 'layout.change', @handleChangeLayout
    render: ->
      <div>
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'main.css')} />
        <TeitokuPanel ref="teitokuPanel" />
          <Grid className="panel-container">
            <Col xs={@state.xs} className="panel-col ndock-panel" ref="ndockPanel">
              <NdockPanel />
            </Col>
            <Col xs={@state.xs} className="panel-col kdock-panel" ref="kdockPanel">
              <KdockPanel />
            </Col>
            <Col xs={@state.xs} className="panel-col mission-panel" ref="missionPanel">
              <MissionPanel />
            </Col>
            <Col xs={@state.xs} className="panel-col task-panel" ref="taskPanel">
              <TaskPanel />
            </Col>
          </Grid>
      </div>
