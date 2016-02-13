{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{Panel, Label, OverlayTrigger, Tooltip} = ReactBootstrap
{join} = require 'path-extra'
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
                          notify={@notify.bind @, mission.deckName}/>
        </div>
    }
    </Panel>

module.exports = MissionPanel
