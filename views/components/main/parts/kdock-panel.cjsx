{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{resolveTime, success, warn} = window
{Panel, Table, OverlayTrigger, Tooltip, Label} = ReactBootstrap
{join} = require 'path-extra'
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)

getMaterialImage = (idx) ->
  return "#{ROOT}/assets/img/material/0#{idx}.png"

getCountDown = (completeTime) ->
  diff = completeTime - Date.now()
  if diff < 0 then 0 else Math.floor(diff / 1000)

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
    console.log "ignore this notify" if @props.completeTime is 0
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


KdockPanel = React.createClass
  getInitialState: ->
    docks: [
        name: __ 'Empty'
        material: []
        completeTime: -1
      ,
        name: __ 'Empty'
        material: []
        completeTime: -1
      ,
        name: __ 'Empty'
        material: []
        completeTime: -1
      ,
        name: __ 'Empty'
        material: []
        completeTime: -1
      ,
        name: __ 'Empty'
        material: []
        completeTime: -1
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
    {$ships} = window
    {docks, notified} = @state
    switch path
      when '/kcsapi/api_get_member/kdock'
        for kdock in body
          id = kdock.api_id
          switch kdock.api_state
            when -1
              docks[id] =
                name: __ 'Locked'
                material: []
                completeTime: -1
            when 0
              docks[id] =
                name: __ 'Empty'
                material: []
                completeTime: -1
              notified[id] = false
            when 2
              docks[id] =
                name: $ships[kdock.api_created_ship_id].api_name
                material: [
                  kdock.api_item1
                  kdock.api_item2
                  kdock.api_item3
                  kdock.api_item4
                  kdock.api_item5
                ]
                completeTime: kdock.api_complete_time
            when 3
              docks[id] =
                name: $ships[kdock.api_created_ship_id].api_name
                material: [
                  kdock.api_item1
                  kdock.api_item2
                  kdock.api_item3
                  kdock.api_item4
                  kdock.api_item5
                ]
                completeTime: 0
                countdown: 0
        @setState
          docks: docks
          notified: notified
      when '/kcsapi/api_req_kousyou/getship'
        for kdock in body.api_kdock
          id = kdock.api_id
          switch kdock.api_state
            when -1
              docks[id] =
                name: __ 'Locked'
                material: []
                completeTime: -1
            when 0
              docks[id] =
                name: __ 'Empty'
                material: []
                completeTime: -1
              notified[id] = false
            when 2
              docks[id] =
                name: $ships[kdock.api_created_ship_id].api_name
                material: [
                  kdock.api_item1
                  kdock.api_item2
                  kdock.api_item3
                  kdock.api_item4
                  kdock.api_item5
                ]
                completeTime: kdock.api_complete_time
            when 3
              docks[id] =
                name: $ships[kdock.api_created_ship_id].api_name
                material: [
                  kdock.api_item1
                  kdock.api_item2
                  kdock.api_item3
                  kdock.api_item4
                  kdock.api_item5
                ]
                completeTime: 0
        @setState
          docks: docks
          notified: notified
      when '/kcsapi/api_req_kousyou/createitem'
        if body.api_create_flag == 0
          setTimeout warn.bind(@, __("The development of %s was failed.", "#{window.i18n.resources.__ $slotitems[parseInt(body.api_fdata.split(',')[1])].api_name}")), showItemDevResultDelay
        else if body.api_create_flag == 1
          setTimeout success.bind(@, __("The development of %s was successful.", "#{window.i18n.resources.__ $slotitems[body.api_slot_item.api_slotitem_id].api_name}")), showItemDevResultDelay
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    window.addEventListener 'view.main.visible', @handleVisibleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
    window.removeEventListener 'view.main.visible', @handleVisibleResponse
  render: ->
    <div>
    {
      for i in [1..4]
        <OverlayTrigger key={i} placement='top' overlay={
          <Tooltip id="kdock-material-#{i}">
            {
              if @state.docks[i].material[0] >= 1500 && @state.docks[i].material[1] >= 1500 && @state.docks[i].material[2] >= 2000 || @state.docks[i].material[3] >= 1000
                <span>
                  <strong style={color: '#d9534f'}>
                    {i18n.resources.__ @state.docks[i].name}
                  </strong>
                  <br/>
                </span>
              else
                <span>{i18n.resources.__ @state.docks[i].name}<br/></span>
            }
            <img src={getMaterialImage 1} className="material-icon" /> {@state.docks[i].material[0]}
            <img src={getMaterialImage 2} className="material-icon" /> {@state.docks[i].material[1]}
            <img src={getMaterialImage 3} className="material-icon" /> {@state.docks[i].material[2]}
            <img src={getMaterialImage 4} className="material-icon" /> {@state.docks[i].material[3]}
            <img src={getMaterialImage 7} className="material-icon" /> {@state.docks[i].material[4]}
          </Tooltip>
        }>
        {
          countdown = <CountdownLabel key={i}
                                      dockIndex={i}
                                      completeTime={@state.docks[i].completeTime}
                                      isLSC={@state.docks[i].material[0] >= 1000}
                                      dockName={i18n.resources.__ @state.docks[i].name} />
          if @state.docks[i].countdown > 0
            if @state.docks[i].material[0] >= 1500 && @state.docks[i].material[1] >= 1500 && @state.docks[i].material[2] >= 2000 || @state.docks[i].material[3] >= 1000
              <div className="panel-item kdock-item">
                <span className="kdock-name">
                  {i18n.resources.__ @state.docks[i].name}
                </span>
                {countdown}
              </div>
            else
              <div className="panel-item kdock-item">
                <span className="kdock-name">
                  {i18n.resources.__ @state.docks[i].name}
                </span>
                {countdown}
              </div>
          else if @state.docks[i].countdown is 0
            <div className="panel-item kdock-item">
              <span className="kdock-name">
                {i18n.resources.__ @state.docks[i].name}
              </span>
              {countdown}
            </div>
          else
            <div className="panel-item kdock-item">
              <span className="kdock-name">
                {i18n.resources.__ @state.docks[i].name}
              </span>
              {countdown}
            </div>
        }
        </OverlayTrigger>
    }
    </div>

module.exports = KdockPanel
