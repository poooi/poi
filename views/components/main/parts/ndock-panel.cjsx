{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{resolveTime} = window
{Panel, Table, Label, OverlayTrigger, Tooltip} = ReactBootstrap
{join} = require 'path-extra'
{__, __n} = require 'i18n'

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
    show: true
  shouldComponentUpdate: (nextProps, nextState) ->
    nextState.show
  handleVisibleResponse: (e) ->
    {visible} = e.detail
    @setState
      show: visible
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
          notify "#{docks[i].name} #{__ 'repair completed'}",
            type: 'repair'
            icon: join(ROOT, 'assets', 'img', 'operation', 'repair.png')
          notified[i] = true
    @setState
      docks: docks
      notified: notified
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    window.addEventListener 'view.main.visible', @handleVisibleResponse
    setInterval @updateCountdown, 1000
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
    window.removeEventListener 'view.main.visible', @handleVisibleResponse
    clearInterval @updateCountdown, 1000
  render: ->
    <div>
    {
      for i in [1..4]
        if @state.docks[i].countdown > 60
          <div key={i} className="panel-item ndock-item">
            <span className="ndock-name">
              {@state.docks[i].name}
            </span>
            <OverlayTrigger placement='left' overlay={<Tooltip id="ndock-finish-by-#{i}"><strong>{__ 'Finish by : '}</strong>{timeToString @state.docks[i].completeTime}</Tooltip>}>
              <Label className="ndock-timer" bsStyle="primary">
                {resolveTime @state.docks[i].countdown}
              </Label>
            </OverlayTrigger>
          </div>
        else if @state.docks[i].countdown > -1
          <div key={i}  className="panel-item ndock-item">
            <span className="ndock-name">
              {@state.docks[i].name}
            </span>
            <Label className="ndock-timer" bsStyle="success">
              {resolveTime @state.docks[i].countdown}
            </Label>
          </div>
        else
          <div key={i}  className="panel-item ndock-item">
            <span className="ndock-name">
              {@state.docks[i].name}
            </span>
            <Label className="ndock-timer" bsStyle="default">
              {resolveTime 0}
            </Label>
          </div>
    }
    </div>

module.exports = NdockPanel
