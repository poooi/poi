path = require 'path-extra'
i18n = require 'i18n'
{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{resolveTime} = window
{Panel, Table, Label, OverlayTrigger, Tooltip} = ReactBootstrap
{join} = require 'path-extra'
{__, __n} = i18n
timeToString = (dateTime) ->
  date = new Date(dateTime)
  "#{date.getHours()}:#{date.getMinutes()}:#{date.getSeconds()}"

NdockPanel = React.createClass
  getInitialState: ->
    docks: [
        name: __ 'Empty'
        completeTime: -1
        countdown: -1
      ,
        name: __ 'Empty'
        completeTime: -1
        countdown: -1
      ,
        name: __ 'Empty'
        completeTime: -1
        countdown: -1
      ,
        name: __ 'Empty'
        completeTime: -1
        countdown: -1
      ,
        name: __ 'Empty'
        completeTime: -1
        countdown: -1
    ]
    notified: []
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {$ships, _ships} = window
    {docks, notified} = @state
    switch path
      when '/kcsapi/api_port/port'
        for ndock in body.api_ndock
          id = ndock.api_id
          switch ndock.api_state
            when -1
              docks[id] =
                name: __ 'Locked'
                completeTime: -1
                countdown: -1
            when 0
              docks[id] =
                name: __ 'Empty'
                completeTime: -1
                countdown: -1
              notified[id] = false
            when 1
              docks[id] =
                name: $ships[_ships[ndock.api_ship_id].api_ship_id].api_name
                completeTime: ndock.api_complete_time
                countdown: Math.floor((ndock.api_complete_time - new Date()) / 1000)
        @setState
          docks: docks
          notified: notified
      when '/kcsapi/api_get_member/ndock'
        for ndock in body
          id = ndock.api_id
          switch ndock.api_state
            when -1
              docks[id] =
                name: __ 'Locked'
                completeTime: -1
                countdown: -1
            when 0
              docks[id] =
                name: __ 'Empty'
                completeTime: -1
                countdown: -1
              notified[id] = false
            when 1
              docks[id] =
                name: $ships[_ships[ndock.api_ship_id].api_ship_id].api_name
                completeTime: ndock.api_complete_time
                countdown: Math.floor((ndock.api_complete_time - new Date()) / 1000)
        @setState
          docks: docks
          notified: notified
  updateCountdown: ->
    {docks, notified} = @state
    for i in [1..4]
      if docks[i].countdown > 0
        docks[i].countdown = Math.floor((docks[i].completeTime - new Date()) / 1000)
        if docks[i].countdown <= 60 && !notified[i]
          notify "#{docks[i].name} #{__ "repair completed"}",
            type: 'repair'
            icon: join(ROOT, 'assets', 'img', 'operation', 'repair.png')
          notified[i] = true
    @setState
      docks: docks
      notified: notified
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    setInterval @updateCountdown, 1000
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
    clearInterval @updateCountdown, 1000
  render: ->
    <Panel header={__ 'Docking'} bsStyle="warning">
      <Table>
        <tbody>
        {
          for i in [1..4]
            <tr key={i}>
              <td>{@state.docks[i].name}</td>
              <td>
                {
                  if @state.docks[i].countdown > 60
                    <OverlayTrigger placement='right' overlay={<Tooltip><strong>{__ "Finish by : "}</strong>{timeToString @state.docks[i].completeTime}</Tooltip>}>
                      <Label bsStyle="primary">{resolveTime @state.docks[i].countdown}</Label>
                    </OverlayTrigger>
                  else if @state.docks[i].countdown > -1
                    <Label bsStyle="success">{resolveTime @state.docks[i].countdown}</Label>
                  else
                    <Label bsStyle="default"></Label>
                }
              </td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = NdockPanel
