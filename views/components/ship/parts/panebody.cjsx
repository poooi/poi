{relative, join} = require 'path-extra'
{$, $$, _, React, ReactBootstrap, resolveTime, notify} = window
{Table, ProgressBar, OverlayTrigger, Tooltip, Grid, Col, Alert, Row, Overlay} = ReactBootstrap

Slotitems = require './slotitems'
StatusLabel = require './statuslabel'

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
  if window.isDarkTheme
    if cond > 49
      color: '#FFFF00'
    else if cond < 20
      color: '#DD514C'
    else if cond < 30
      color: '#F37B1D'
    else if cond < 40
      color: '#FFC880'
    else
      null
  else
    if cond > 49
      'text-shadow': '0 0 3px #FFFF00'
    else if cond < 20
      'text-shadow': '0 0 3px #DD514C'
    else if cond < 30
      'text-shadow': '0 0 3px #F37B1D'
    else if cond < 40
      'text-shadow': '0 0 3px #FFC880'
    else
      null

getFontStyle = (theme)  ->
  if window.isDarkTheme then color: '#FFF' else color: '#000'

getCondCountdown = (deck) ->
  {$ships, $slotitems, _ships} = window
  countdown = [0, 0, 0, 0, 0, 0]
  cond = [49, 49, 49, 49, 49, 49]
  for shipId, i in deck.api_ship
    if shipId == -1
      countdown[i] = 0
      cond[i] = 49
      continue
    ship = _ships[shipId]
    # if ship.api_cond < 49
    #   cond[i] = Math.min(cond[i], ship.api_cond)
    cond[i] = ship.api_cond
    countdown[i] = Math.max(countdown[i], Math.ceil((49 - cond[i]) / 3) * 180)
  ret =
    countdown: countdown
    cond: cond

getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

getMaterialStyleData = (percent) ->
  if percent <= 20
    color: '#F37B1D'
  else if percent <= 40
    color: '#DD514C'
  else if percent < 100
    color: '#FFFF00'
  else
    null

getStatusStyle = (status) ->
  flag = status.reduce (a, b) -> a or b
  if flag? and flag
    return {opacity: 0.4}
  else
    return {}
    # $("#ShipView #shipInfo").style.opacity = 0.4

getStatusArray = (shipId) ->
  status = []
  # retreat status
  status[0] = false
  # reparing
  status[1] = if shipId in _ndocks then true else false
  # special 1
  status[2] = false
  # special 2
  status[3] = false
  # special 3
  status[4] = false
  return status

getDeckMessage = (deck) ->
  {$ships, $slotitems, _ships} = window
  totalLv = totalShip = totalTyku = totalSaku = shipSaku = itemSaku = teitokuSaku = 0
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    shipInfo = $ships[ship.api_ship_id]
    totalLv += ship.api_lv
    totalShip += 1
    shipPureSaku = ship.api_sakuteki[0]
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
      shipPureSaku -= itemInfo.api_saku
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
    shipSaku += Math.sqrt(shipPureSaku) * 1.69
  teitokuSaku = 0.61 * Math.floor((window._teitokuLv + 4) / 5) * 5
  totalSaku = shipSaku + itemSaku - teitokuSaku
  avgLv = totalLv / totalShip
  [totalLv, parseFloat(avgLv.toFixed(0)), totalTyku, parseFloat(totalSaku.toFixed(0)), parseFloat(shipSaku.toFixed(2)), parseFloat(itemSaku.toFixed(2)), parseFloat(teitokuSaku.toFixed(2))]

