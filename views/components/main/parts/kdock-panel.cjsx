{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{resolveTime} = window
{Panel, Table, OverlayTrigger, Tooltip} = ReactBootstrap

KdockPanel = React.createClass
  getInitialState: ->
    docks: [
        name: '未使用'
        material: []
        countdown: -1
      ,
        name: '未使用'
        material: []
        countdown: -1
      ,
        name: '未使用'
        material: []
        countdown: -1
      ,
        name: '未使用'
        material: []
        countdown: -1
      ,
        name: '未使用'
        material: []
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
            when 0
              docks[id] =
                name: '未使用'
                material: []
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
                countdown: -1
            when 0
              docks[id] =
                name: '未使用'
                material: []
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
                countdown: 0
        @setState
          docks: docks
          notified: notified
  updateCountdown: ->
    {docks, notified} = @state
    for i in [1..4]
      if docks[i].countdown > 0
        docks[i].countdown -= 1
        if docks[i].countdown <= 1 && !notified[i]
          notify "#{docks[i].name} 建造完成"
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
                    油 {@state.docks[i].material[0]} 弹 {@state.docks[i].material[1]}<br />
                    钢 {@state.docks[i].material[2]} 铝 {@state.docks[i].material[3]}<br />
                    资材 {@state.docks[i].material[4]}
                  </Tooltip>
                }>
                <td>{@state.docks[i].name}</td>
              </OverlayTrigger>
              <td>{resolveTime @state.docks[i].countdown}</td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = KdockPanel
