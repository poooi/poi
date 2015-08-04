path = require 'path-extra'
i18n = require 'i18n'
{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{Panel, Table, Label, OverlayTrigger, Tooltip} = ReactBootstrap
{resolveTime} = window
{notify} = window
{join} = require 'path-extra'
{__, __n} = i18n
timeToString = (dateTime) ->
  date = new Date(dateTime)
  "#{date.getHours()}:#{date.getMinutes()}:#{date.getSeconds()}"

MissionPanel = React.createClass
  getInitialState: ->
    decks: [
        name: __ "No.%s fleet", '0'
        completeTime: -1
        countdown: -1
        mission: null
      ,
        name: __ "No.%s fleet", '1'
        completeTime: -1
        countdown: -1
        mission: null
      ,
        name: __ "No.%s fleet", '2'
        completeTime: -1
        countdown: -1
        mission: null
      ,
        name: __ "No.%s fleet", '3'
        completeTime: -1
        countdown: -1
        mission: null
      ,
        name: __ "No.%s fleet", '4'
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
          notify "#{decks[i].name} #{__ "mission complete"}",
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
    <Panel header={__ "Expedition"} bsStyle="info">
      <Table>
        <tbody>
        {
          for i in [2..4]
            [
              <tr key={i * 2}>
                <td>{@state.decks[i].name}</td>
                <td>
                  {
                    if @state.decks[i].countdown > 60
                      <OverlayTrigger placement='right' overlay={<Tooltip><strong>{__ "Return by : "}</strong>{timeToString @state.decks[i].completeTime}</Tooltip>}>
                        <Label bsStyle="primary">{resolveTime @state.decks[i].countdown}</Label>
                      </OverlayTrigger>
                    else if @state.decks[i].countdown > -1
                      <Label bsStyle="success">{resolveTime @state.decks[i].countdown}</Label>
                    else
                      <Label bsStyle="default"></Label>
                  }
                </td>
              </tr>,
              <tr key={i * 2 + 1}>
                <td colSpan="2">
                  {
                    if @state.decks[i].mission?
                      <span>↳ {@state.decks[i].mission}</span>
                    else
                      <span>↳</span>
                  }
                </td>
              </tr>
            ]
        }
        </tbody>
      </Table>
    </Panel>

module.exports = MissionPanel