TopAlert = React.createClass
  messages: ['没有舰队信息']
  countdown: [0, 0, 0, 0, 0, 0]
  maxCountdown: 0
  missionCountdown: 0
  completeTime: 0
  timeDelta: 0
  cond: [0, 0, 0, 0, 0, 0]
  isMount: false
  inBattle: false
  getInitialState: ->
    inMission: false
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    refreshFlag = false
    switch path
      when '/kcsapi/api_port/port'
        if @props.deckIndex != 0
          deck = body.api_deck_port[@props.deckIndex]
          @missionCountdown = -1
          switch deck.api_mission[0]
            # In port
            when 0
              @missionCountdown = -1
              @completeTime = -1
            # In mission
            when 1
              @completeTime = deck.api_mission[2]
              @missionCountdown = Math.floor((deck.api_mission[2] - new Date()) / 1000)
            # Just come back
            when 2
              @completeTime = 0
              @missionCountdown = 0
        @inBattle = false
        refreshFlag = true
      when '/kcsapi/api_req_mission/start'
        # postBody.api_deck_id is a string starting from 1
        if postBody.api_deck_id == "#{@props.deckIndex + 1}"
          @completeTime = body.api_complatetime
          @missionCountdown = Math.floor((body.api_complatetime - new Date()) / 1000)
          @inBattle = false
          refreshFlag = true
      when '/kcsapi/api_req_mission/return_instruction'
        if postBody.api_deck_id == @props.deckIndex
          @completeTime = body.api_mission[2]
          @missionCountdown = Math.floor((body.api_mission[2] - new Date()) / 1000)
          @inBattle = false
          refreshFlag = true
      when '/kcsapi/api_req_map/start'
        @inBattle = true
      when '/kcsapi/api_get_member/deck', '/kcsapi/api_get_member/ship_deck', '/kcsapi/api_get_member/ship2', '/kcsapi/api_get_member/ship3'
        refreshFlag = true
      when '/kcsapi/api_req_hensei/change', '/kcsapi/api_req_kaisou/powerup', '/kcsapi/api_req_kousyou/destroyship'
        refreshFlag = true
    if refreshFlag
      @setAlert()
  getState: ->
    if @state.inMission
      return '远征'
    else
      return '回复'
  setAlert: ->
    decks = window._decks
    @messages = getDeckMessage decks[@props.deckIndex]
    tmp = getCondCountdown decks[@props.deckIndex]
    @missionCountdown = Math.max(0, Math.floor((@completeTime - new Date()) / 1000))
    {inMission} = @state
    changeFlag = false
    if @missionCountdown > 0
      @maxCountdown = @missionCountdown
      @timeDelta = 0
      if not inMission
        changeFlag = true
      @cond = tmp.cond
    else
      @maxCountdown = tmp.countdown.reduce (a, b) -> Math.max a, b    # new countdown
      @countdown = tmp.countdown
      minCond = tmp.cond.reduce (a, b) -> Math.min a, b               # new cond
      thisMinCond = @cond.reduce (a, b) -> Math.min a, b              # current cond
      if thisMinCond isnt minCond
        @timeDelta = 0
      @cond = tmp.cond
      if inMission
        changeFlag = true
    if changeFlag
      @setState
        inMission: not inMission
    if @maxCountdown > 0
      @interval = setInterval @updateCountdown, 1000 if !@interval?
    else
      if @interval?
        @interval = clearInterval @interval
        @clearCountdown()
  componentWillUpdate: ->
    @setAlert()
  updateCountdown: ->
    flag = true
    if @maxCountdown - @timeDelta > 0
      flag = false
      @timeDelta += 1
      # Use DOM operation instead of React for performance
      if @isMount
        $("#ShipView #deck-condition-countdown-#{@props.deckIndex}-#{@componentId}").innerHTML = resolveTime(@maxCountdown - @timeDelta)
      if @timeDelta % (3 * 60) == 0
        cond = @cond.map (c) => if c < 49 then Math.min(49, c + @timeDelta / 60) else c
        @props.updateCond(cond)
      if @maxCountdown is @timeDelta and not @inBattle and not @state.inMission and window._decks[@props.deckIndex].api_mission[0] <= 0
        notify "#{@props.deckName} 疲劳回复完成",
          type: 'morale'
          icon: join(ROOT, 'assets', 'img', 'operation', 'sortie.png')
    if flag or (@inBattle and not @state.inMission)
      @interval = clearInterval @interval
      @clearCountdown()
  clearCountdown: ->
    if @isMount
      $("#ShipView #deck-condition-countdown-#{@props.deckIndex}-#{@componentId}").innerHTML = resolveTime(0)
  componentWillMount: ->
    @componentId = Math.ceil(Date.now() * Math.random())
    if @props.deckIndex != 0
      deck = window._decks[@props.deckIndex]
      @missionCountdown = -1
      switch deck.api_mission[0]
        # In port
        when 0
          @missionCountdown = -1
          @completeTime = -1
        # In mission
        when 1
          @completeTime = deck.api_mission[2]
          @missionCountdown = Math.floor((deck.api_mission[2] - new Date()) / 1000)
        # Just come back
        when 2
          @completeTime = 0
          @missionCountdown = 0
    @setAlert()
  componentDidMount: ->
    @isMount = true
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
    @interval = clearInterval @interval if @interval?
  render: ->
    <Alert style={getFontStyle window.theme}>
      <div style={display: "flex"}>
        <span style={flex: 1}>总 Lv.{@messages[0]}</span>
        <span style={flex: 1}>均 Lv.{@messages[1]}</span>
        <span style={flex: 1}>制空:&nbsp;{@messages[2]}</span>
        <span style={flex: 1}>
          <OverlayTrigger placement='bottom' overlay={<Tooltip>[艦娘]{@messages[4]} + [装備]{@messages[5]} - [司令部]{@messages[6]}</Tooltip>}>
            <span>索敌:&nbsp;{@messages[3]}</span>
          </OverlayTrigger>
        </span>
        <span style={flex: 1.5}>{@getState()}:&nbsp;<span id={"deck-condition-countdown-#{@props.deckIndex}-#{@componentId}"}>{resolveTime @maxCountdown}</span></span>
      </div>
    </Alert>

