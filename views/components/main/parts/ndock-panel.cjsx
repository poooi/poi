{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{Label, OverlayTrigger, Tooltip} = ReactBootstrap
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
    @notify() if timeRemaining <= 60

    style = @getLabelStyle timeRemaining
    @setState {style: style} if style isnt @state.style
  render: ->
    <OverlayTrigger placement='left' overlay={
      switch @state.style
        when 'primary', 'warning'
          <Tooltip id="ndock-finish-by-#{@props.dockIndex}">
            <strong>{__ 'Finish by : '}</strong>{timeToString @props.completeTime}
          </Tooltip>
        else
          <span />
    }>
      <Label className="ndock-timer" bsStyle={@state.style}>
      {
        if @props.completeTime >= 0
          <CountdownTimer countdownId={"ndock-#{@props.dockIndex}"}
                          completeTime={@props.completeTime}
                          tickCallback={@tick} />
      }
      </Label>
    </OverlayTrigger>


class NDockInfo
  constructor: (ndockApi) ->
    if ndockApi? then @update(ndockApi) else @empty()
  empty: ->
    @name = __ 'Empty'
    @completeTime = -1
  setLocked: ->
    @name = __ 'Locked'
    @completeTime = -1
  update: (ndockApi) ->
    switch ndockApi.api_state
      when -1 then @setLocked()
      when 0  then @empty()
      when 1
        @name = window._ships[ndockApi.api_ship_id].api_name
        @completeTime = ndockApi.api_complete_time

NdockPanel = React.createClass
  getInitialState: ->
    docks: [1..4].map () -> new NDockInfo
  handleResponse: (e) ->
    {path, body, postBody} = e.detail
    switch path
      when '/kcsapi/api_port/port', '/kcsapi/api_get_member/ndock'
        ndocks = if path is '/kcsapi/api_port/port' then body.api_ndock else body
        docks = ndocks.map (ndock) -> new NDockInfo(ndock)
        if !_.isEqual docks, @state.docks
          @setState
            docks: docks
      when '/kcsapi/api_req_nyukyo/speedchange'
        docks = @state.docks.slice()
        docks[postBody.api_ndock_id - 1] = new NDockInfo
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
      for dock, i in @state.docks
        <div key={i} className="panel-item ndock-item">
          <span className="ndock-name">{i18n.resources.__ dock.name}</span>
          <CountdownLabel dockIndex={i}
                          completeTime={dock.completeTime}
                          notify={@notify.bind @, dock.name}/>
        </div>
    }
    </div>

module.exports = NdockPanel
