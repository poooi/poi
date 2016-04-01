{ROOT, layout, _, $, $$, React, ReactBootstrap, success, warn} = window
{OverlayTrigger, Tooltip, Label} = ReactBootstrap
{join} = require 'path-extra'
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)
{MaterialIcon} = require '../../etc/icon'

showItemDevResultDelay = if window.config.get('poi.delayItemDevResult', false) then 6200 else 500


CountdownTimer = require './countdown-timer'
CountdownLabel = React.createClass
  getLabelStyle: (timeRemaining) ->
    switch
      when timeRemaining > 600 and @props.isLSC then 'danger'
      when timeRemaining > 600 then 'primary'
      when timeRemaining >  0  then 'warning'
      when timeRemaining is 0  then 'success'
      else 'default'
  getInitialState: ->
    style: @getLabelStyle(CountdownTimer.getTimeRemaining @props.completeTime)
  componentWillReceiveProps: (nextProps) ->
    if nextProps.completeTime isnt @props.completeTime
      @setState
        style: @getLabelStyle(CountdownTimer.getTimeRemaining nextProps.completeTime)
  shouldComponentUpdate: (nextProps, nextState) ->
    nextProps.completeTime isnt @props.completeTime or nextState.style isnt @state.style
  tick: (timeRemaining) ->
    style = @getLabelStyle timeRemaining
    @setState {style: style} if style isnt @state.style
  render: ->
    <Label className="kdock-timer" bsStyle={@state.style}>
    {
      if @props.completeTime >= 0
        <CountdownTimer countdownId={"kdock-#{@props.dockIndex+1}"}
                        completeTime={@props.completeTime}
                        tickCallback={@tick}
                        completeCallback={@props.notify} />
    }
    </Label>


class KDockInfo
  constructor: (kdockApi) ->
    if kdockApi? then @update(kdockApi) else @empty()
  empty: ->
    @name = __ 'Empty'
    @material = []
    @completeTime = -1
  setLocked: ->
    @name = __ 'Locked'
    @material = []
    @completeTime = -1
  update: (kdockApi) ->
    switch kdockApi.api_state
      when -1 then @setLocked()
      when 0  then @empty()
      when 2, 3
        @name = window.$ships[kdockApi.api_created_ship_id].api_name
        @material =  [
          kdockApi.api_item1
          kdockApi.api_item2
          kdockApi.api_item3
          kdockApi.api_item4
          kdockApi.api_item5
        ]
        @completeTime = kdockApi.api_complete_time
  clone: ->
    kdi = new KDockInfo
    kdi.name = @name
    kdi.material = @material.slice()
    kdi.completeTime = @completeTime
    kdi

KdockPanel = React.createClass
  canNotify: false
  getInitialState: ->
    docks: [1..4].map () -> new KDockInfo
  handleResponse: (e) ->
    {path, body, postBody} = e.detail
    switch path
      when '/kcsapi/api_start2'
        # Do not notify before entering the game
        @canNotify = false
      when '/kcsapi/api_port/port'
        @canNotify = true
      when '/kcsapi/api_get_member/require_info',\
           '/kcsapi/api_get_member/kdock',\
           '/kcsapi/api_req_kousyou/getship'
        kdocks = body
        if path is '/kcsapi/api_get_member/require_info' or path is '/kcsapi/api_req_kousyou/getship'
          kdocks = body.api_kdock
        docks = kdocks.map (kdock) -> new KDockInfo(kdock)
        if !_.isEqual docks, @state.docks
          @setState
            docks: docks
      when '/kcsapi/api_req_kousyou/createship_speedchange'
        console.assert body.api_result == 1, "body.api_result isn't 1: ", body
        docks = @state.docks.slice()    # elements still referring to @state
        idx = postBody.api_kdock_id - 1
        docks[idx] = docks[idx].clone() # make a copy of the one to be modified
        docks[idx].completeTime = 0
        @setState
          docks: docks
      when '/kcsapi/api_req_kousyou/createitem'
        if body.api_create_flag == 0
          setTimeout warn.bind(@, __("The development of %s was failed.",
            "#{window.i18n.resources.__ $slotitems[parseInt(body.api_fdata.split(',')[1])].api_name}")),
            showItemDevResultDelay
        else if body.api_create_flag == 1
          setTimeout success.bind(@, __("The development of %s was successful.",
            "#{window.i18n.resources.__ $slotitems[body.api_slot_item.api_slotitem_id].api_name}")),
            showItemDevResultDelay
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  getMaterialImage: (idx) ->
    <MaterialIcon materialId={idx} className="material-icon" />
  constructionIcon: join(ROOT, 'assets', 'img', 'operation', 'build.png')
  notify: ->
    return if not @canNotify
    # Notify all completed ships
    completedShips = @state.docks.filter(
      (dock) -> 0 <= dock.completeTime < Date.now() + 1000).map(
      (dock) -> i18n.resources.__ dock.name).join(', ')
    notify "#{completedShips} #{__ 'built'}",
      type: 'construction'
      title: __ "Construction"
      icon: @constructionIcon
  render: ->
    <div>
    {
      for dock, i in @state.docks
        dockName = i18n.resources.__ dock.name
        isInUse = dock.completeTime >= 0
        isLSC = isInUse and dock.material[0] >= 1000
        <OverlayTrigger key={i} placement='top' overlay={
          if isInUse
            <Tooltip id="kdock-material-#{i}">
              {
                style = if isLSC then {color: '#D9534F', fontWeight: 'bold'} else null
                <span style={style}>{dockName}<br /></span>
              }
              {@getMaterialImage 1} {dock.material[0]}
              {@getMaterialImage 2} {dock.material[1]}
              {@getMaterialImage 3} {dock.material[2]}
              {@getMaterialImage 4} {dock.material[3]}
              {@getMaterialImage 7} {dock.material[4]}
            </Tooltip>
          else
            <span />
        }>
          <div className="panel-item kdock-item">
            <span className="kdock-name">{dockName}</span>
            <CountdownLabel dockIndex={i}
                            completeTime={dock.completeTime}
                            isLSC={isLSC}
                            notify={if dock.completeTime > 0 then _.once(@notify) else null} />
          </div>
        </OverlayTrigger>
    }
    </div>

module.exports = KdockPanel
