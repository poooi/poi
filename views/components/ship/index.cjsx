{relative, join} = require 'path-extra'
{_, $, $$, React, ReactBootstrap, ROOT, resolveTime, toggleModal, notify} = window
{$ships, $shipTypes, _ships} = window
{Button, ButtonGroup, Table, ProgressBar, OverlayTrigger, Tooltip, Grid, Col, Alert} = ReactBootstrap
{Slotitems} = require './parts'
inBattle = [false, false, false, false]
getStyle = (state) ->
  if state in [0..5]
    # 0: Cond >= 40, Supplied, Repaired, In port
    # 1: 20 <= Cond < 40, or not supplied, or medium damage
    # 2: Cond < 20, or heavy damage
    # 3: Repairing
    # 4: In mission
    # 5: In map
    return ['success', 'warning', 'danger', 'info', 'primary', 'default'][state]
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
  if inBattle[deck.api_id - 1]
    state = Math.max(state, 5)
  if deck.api_mission[0] > 0
    state = Math.max(state, 4)
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
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
  state
getDeckMessage = (deck) ->
  {$ships, $slotitems, _ships} = window
  totalLv = totalShip = totalTyku = totalSaku = shipSaku = itemSaku = teitokuSaku = 0
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    shipInfo = $ships[ship.api_ship_id]
    totalLv += ship.api_lv
    totalShip += 1
    shipSaku += Math.sqrt(ship.api_sakuteki[0]) * 1.69
    for itemId, slotId in ship.api_slot
      continue if itemId == -1
      item = _slotitems[itemId]
      itemInfo = $slotitems[item.api_slotitem_id]
      # Airplane Tyku
      if itemInfo.api_type[3] in [6, 7, 8]
        totalTyku += Math.floor(Math.sqrt(ship.api_onslot[slotId]) * itemInfo.api_tyku)
      else if itemInfo.api_type[3] == 10 && itemInfo.api_type[2] == 11
        totalTyku += Math.floor(Math.sqrt(ship.api_onslot[slotId]) * itemInfo.api_tyku)
      # Saku
      # 索敵スコア = 艦上爆撃機 × (1.04) + 艦上攻撃機 × (1.37) + 艦上偵察機 × (1.66) + 水上偵察機 × (2.00)
      #            + 水上爆撃機 × (1.78) + 小型電探 × (1.00) + 大型電探 × (0.99) + 探照灯 × (0.91)
      #            + √(各艦毎の素索敵) × (1.69) + (司令部レベルを5の倍数に切り上げ) × (-0.61)
      switch itemInfo.api_type[3]
        when 7
          itemSaku += itemInfo.api_saku * 1.04
        when 8
          itemSaku += itemInfo.api_saku * 1.37
        when 9
          itemSaku += itemInfo.api_saku * 1.66
        when 10
          if itemInfo.api_type[2] == 10
            itemSaku += itemInfo.api_saku * 2.00
          else if itemInfo.api_type[2] == 11
            itemSaku += itemInfo.api_saku * 1.78
        when 11
          if itemInfo.api_type[2] == 12
            itemSaku += itemInfo.api_saku * 1.00
          else if itemInfo.api_type[2] == 13
            itemSaku += itemInfo.api_saku * 0.99
        when 24
          itemSaku += itemInfo.api_saku * 0.91
  teitokuSaku = 0.61 * Math.floor((window._teitokuLv + 4) / 5) * 5
  totalSaku = shipSaku + itemSaku - teitokuSaku
  avgLv = totalLv / totalShip
  [totalLv, parseFloat(avgLv.toFixed(0)), totalTyku, parseFloat(totalSaku.toFixed(0)), parseFloat(shipSaku.toFixed(2)), parseFloat(itemSaku.toFixed(2)), parseFloat(teitokuSaku.toFixed(2))]
getCondCountdown = (deck) ->
  {$ships, $slotitems, _ships} = window
  countdown = 0
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    if ship.api_cond < 49
      countdown = Math.max(countdown, Math.ceil((49 - ship.api_cond) / 3) * 180)
  countdown
