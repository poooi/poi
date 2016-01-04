{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{resolveTime, success, warn} = window
{Panel, Table, OverlayTrigger, Tooltip, Label} = ReactBootstrap
{join} = require 'path-extra'
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)

showItemDevResultDelay = if window.config.get('poi.delayItemDevResult', false) then 6200 else 500


CountdownTimer = require './countdown-timer'
CountdownLabel = React.createClass
  getInitialState: ->
    style: 'default'
  tick: (timeRemaining) ->
    style = 'default'
    if timeRemaining > 600
      style = if @props.isLSC then 'danger' else 'primary'
    else if timeRemaining > 0
      style = 'warning'
    else if timeRemaining is 0
      style = 'success'
    @setState {style: style} if style isnt @state.style
  notify: ->
    notify "#{@props.dockName} 建造完成",
      type: 'construction'
      icon: join(ROOT, 'assets', 'img', 'operation', 'build.png')
  render: ->
    <Label bsStyle={@state.style}>
    {
      if @props.completeTime >= 0
        <CountdownTimer countdownId={"kdock-#{@props.dockIndex}"}
                        completeTime={@props.completeTime}
                        tickCallback={@tick}
                        completeCallback={@notify} />
    }
    </Label>


class KDockInfo
  constructor: ->
    @empty()
  empty: ->
    @name = __ 'Empty'
    @material = []
    @completeTime = -1
  setLocked: ->
    @name = __ 'Locked'
    @material = []
    @completeTime = -1
  update: (kdock) ->
    switch kdock.api_state
      when -1
        @setLocked()
      when 0
        @empty()
      when 2, 3
        @name = window.$ships[kdock.api_created_ship_id].api_name
        @material =  [
          kdock.api_item1
          kdock.api_item2
          kdock.api_item3
          kdock.api_item4
          kdock.api_item5
        ]
        @completeTime = if kdock.api_state is 2 then kdock.api_complete_time else 0

getMaterialImage = (idx) ->
  path = join(ROOT, 'assets', 'img', 'material', "0#{idx}.png")
  <img src={path} className="material-icon" />

KdockPanel = React.createClass
  getInitialState: ->
    docks: new Array(5).fill(0).map () -> new KDockInfo
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {$ships} = window
    {docks} = @state
    switch path
      when '/kcsapi/api_get_member/kdock', '/kcsapi/api_req_kousyou/getship'
        kdocks = body
        kdocks = body.api_kdock if path is '/kcsapi/api_req_kousyou/getship'
        for kdock in kdocks
          docks[kdock.api_id].update kdock
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
  render: ->
    <div>
    {
      for i in [1..4]
        dockName = i18n.resources.__ @state.docks[i].name
        isLSC = @state.docks[i].material[0] >= 1000
        content = <div className="panel-item kdock-item">
                    <span className="kdock-name">{dockName}</span>
                    <CountdownLabel key={i}
                                    dockIndex={i}
                                    completeTime={@state.docks[i].completeTime}
                                    isLSC={isLSC}
                                    dockName={dockName} />
                  </div>

        <OverlayTrigger key={i} placement='top' overlay={
          <Tooltip id="kdock-material-#{i}">
            {
              if isLSC
                <span>
                  <strong style={color: '#d9534f'}>
                    {dockName}
                  </strong>
                  <br/>
                </span>
              else
                <span>{dockName}<br/></span>
            }
            {getMaterialImage 1} {@state.docks[i].material[0]}
            {getMaterialImage 2} {@state.docks[i].material[1]}
            {getMaterialImage 3} {@state.docks[i].material[2]}
            {getMaterialImage 4} {@state.docks[i].material[3]}
            {getMaterialImage 7} {@state.docks[i].material[4]}
          </Tooltip>
        }>
        {content}
        </OverlayTrigger>
    }
    </div>

module.exports = KdockPanel
