path = require 'path-extra'
{layout, ROOT, $, $$, React, ReactBootstrap} = window
{Grid, Col} = ReactBootstrap
{config, proxy} = window
{TeitokuPanel, MissionPanel, NdockPanel, KdockPanel, TaskPanel} = require './parts'
module.exports =
  name: 'MainView'
  priority: 0
  displayName: '概览'
  description: '概览面板，提供基本的概览界面'
  reactClass: React.createClass
    render: ->
      xs = 3
      xs = 6 if layout == 'horizonal'
      <div>
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'main.css')} />
        <TeitokuPanel ref="teitokuPanel" />
        <Grid className="panel-container">
          <Col xs={xs} className="panel-col ndock-panel" ref="ndockPanel">
            <NdockPanel />
          </Col>
          <Col xs={xs} className="panel-col kdock-panel" ref="kdockPanel">
            <KdockPanel />
          </Col>
          <Col xs={xs} className="panel-col mission-panel" ref="missionPanel">
            <MissionPanel />
          </Col>
          <Col xs={xs} className="panel-col task-panel" ref="taskPanel">
            <TaskPanel />
          </Col>
        </Grid>
      </div>
