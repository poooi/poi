{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{Label, OverlayTrigger, Tooltip} = ReactBootstrap
{join} = require 'path-extra'
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)

CountdownTimer = require './countdown-timer'
CountdownLabel = React.createClass
  getInitialState: ->
    style: 'default'
  tick: (timeRemaining) ->
    @props.notify() if timeRemaining is 60

    style = switch
      when timeRemaining > 600 then 'primary'
      when timeRemaining > 60  then 'warning'
      when timeRemaining >= 0  then 'success'
      else 'default'
    @setState {style: style} if style isnt @state.style
  render: ->
    label = <Label className="ndock-timer" bsStyle={@state.style}>
            {
              if @props.completeTime >= 0
                <CountdownTimer countdownId={"ndock-#{@props.dockIndex}"}
                                completeTime={@props.completeTime}
                                tickCallback={@tick} />
            }
            </Label>
    if @state.style in ['primary', 'warning']
      <OverlayTrigger placement='left' overlay={
        <Tooltip id="ndock-finish-by-#{@props.dockIndex}">
          <strong>{__ 'Finish by : '}</strong>{timeToString @props.completeTime}
        </Tooltip>
      }>
        {label}
      </OverlayTrigger>
    else
      label


class NDockInfo
  constructor: ->
    @empty()
  empty: ->
    @name = __ 'Empty'
    @completeTime = -1
  setLocked: ->
    @name = __ 'Locked'
    @completeTime = -1
  update: (ndock) ->
    switch ndock.api_state
      when -1 then @setLocked()
      when 0  then @empty()
      when 1
        @name = window._ships[ndock.api_ship_id].api_name
        @completeTime = ndock.api_complete_time

NdockPanel = React.createClass
  getInitialState: ->
    docks: [1..5].map () -> new NDockInfo
  handleResponse: (e) ->
    {path, body} = e.detail
    {docks} = @state
    switch path
      when '/kcsapi/api_port/port', '/kcsapi/api_get_member/ndock'
        ndocks = if path is '/kcsapi/api_port/port' then body.api_ndock else body
        for ndock in ndocks
          docks[ndock.api_id].update ndock
        @setState
          docks: docks
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  repairIcon: join(ROOT, 'assets', 'img', 'operation', 'repair.png')
  notify: (dockName) ->
    notify "#{i18n.resources.__ dockName} #{__ 'repair completed'}",
      type: 'repair'
      title: __ 'Docking'
      icon: @repairIcon
  render: ->
    <div>
    {
      for i in [1..4]
        <div key={i} className="panel-item ndock-item">
          <span className="ndock-name">
            {i18n.resources.__ @state.docks[i].name}
          </span>
          <CountdownLabel dockIndex={i}
                          completeTime={@state.docks[i].completeTime}
                          notify={@notify.bind @, @state.docks[i].name}/>
        </div>
    }
    </div>

module.exports = NdockPanel