module.exports =
  name: 'ShipView'
  priority: 0.1
  displayName: '舰队'
  description: '舰队展示页面，展示舰队详情信息'
  reactClass: React.createClass
    getInitialState: ->
      names: ['第1艦隊', '第2艦隊', '第3艦隊', '第4艦隊']
      states: [-1, -1, -1, -1]
      messages: ['没有舰队信息', '没有舰队信息', '没有舰队信息', '没有舰队信息']
      countdown: [0, 0, 0, 0]
      decks: []
      ndocks: []
      activeDeck: 0
    handleClick: (idx) ->
      @setState
        activeDeck: idx
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {names, decks, ndocks} = @state
      flag = true
      switch path
        when '/kcsapi/api_port/port'
          names = body.api_deck_port.map (e) ->
            e.api_name
          ndocks = body.api_ndock.map (e) ->
            e.api_ship_id
          decks = Object.clone body.api_deck_port
          inBattle = [false, false, false, false]
        when '/kcsapi/api_req_hensei/change'
          {decks} = @state
          deckId = parseInt(postBody.api_id) - 1
          idx = parseInt(postBody.api_ship_idx)
          curId = decks[deckId].api_ship[idx]
          shipId = parseInt(postBody.api_ship_id)
          # Remove all
          if idx == -1
            decks[deckId].api_ship[i] = -1 for i in [1..5]
          # Empty -> One
          else if curId == -1
            decks[deckId].api_ship[idx] = shipId
          # One -> Empty
          else if shipId == -1
            for i in [idx..4]
              decks[deckId].api_ship[i] = decks[deckId].api_ship[i + 1]
            decks[deckId].api_ship[5] = -1
          else
            [x, y] = [-1, -1]
            for deck, i in decks
              for ship, j in deck.api_ship
                if ship == shipId
                  [x, y] = [i, j]
                  break
            decks[deckId].api_ship[idx] = shipId
            # Exchange
            decks[x].api_ship[y] = curId if x != -1 && y != -1
        when '/kcsapi/api_req_hokyu/charge'
          {decks} = @state
        when '/kcsapi/api_get_member/deck'
          {decks} = @state
          decks[deck.api_id - 1] = deck for deck in body
        when '/kcsapi/api_get_member/ship_deck'
          {decks} = @state
          decks[deck.api_id - 1] = deck for deck in body.api_deck_data
        when '/kcsapi/api_get_member/ship3'
          {decks} = @state
          decks[deck.api_id - 1] = deck for deck in body.api_deck_data
        when '/kcsapi/api_req_map/start'
          deckId = parseInt(postBody.api_deck_id) - 1
          inBattle[deckId] = true
        when '/kcsapi/api_req_kousyou/destroyship'
          {decks} = @state
          removeId = parseInt(postBody.api_ship_id)
          [x, y] = [-1, -1]
          for deck, i in decks
            for shipId, j in deck.api_ship
              if shipId == removeId
                [x, y] = [i, j]
                break
          if x != -1 && y != -1
            if y == 5
              decks[x].api_ship[y] = -1
            else
              for idx in [y..4]
                decks[x].api_ship[idx] = decks[x].api_ship[idx + 1]
              decks[x].api_ship[5] = -1
        when '/kcsapi/api_req_map/next'
          {decks, states} = @state
          {$ships, _ships} = window
          for deck, i in decks
            continue if states[i] != 5
            for shipId in deck.api_ship
              continue if shipId == -1
              ship = _ships[shipId]
              if ship.api_nowhp / ship.api_maxhp < 0.250001
                shipInfo = $ships[ship.api_ship_id]
                toggleModal '进击注意！', "Lv. #{ship.api_lv} - #{shipInfo.api_name} 大破，可能会被击沉！"
        else
          flag = false
      return unless flag
      # Global decks for plugins!
      window._decks = Object.clone decks
      states = decks.map (deck) ->
        getDeckState deck, ndocks
      messages = decks.map (deck) ->
        getDeckMessage deck
      countdown = decks.map (deck) ->
        getCondCountdown deck
      @setState
        names: names
        decks: decks
        ndocks: ndocks
        states: states
        messages: messages
        countdown: countdown
    updateCountdown: ->
      {countdown, states} = @state
      for i in [0..3]
        if countdown[i] > 0
          countdown[i] -= 1
          if countdown[i] is 0 and states[i] < 4
            notify "#{@state.names[i]} 疲劳回复完成", {icon: join(ROOT, 'assets', 'img', 'operation', 'sortie.png')}
      @setState
        countdown: countdown
    componentDidMount: ->
      window.addEventListener 'game.response', @handleResponse
      setInterval @updateCountdown, 1000
    componentWillUnmount: ->
      window.removeEventListener 'game.response', @handleResponse
      clearInterval @updateCountdown, 1000
    render: ->
      <div>
        <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'ship.css')} />
        <ButtonGroup>
        {
          for i in [0..3]
            <Button key={i} bsSize="small"
                            bsStyle={getStyle @state.states[i]}
                            onClick={@handleClick.bind(this, i)}>{@state.names[i]}</Button>
        }
        </ButtonGroup>
        {
          {$ships, $shipTypes, _ships} = window
          for deck, i in @state.decks
            <div className="ship-deck" className={if @state.activeDeck == i then 'show' else 'hidden'} key={i}>
              <Alert bsStyle={getStyle @state.states[i]}>
                <Grid>
                  <Col xs={2}>
                    总 Lv.{@state.messages[i][0]}
                  </Col>
                  <Col xs={2}>
                    均 Lv.{@state.messages[i][1]}
                  </Col>
                  <Col xs={2}>
                    制空：{@state.messages[i][2]}
                  </Col>
                  <Col xs={2}>
                    <OverlayTrigger placement='bottom' overlay={<Tooltip>[艦娘]{@state.messages[i][4]} + [装備]{@state.messages[i][5]} - [司令部]{@state.messages[i][6]}</Tooltip>}>
                      <span>索敌：{@state.messages[i][3]}</span>
                    </OverlayTrigger>
                  </Col>
                  <Col xs={4}>
                    回复：{resolveTime @state.countdown[i]}
                  </Col>
                </Grid>
              </Alert>
              <Table>
                <tbody>
                {
                  for shipId, j in deck.api_ship
                    continue if shipId == -1
                    ship = _ships[shipId]
                    shipInfo = $ships[ship.api_ship_id]
                    shipType = $shipTypes[shipInfo.api_stype].api_name
                    [
                      <tr key={j * 2}>
                        <td width="20%">{shipInfo.api_name}</td>
                        <td width="22%">Lv. {ship.api_lv}</td>
                        <td width="25%" className="hp-progress">
                          <ProgressBar bsStyle={getHpStyle ship.api_nowhp / ship.api_maxhp * 100}
                                       now={ship.api_nowhp / ship.api_maxhp * 100}
                                       label={"#{ship.api_nowhp} / #{ship.api_maxhp}"} />
                        </td>
                        <td width="33%">
                          <Slotitems data={ship.api_slot} />
                        </td>
                      </tr>
                      <tr key={j * 2 + 1}>
                        <td>{shipType}</td>
                        <td>Next. {ship.api_exp[1]}</td>
                        <td className="material-progress">
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
                        <td style={getCondStyle ship.api_cond}>Cond. {ship.api_cond}</td>
                      </tr>
                    ]
                }
                </tbody>
              </Table>
            </div>
        }
      </div>
