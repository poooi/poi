{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{Panel, Label, OverlayTrigger, Tooltip} = ReactBootstrap
{join} = require 'path-extra'
{pluck} = require 'underscore'
{connect} = require 'react-redux'
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)

CountdownTimer = require './countdown-timer'
CountdownLabel = React.createClass
  getLabelStyle: (timeRemaining) ->
    switch
      when timeRemaining > 600 then 'primary'
      when timeRemaining > 60  then 'warning'
      when timeRemaining >= 0  then 'success'
      else 'default'
  getInitialState: ->
    @notify = _.once @props.notify
    style: @getLabelStyle(CountdownTimer.getTimeRemaining @props.completeTime)
  componentWillReceiveProps: (nextProps) ->
    if nextProps.completeTime isnt @props.completeTime
      @notify = _.once nextProps.notify
      @setState
        style: @getLabelStyle(CountdownTimer.getTimeRemaining nextProps.completeTime)
  shouldComponentUpdate: (nextProps, nextState) ->
    nextProps.completeTime isnt @props.completeTime or nextState.style isnt @state.style
  tick: (timeRemaining) ->
    if (notifyBefore = window.notify.expedition) < 1 then notifyBefore = 1
    @notify() if 0 < timeRemaining <= notifyBefore

    style = @getLabelStyle timeRemaining
    @setState {style: style} if style isnt @state.style
  render: ->
    <OverlayTrigger placement='left' overlay={
      if @props.completeTime > 0
        <Tooltip id="mission-return-by-#{@props.dockIndex}">
          <strong>{__ "Return by : "}</strong>{timeToString @props.completeTime}
        </Tooltip>
      else
        <span />
    }>
      <Label className="mission-timer" bsStyle={@state.style}>
      {
        if @props.completeTime > 0
          <CountdownTimer countdownId={"mission-#{@props.dockIndex+1}"}
                          completeTime={@props.completeTime}
                          tickCallback={@tick} />
      }
      </Label>
    </OverlayTrigger>

# TODO: Add canNotify as Kdock does
MissionPanel = connect(
  (state) ->
    fleetMissions = pluck(state.info.fleets, 'api_mission')
    fleetNames = pluck(state.info.fleets, 'api_name')
    $missions = state.const.$missions
    {fleetMissions, fleetNames, $missions}
) React.createClass
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  notify: (deckName) ->
    notify "#{deckName} #{__ 'mission complete'}",
      type: 'expedition'
      title: __ 'Expedition'
      icon: join(ROOT, 'assets', 'img', 'operation', 'expedition.png')
  render: ->
    <Panel bsStyle="default">
    {
      for i in [1...4]
        [status, missionId, completeTime] = @props.fleetMissions[i] || [-1, 0, -1]
        missionName = switch status
          when -1 then __ 'Locked'
          when 0 then __ 'Ready'
          else (@props.$missions[missionId] || {api_name: __ '???'}).api_name
        fleetName = @props.fleetNames[i] || '???'
        <div className="panel-item mission-item" key={i} >
          <span className="mission-name">{missionName}</span>
          <CountdownLabel dockIndex={i}
                          completeTime={completeTime}
                          notify={@notify.bind @, fleetName}/>
        </div>
    }
    </Panel>

module.exports = MissionPanel
