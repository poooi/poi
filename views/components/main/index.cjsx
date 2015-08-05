path = require 'path-extra'
i18n = require 'i18n'
{ROOT, $, $$, React, ReactBootstrap} = window
{Grid, Col} = ReactBootstrap
{TeitokuPanel, MissionPanel, NdockPanel, KdockPanel, TaskPanel} = require './parts'
{__, __n} = i18n

module.exports =
  name: 'MainView'
  priority: 0
  displayName: <span><FontAwesome key={0} name='home' />{__ " Overview"}</span>
  description: '概览面板，提供基本的概览界面'
  reactClass: React.createClass
    getInitialState: ->
      layout: window.layout
    handleChangeLayout: (e) ->
      @setState
        layout: e.detail.layout
    componentDidMount: ->
      window.addEventListener 'layout.change', @handleChangeLayout
    shouldComponentUpdate: (nextProps, nextState)->
      false
    componentWillUnmount: ->
      window.removeEventListener 'layout.change', @handleChangeLayout
    render: ->
      <div>
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'main.css')} />
        <TeitokuPanel ref="teitokuPanel" />
        {
          if @state.layout == 'horizonal' or window.doubleTabbed
            <div>
              <div key={0} className="panel-container" style={display: 'flex'}>
                <NdockPanel style={flex: 1} />
                <KdockPanel style={flex: 1} />
              </div>
              <div key={1} className="panel-container" style={display: 'flex'}>
                <MissionPanel style={flex: 1} />
                <TaskPanel style={flex: 1} />
              </div>
            </div>
          else
            <div className="panel-container" style={display: 'flex'}>
              <NdockPanel style={flex: 1} />
              <KdockPanel style={flex: 1} />
              <MissionPanel style={flex: 1} />
              <TaskPanel style={flex: 1} />
            </div>
        }
      </div>
