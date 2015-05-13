{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{config, proxy} = window
{resolveTime} = window
{Panel, Table} = ReactBootstrap

KdockPanel = React.createClass
  getInitialState: ->
    docks: [
        name: '未使用'
        countdown: -1
      ,
        name: '未使用'
        countdown: -1
      ,
        name: '未使用'
        countdown: -1
      ,
        name: '未使用'
        countdown: -1
      ,
        name: '未使用'
        countdown: -1
    ]
    notified: []
  handleResponse: (method, path, body, postBody) ->
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
                countdown: -1
            when 0
              docks[id] =
                name: '未使用'
                countdown: -1
              notified[id] = false
            when 2
              docks[id] =
                name: $ships[kdock.api_created_ship_id].api_name
                countdown: Math.floor((kdock.api_complete_time - new Date()) / 1000)
            when 3
              docks[id] =
                name: $ships[kdock.api_created_ship_id].api_name
                countdown: 0
        @setState
          docks: docks
          notified: notified
      when '/kcspai/api_req_kousyou/getship'
        for kdock in body.api_kdock
          id = kdock.api_id
          switch kdock.api_state
            when -1
              docks[id] =
                name: '未解锁'
                countdown: -1
            when 0
              docks[id] =
                name: '未使用'
                countdown: -1
              notified[id] = false
            when 2
              docks[id] =
                name: $ships[kdock.api_created_ship_id].api_name
                countdown: Math.floor((kdock.api_complete_time - new Date()) / 1000)
            when 3
              docks[id] =
                name: $ships[kdock.api_created_ship_id].api_name
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
    proxy.addListener 'game.response', @handleResponse
    setInterval @updateCountdown, 1000
  componentWillUnmount: ->
    proxy.removeListener 'game.response', @handleResponse
    clearInterval @updateCountdown, 1000
  render: ->
    style =
      width: '50%'
    <Panel header="建造" bsStyle="danger">
      <Table>
        <tbody>
        {
          for i in [1..4]
            <tr>
              <td>{@state.docks[i].name}</td>
              <td>{resolveTime @state.docks[i].countdown}</td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = KdockPanel
