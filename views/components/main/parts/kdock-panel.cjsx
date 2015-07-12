{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{resolveTime, success, warn} = window
{Panel, Table, OverlayTrigger, Tooltip, Label} = ReactBootstrap
{join} = require 'path-extra'

getMaterialImage = (idx) ->
  return "#{ROOT}/assets/img/material/0#{idx}.png"

KdockPanel = React.createClass
  getInitialState: ->
    docks: [
        name: '未使用'
        material: []
        completeTime: -1
        countdown: -1
      ,
        name: '未使用'
        material: []
        completeTime: -1
        countdown: -1
      ,
        name: '未使用'
        material: []
        completeTime: -1
        countdown: -1
      ,
        name: '未使用'
        material: []
        completeTime: -1
        countdown: -1
      ,
        name: '未使用'
        material: []
        completeTime: -1
        countdown: -1
    ]
    notified: []
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
                name: '未解锁'
                material: []
                countdown: -1
                completeTime: -1
            when 0
              docks[id] =
                name: '未使用'
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
                name: '未解锁'
                material: []
                completeTime: -1
                countdown: -1
            when 0
              docks[id] =
                name: '未使用'
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
          setTimeout warn.bind(@, "#{$slotitems[parseInt(body.api_fdata.split(',')[1])].api_name} 开发失败"), 500
        else if body.api_create_flag == 1
          setTimeout success.bind(@, "#{$slotitems[body.api_slot_item.api_slotitem_id].api_name} 开发成功"), 500
  updateCountdown: ->
    {docks, notified} = @state
    for i in [1..4]
      if docks[i].countdown > 0
        docks[i].countdown = Math.floor((docks[i].completeTime - new Date()) / 1000)
        if docks[i].countdown <= 1 && !notified[i]
          notify "#{docks[i].name} 建造完成", {icon: join(ROOT, 'assets', 'img', 'operation', 'build.png')}
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
    <Panel header="建造" bsStyle="danger">
      <Table>
        <tbody>
        {
          for i in [1..4]
            <tr key={i}>
              <OverlayTrigger placement='left' overlay={
                  <Tooltip>
                    <img src={getMaterialImage 1} className="material-icon" /> {@state.docks[i].material[0]} <img src={getMaterialImage 3} className="material-icon" /> {@state.docks[i].material[2]}<br />
                    <img src={getMaterialImage 2} className="material-icon" /> {@state.docks[i].material[1]} <img src={getMaterialImage 4} className="material-icon" /> {@state.docks[i].material[3]}<br />
                    <img src={getMaterialImage 7} className="material-icon" /> {@state.docks[i].material[4]}
                  </Tooltip>
                }>
                {
                  if @state.docks[i].material[0] >= 1500 && @state.docks[i].material[1] >= 1500 && @state.docks[i].material[2] >= 2000 || @state.docks[i].material[3] >= 1000
                    <td><strong style={color: '#d9534f'}>{@state.docks[i].name}</strong></td>
                  else
                    <td>{@state.docks[i].name}</td>
                }
              </OverlayTrigger>
              <td>
                {
                  if @state.docks[i].countdown > 0
                    if @state.docks[i].material[0] >= 1500 && @state.docks[i].material[1] >= 1500 && @state.docks[i].material[2] >= 2000 || @state.docks[i].material[3] >= 1000
                      <Label bsStyle="danger">{resolveTime @state.docks[i].countdown}</Label>
                    else
                      <Label bsStyle="primary">{resolveTime @state.docks[i].countdown}</Label>
                  else if @state.docks[i].countdown is 0
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

module.exports = KdockPanel