PaneBody = React.createClass
  condDynamicUpdateFlag: false
  getInitialState: ->
    cond: [0, 0, 0, 0, 0, 0]
  onCondChange: (cond) ->
    condDynamicUpdateFlag = true
    @setState
      cond: cond
  shouldComponentUpdate: (nextProps, nextState) ->
    nextProps.activeDeck is @props.deckIndex
  componentWillReceiveProps: (nextProps) ->
    if @condDynamicUpdateFlag
      @condDynamicUpdateFlag = not @condDynamicUpdateFlag
    else
      cond = [0, 0, 0, 0, 0, 0]
      for shipId, j in nextProps.deck.api_ship
        if shipId == -1
          cond[j] = 49
          continue
        ship = _ships[shipId]
        cond[j] = ship.api_cond
      @setState
        cond: cond
  componentWillMount: ->
    cond = [0, 0, 0, 0, 0, 0]
    for shipId, j in @props.deck.api_ship
      if shipId == -1
        cond[j] = 49
        continue
      ship = _ships[shipId]
      cond[j] = ship.api_cond
    @setState
      cond: cond
  render: ->
    <div>
      <TopAlert
        updateCond={@onCondChange}
        messages={@props.messages}
        deckIndex={@props.deckIndex}
        deckName={@props.deckName} />
      <Table>
        <tbody>
        {
          {$ships, $shipTypes, _ships} = window
          for shipId, j in @props.deck.api_ship
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
                  <Slotitems data={ship.api_slot} onslot={ship.api_onslot} maxeq={ship.api_maxeq} />
                </td>
              </tr>
              <tr key={j * 2 + 1}>
                <td>{shipType}</td>
                <td>Next. {ship.api_exp[1]}</td>
                <td className="material-progress">
                  <Grid>
                    <Col xs={6} style={paddingRight: 1}>
                      <ProgressBar bsStyle={getMaterialStyle ship.api_fuel / shipInfo.api_fuel_max * 100}
                                     now={ship.api_fuel / shipInfo.api_fuel_max * 100} />
                    </Col>
                    <Col xs={6} style={paddingLeft: 1}>
                      <ProgressBar bsStyle={getMaterialStyle ship.api_bull / shipInfo.api_bull_max * 100}
                                     now={ship.api_bull / shipInfo.api_bull_max * 100} />
                    </Col>
                  </Grid>
                </td>
                <td style={getCondStyle @state.cond[j]}>Cond. {@state.cond[j]}</td>
              </tr>
            ]
        }
        </tbody>
      </Table>
    </div>

module.exports = PaneBody
