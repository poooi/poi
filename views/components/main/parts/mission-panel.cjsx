{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{Panel, Label, OverlayTrigger, Tooltip} = ReactBootstrap
{join} = require 'path-extra'
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)

CountdownTimer = require './countdown-timer'
CountdownLabel = React.createClass
  getLabelStyle: (timeRemaining, notifyBefore) ->
    switch
      when timeRemaining > notifyBefore + 540 then 'primary'
      when timeRemaining > notifyBefore  then 'warning'
      when timeRemaining >= 0  then 'success'
      else 'default'
  getInitialState: ->
    timeRemaining = CountdownTimer.getTimeRemaining @props.completeTime
    style: @getLabelStyle timeRemaining, window.notify.expedition
  componentWillReceiveProps: (nextProps) ->
    if nextProps.completeTime isnt @props.completeTime
      timeRemaining = CountdownTimer.getTimeRemaining nextProps.completeTime
      @setState
        style: @getLabelStyle timeRemaining, window.notify.expedition
  tick: (timeRemaining) ->
    notifyBefore = window.notify.expedition
    @props.notify() if timeRemaining <= notifyBefore

    style = @getLabelStyle timeRemaining, notifyBefore
    @setState {style: style} if style isnt @state.style
  render: ->
    <OverlayTrigger placement='left' overlay={
      switch @state.style
        when 'primary', 'warning'
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


class MissionInfo
  constructor: (deckName) ->
    @deckName = if deckName? then deckName else '???'
    @setInPort()
  setInPort: ->
    @missionId = 0
    @completeTime = -1
  setInMission: (missionId, completeTime) ->
    @missionId = missionId
    @completeTime = completeTime
  getMissionName: ->
    if @missionId > 0
      i18n.resources.__ window.$missions[@missionId].api_name
    else
      __ 'Ready'

MissionPanel = React.createClass
  getInitialState: ->
    missions: [new MissionInfo, new MissionInfo, new MissionInfo]
  handleResponse: (e) ->
    {path, body, postBody} = e.detail
    switch path
      when '/kcsapi/api_port/port'
        missions = body.api_deck_port.slice(1).map (deck) ->
          mi = new MissionInfo deck.api_name
          switch deck.api_mission[0]
            when 0 then mi.setInPort()
            when 1, 2, 3  # 1: In mission  2: Just returned  3: Returning
              mi.setInMission deck.api_mission[1], deck.api_mission[2]
          mi
        if !_.isEqual missions, @state.missions
          @setState
            missions: missions
      when '/kcsapi/api_req_mission/start', '/kcsapi/api_req_mission/return_instruction'
        missions = @state.missions.slice()
        idx = postBody.api_deck_id - 2
        missions[idx] = new MissionInfo missions[idx].deckName
        if path is '/kcsapi/api_req_mission/start'
          missions[idx].setInMission postBody.api_mission_id, body.api_complatetime
        else
          missions[idx].setInMission body.api_mission[1], body.api_mission[2]
        @setState
          missions: missions
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
      for mission, i in @state.missions
        <div className="panel-item mission-item" key={i} >
          <span className="mission-name">{mission.getMissionName()}</span>
          <CountdownLabel dockIndex={i}
                          completeTime={mission.completeTime}
                          notify={_.once(@notify.bind @, mission.deckName)}/>
        </div>
    }
    </Panel>

module.exports = MissionPanel
