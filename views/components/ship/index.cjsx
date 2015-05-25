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
  if percent < 25
    'danger'
  else if percent < 50
    'warning'
  else if percent < 75
    'info'
  else
    'success'
getMaterialStyle = (percent) ->
  if percent < 50
    'danger'
  else if percent < 75
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
      activeDeck: 0
    handleClick: (idx) ->
      @setState
        activeDeck: idx
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      switch path
        when '/kcsapi/api_port/port'
          @setState
            deck: body.api_deck_port
    componentDidMount: ->
      window.addEventListener 'game.response', @handleResponse
    componentWillUnmount: ->
      window.removeEventListener 'game.response', @handleResponse
    render: ->
      <div>
        {
          # Update current data
          if {$ships, $shipTypes, _ships} = window
            null
        }
        <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'ship.css')} />
        <ButtonGroup>
        {
          for i in [0..3]
            <Button key={i} bsSize="small" bsStyle={getStyle @state.state[i]} onClick={@handleClick.bind(this, i)}>{@state.name[i]}</Button>
        }
        </ButtonGroup>
        {
          for deck, i in @state.deck
            <div className="ship-deck" className={if @state.activeDeck == i then 'show' else 'hidden'} key={i}>
              <Table>
                <tbody>
                {
                  for shipId, j in deck.api_ship
                    continue if shipId == -1
                    ship = _.find _ships, (e) ->
                      e.api_id == shipId
                    shipInfo = $ships[ship.api_ship_id]
                    shipType = $shipTypes[shipInfo.api_stype].api_name
                    [
                      <tr key={j * 2}>
                        <td>{shipType}</td>
                        <td>Next. {ship.api_exp[1]}</td>
                        <td className="material-progress">
                          <Grid>
                            <Col xs={6}>
                              <ProgressBar bsStyle={getMaterialStyle ship.api_fuel / shipInfo.api_fuel_max * 100} now={ship.api_fuel / shipInfo.api_fuel_max * 100} label={"#{ship.api_fuel} / #{shipInfo.api_fuel_max}"} />
                            </Col>
                            <Col xs={6}>
                              <ProgressBar bsStyle={getMaterialStyle ship.api_bull / shipInfo.api_bull_max * 100} now={ship.api_bull / shipInfo.api_bull_max * 100} label={"#{ship.api_bull} / #{shipInfo.api_bull_max}"} />
                            </Col>
                          </Grid>
                        </td>
                        <td style={getCondStyle ship.api_cond}>Cond. {ship.api_cond}</td>
                      </tr>
                      <tr key={j * 2 + 1}>
                        <td>{shipInfo.api_name}</td>
                        <td>Lv. {ship.api_lv}</td>
                        <td className="hp-progress">
                          <ProgressBar striped bsStyle={getHpStyle ship.api_nowhp / ship.api_maxhp * 100} now={ship.api_nowhp / ship.api_maxhp * 100} label={"#{ship.api_nowhp} / #{ship.api_maxhp}"} />
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
