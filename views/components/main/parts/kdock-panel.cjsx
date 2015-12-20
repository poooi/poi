{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{resolveTime, success, warn} = window
{Panel, Table, OverlayTrigger, Tooltip, Label} = ReactBootstrap
{join} = require 'path-extra'
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)

getMaterialImage = (idx) ->
  return "#{ROOT}/assets/img/material/0#{idx}.png"

showItemDevResultDelay = if window.config.get('poi.delayItemDevResult', false) then 6200 else 500

KdockPanel = React.createClass
  getInitialState: ->
    docks: [
        name: __ 'Empty'
        material: []
        completeTime: -1
        countdown: -1
      ,
        name: __ 'Empty'
        material: []
        completeTime: -1
        countdown: -1
      ,
        name: __ 'Empty'
        material: []
        completeTime: -1
        countdown: -1
      ,
        name: __ 'Empty'
        material: []
        completeTime: -1
        countdown: -1
      ,
        name: __ 'Empty'
        material: []
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
                countdown: -1
                completeTime: -1
            when 0
              docks[id] =
                name: __ 'Empty'
                material: []
                countdown: -1
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
                countdown: Math.floor((kdock.api_complete_time - new Date()) / 1000)
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
                countdown: -1
            when 0
              docks[id] =
                name: __ 'Empty'
                material: []
                completeTime: -1
                countdown: -1
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
                countdown: Math.floor((kdock.api_complete_time - new Date()) / 1000)
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
      when '/kcsapi/api_req_kousyou/createitem'
        if body.api_create_flag == 0
          setTimeout warn.bind(@, __("The development of %s was failed.", "#{window.i18n.resources.__ $slotitems[parseInt(body.api_fdata.split(',')[1])].api_name}")), showItemDevResultDelay
        else if body.api_create_flag == 1
          setTimeout success.bind(@, __("The development of %s was successful.", "#{window.i18n.resources.__ $slotitems[body.api_slot_item.api_slotitem_id].api_name}")), showItemDevResultDelay
  updateCountdown: ->
    {docks, notified} = @state
    for i in [1..4]
      if docks[i].countdown > 0
        docks[i].countdown = Math.floor((docks[i].completeTime - new Date()) / 1000)
        if docks[i].countdown <= 1 && !notified[i]
          notify "#{docks[i].name} #{__ "built"}",
            type: 'construction'
            title: __ "Construction"
            icon: join(ROOT, 'assets', 'img', 'operation', 'build.png')
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
          if @state.docks[i].countdown > 0
            if @state.docks[i].material[0] >= 1500 && @state.docks[i].material[1] >= 1500 && @state.docks[i].material[2] >= 2000 || @state.docks[i].material[3] >= 1000
              <div className="panel-item kdock-item">
                <span className="kdock-name">
                  {i18n.resources.__ @state.docks[i].name}
                </span>
                <Label className="kdock-timer" bsStyle="danger">
                  {resolveTime @state.docks[i].countdown}
                </Label>
              </div>
            else
              <div className="panel-item kdock-item">
                <span className="kdock-name">
                  {i18n.resources.__ @state.docks[i].name}
                </span>
                <Label className="kdock-timer" bsStyle="primary">
                  {resolveTime @state.docks[i].countdown}
                </Label>
              </div>
          else if @state.docks[i].countdown is 0
            <div className="panel-item kdock-item">
              <span className="kdock-name">
                {i18n.resources.__ @state.docks[i].name}
              </span>
              <Label className="kdock-timer" bsStyle="success">
                {resolveTime @state.docks[i].countdown}
              </Label>
            </div>
          else
            <div className="panel-item kdock-item">
              <span className="kdock-name">
                {i18n.resources.__ @state.docks[i].name}
              </span>
              <Label className="kdock-timer" bsStyle="default">
                {resolveTime 0}
              </Label>
            </div>
        }
        </OverlayTrigger>
    }
    </div>

module.exports = KdockPanel
