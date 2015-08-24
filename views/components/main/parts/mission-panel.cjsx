{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{Panel, Table, Label, OverlayTrigger, Tooltip} = ReactBootstrap
{resolveTime} = window
{notify} = window
{join} = require 'path-extra'
i18n = require 'i18n'
{__, __n} = i18n

timeToString = (dateTime) ->
  date = new Date(dateTime)
  "#{date.getHours()}:#{date.getMinutes()}:#{date.getSeconds()}"


MissionPanel = React.createClass
  getInitialState: ->
    decks: [
        name: '第0艦隊'
        completeTime: -1
        countdown: -1
        mission: null
      ,
        name: '第1艦隊'
        completeTime: -1
        countdown: -1
        mission: null
      ,
        name: '第2艦隊'
        completeTime: -1
        countdown: -1
        mission: null
      ,
        name: '第3艦隊'
        completeTime: -1
        countdown: -1
        mission: null
      ,
        name: '第4艦隊'
        completeTime: -1
        countdown: -1
        mission: null
    ]
    notified: []
  handleResponse: (e) ->
    {$missions} = window
    {method, path, body, postBody} = e.detail
    switch path
      when '/kcsapi/api_port/port'
        {decks, notified} = @state
        for deck in body.api_deck_port[1..3]
          id = deck.api_id
          countdown = -1
          switch deck.api_mission[0]
            # In port
            when 0
              countdown = -1
              completeTime = -1
              notified[id] = false
            # In mission
            when 1
              completeTime = deck.api_mission[2]
              countdown = Math.floor((deck.api_mission[2] - new Date()) / 1000)
            # Just come back
            when 2
              completeTime = 0
              countdown = 0
          mission_id = deck.api_mission[1]
          if mission_id isnt 0
            mission = $missions[mission_id].api_name
          else
            mission = null
          decks[id] =
            name: deck.api_name
            completeTime: completeTime
            countdown: countdown
            mission: mission
        @setState
          decks: decks
          notified: notified
      when '/kcsapi/api_req_mission/start'
        id = postBody.api_deck_id
        {decks, notified} = @state
        decks[id].completeTime = body.api_complatetime
        decks[id].countdown = Math.floor((body.api_complatetime - new Date()) / 1000)
        mission_id = postBody.api_mission_id
        decks[id].mission = $missions[mission_id].api_name
        notified[id] = false
        @setState
          decks: decks
          notified: notified
      when '/kcsapi/api_req_mission/return_instruction'
        id = postBody.api_deck_id
        {decks, notified} = @state
        decks[id].completeTime = body.api_mission[2]
        decks[id].countdown = Math.floor((body.api_mission[2] - new Date()) / 1000)
        @setState
          decks: decks
          notified: notified
  updateCountdown: ->
    {decks, notified} = @state
    for i in [1..4]
      if decks[i].countdown > 0
        decks[i].countdown = Math.max(0, Math.floor((decks[i].completeTime - new Date()) / 1000))
        if decks[i].countdown <= 60 && !notified[i]
          notify "#{decks[i].name} #{__ 'mission complete'}",
            type: 'expedition'
            icon: join(ROOT, 'assets', 'img', 'operation', 'expedition.png')
          notified[i] = true
    @setState
      decks: decks
      notified: notified
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    setInterval @updateCountdown, 1000
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
    clearInterval @updateCountdown, 1000
  render: ->
    <Panel bsStyle="default" >
    {
      for i in [2..4]
        <div className="panelItem missionItem" key={i} >
          <span className="missionName">
          {
            if @state.decks[i].mission?
              "#{@state.decks[i].mission}"
            else
              __ 'Ready'
          }
          </span>
        {
          if @state.decks[i].countdown > 60
            <OverlayTrigger placement='left' overlay={<Tooltip><strong>{__ "Return by : "}</strong>{timeToString @state.decks[i].completeTime}</Tooltip>}>
              <Label bsStyle="primary">{resolveTime @state.decks[i].countdown}</Label>
            </OverlayTrigger>
          else if @state.decks[i].countdown > -1
            <Label className="missionTimer" bsStyle="success" >{resolveTime @state.decks[i].countdown}</Label>
          else
            <Label className="missionTimer" bsStyle="default"></Label>
        }
        </div>
    }
    </Panel>

module.exports = MissionPanel
