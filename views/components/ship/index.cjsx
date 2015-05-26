{relative, join} = require 'path-extra'
{_, $, $$, React, ReactBootstrap, ROOT} = window
{$ships, $shipTypes, _ships} = window
{Button, ButtonGroup, Table, ProgressBar, Grid, Col} = ReactBootstrap
{Slotitems} = require './parts'
getStyle = (state) ->
  if state in [0..4]
    # 0: Cond >= 40, Supplied, Repaired, In port
    # 1: 20 <= Cond < 40, or not supplied, or medium damage
    # 2: Cond < 20, or heavy damage
    # 3: Repairing
    # 4: In mission
    return ['success', 'warning', 'danger', 'info', 'primary'][state]
  else
    return 'default'
getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'
getMaterialStyle = (percent) ->
  if percent <= 50
    'danger'
  else if percent <= 75
    'warning'
  else if percent < 100
    'info'
  else
    'success'
getCondStyle = (cond) ->
  if cond > 49
    color: '#FFFF00'
  else if cond < 20
    color: '#DD514C'
  else if cond < 30
    color: '#F37B1D'
  else
    null
getDeckState = (deck, ndocks) ->
  state = 0
  {$ships, _ships} = window
  # In mission
  if deck.api_mission[0] > 0
    state = Math.max(state, 4)
  for shipId in deck.api_ship
    continue if shipId == -1
    idx = _.sortedIndex _ships, {api_id: shipId}, 'api_id'
    ship = _ships[idx]
    shipInfo = $ships[ship.api_ship_id]
    # Cond < 20 or medium damage
    if ship.api_cond < 20 || ship.api_nowhp / ship.api_maxhp < 0.25
      state = Math.max(state, 2)
    # Cond < 40 or heavy damage
    else if ship.api_cond < 40 || ship.api_nowhp / ship.api_maxhp < 0.5
      state = Math.max(state, 1)
    # Not supplied
    if ship.api_fuel / shipInfo.api_fuel_max < 0.99 || ship.api_bull / shipInfo.api_bull_max < 0.99
      state = Math.max(state, 1)
    # Repairing
    if shipId in ndocks
      state = Math.max(state, 3)
  return state
module.exports =
  name: 'ShipView'
  priority: 0.1
  displayName: '舰队'
  description: '舰队展示页面，展示舰队详情信息'
  reactClass: React.createClass
    getInitialState: ->
      name: ['第1艦隊', '第2艦隊', '第3艦隊', '第4艦隊']
      state: [-1, -1, -1, -1]
      deck: []
      ndock: []
      activeDeck: 0
    handleClick: (idx) ->
      @setState
        activeDeck: idx
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      switch path
        when '/kcsapi/api_port/port'
          names = body.api_deck_port.map (e) ->
            e.api_name
          ndocks = body.api_ndock.map (e) ->
            e.api_ship_id
          decks = Object.clone body.api_deck_port
          states = decks.map (deck) ->
            getDeckState deck, ndocks
          @setState
            name: names
            state: states
            deck: decks
            ndock: ndocks
    componentDidMount: ->
      window.addEventListener 'game.response', @handleResponse
    componentWillUnmount: ->
      window.removeEventListener 'game.response', @handleResponse
    render: ->
      <div>
        <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'ship.css')} />
        <ButtonGroup>
        {
          for i in [0..3]
            <Button key={i} bsSize="small"
                            bsStyle={getStyle @state.state[i]}
                            onClick={@handleClick.bind(this, i)}>{@state.name[i]}</Button>
        }
        </ButtonGroup>
        {
          {$ships, $shipTypes, _ships} = window
          for deck, i in @state.deck
            <div className="ship-deck" className={if @state.activeDeck == i then 'show' else 'hidden'} key={i}>
              <Table>
                <tbody>
                {
                  for shipId, j in deck.api_ship
                    continue if shipId == -1
                    idx = _.sortedIndex _ships, {api_id: shipId}, 'api_id'
                    ship = _ships[idx]
                    shipInfo = $ships[ship.api_ship_id]
                    shipType = $shipTypes[shipInfo.api_stype].api_name
                    [
                      <tr key={j * 2}>
                        <td width="20%">{shipType}</td>
                        <td width="22%">Next. {ship.api_exp[1]}</td>
                        <td width="25%" className="material-progress">
                          <Grid>
                            <Col xs={6}>
                              <ProgressBar bsStyle={getMaterialStyle ship.api_fuel / shipInfo.api_fuel_max * 100}
                                           now={ship.api_fuel / shipInfo.api_fuel_max * 100}
                                           label={"#{ship.api_fuel} / #{shipInfo.api_fuel_max}"} />
                            </Col>
                            <Col xs={6}>
                              <ProgressBar bsStyle={getMaterialStyle ship.api_bull / shipInfo.api_bull_max * 100}
                                           now={ship.api_bull / shipInfo.api_bull_max * 100}
                                           label={"#{ship.api_bull} / #{shipInfo.api_bull_max}"} />
                            </Col>
                          </Grid>
                        </td>
                        <td width="33%" style={getCondStyle ship.api_cond}>Cond. {ship.api_cond}</td>
                      </tr>
                      <tr key={j * 2 + 1}>
                        <td>{shipInfo.api_name}</td>
                        <td>Lv. {ship.api_lv}</td>
                        <td className="hp-progress">
                          <ProgressBar bsStyle={getHpStyle ship.api_nowhp / ship.api_maxhp * 100}
                                       now={ship.api_nowhp / ship.api_maxhp * 100}
                                       label={"#{ship.api_nowhp} / #{ship.api_maxhp}"} />
                        </td>
                        <td>
                          <Slotitems data={ship.api_slot} />
                        </td>
                      </tr>
                    ]
                }
                </tbody>
              </Table>
            </div>
        }
      </div>
