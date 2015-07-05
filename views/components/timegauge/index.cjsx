path = require 'path-extra'
{layout, ROOT, $, $$, React, ReactBootstrap} = window
{Grid, Col, Row, Accordion, Panel} = ReactBootstrap
{MissionPanel, NdockPanel, KdockPanel, TaskPanel} = require './parts'
module.exports =
  name: 'TimeGauge'
  priority: 0.01
  displayName: [<FontAwesome key={0} name='clock-o' />, ' 计时面板']
  description: '计时面板，提供舰队各种信息倒计时'
  reactClass: React.createClass
    getInitialState: ->
      xs: if layout == 'horizonal' then 6 else 6
    handleChangeLayout: (e) ->
      {layout} = e.detail
      @setState
        xs: if layout == 'horizonal' then 6 else 6
    componentDidMount: ->
      window.addEventListener 'layout.change', @handleChangeLayout
    componentWillUnmount: ->
      window.removeEventListener 'layout.change', @handleChangeLayout
    render: ->
      <div>
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'main.css')} />
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
