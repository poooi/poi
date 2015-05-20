{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{config, proxy} = window
{Panel, Table} = ReactBootstrap
{resolveTime} = window
{notify} = window

MissionPanel = React.createClass
  getInitialState: ->
    decks: [
        name: '第0艦隊'
        countdown: -1
      ,
        name: '第1艦隊'
        countdown: -1
      ,
        name: '第2艦隊'
        countdown: -1
      ,
        name: '第3艦隊'
        countdown: -1
      ,
        name: '第4艦隊'
        countdown: -1
    ]
    notified: []
  handleResponse: (method, path, body, postBody) ->
    switch path
      when '/kcsapi/api_port/port'
        {decks, notified} = @state
        for deck in body.api_deck_port
          id = deck.api_id
          countdown = -1
          switch deck.api_mission[0]
            # In port
            when 0
              countdown = -1
              notified[id] = false
            # In mission
            when 1
              countdown = Math.floor((deck.api_mission[2] - new Date()) / 1000)
            # Just come back
            when 2
              countdown = 0
          decks[id] =
            name: deck.api_name
            countdown: countdown
        @setState
          decks: decks
          notified: notified
      when '/kcsapi/api_req_mission/start'
        id = postBody.api_deck_id
        {decks, notified} = @state
        decks[id].countdown = Math.floor((body.api_complatetime - new Date()) / 1000)
        notified[id] = false
        @setState
          decks: decks
          notified: notified
  updateCountdown: ->
    {decks, notified} = @state
    for i in [1..4]
      if decks[i].countdown > 0
        decks[i].countdown -= 1
        if decks[i].countdown <= 40 && !notified[i]
          notify "#{decks[i].name} 远征归来"
          notified[i] = true
    @setState
      decks: decks
      notified: notified
  componentDidMount: ->
    proxy.addListener 'game.response', @handleResponse
    setInterval @updateCountdown, 1000
  componentWillUnmount: ->
    proxy.removeListener 'game.response', @handleResponse
    clearInterval @updateCountdown, 1000
  render: ->
    <Panel header="远征" bsStyle="info">
      <Table>
        <tbody>
        {
          for i in [1..4]
            <tr key={i}>
              <td>{@state.decks[i]?.name}</td>
              <td>{resolveTime @state.decks[i].countdown}</td>
            </tr>
        }
        </tbody>
      </Table>
    </Panel>

module.exports = MissionPanel
