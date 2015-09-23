{$, $$, _, React, ReactBootstrap, resolveTime, notify} = window
{OverlayTrigger, Tooltip,  Alert} = ReactBootstrap
{__, __n} = require 'i18n'
{join} = require 'path-extra'

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

# Tyku
# 制空値 = [(艦載機の対空値) × √(搭載数)] の総計 + 熟練補正
getTyku = (deck) ->
  {$ships, $slotitems, _ships, _slotitems} = window
  basicTyku = alvTyku = totalTyku = 0
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    for itemId, slotId in ship.api_slot
      continue unless itemId != -1 && _slotitems[itemId]?
      item = _slotitems[itemId]
      # Basic tyku
      if item.api_type[3] in [6, 7, 8]
        basicTyku += Math.floor(Math.sqrt(ship.api_onslot[slotId]) * item.api_tyku)
      else if item.api_type[3] == 10 && item.api_type[2] == 11
        basicTyku += Math.floor(Math.sqrt(ship.api_onslot[slotId]) * item.api_tyku)
      # Alv
      if item.api_type[3] == 6 && item.api_alv > 0 && item.api_alv <= 7
        alvTyku += [0, 1, 4, 6, 11, 16, 17, 25][item.api_alv]
      else if item.api_type[3] in [7, 8] && item.api_alv == 7
        alvTyku += 3
      else if item.api_type[3] == 10 && item.api_type[2] == 11 && item.api_alv == 7
        alvTyku += 9
  totalTyku = basicTyku + alvTyku

  basic: basicTyku
  alv: alvTyku
  total: totalTyku

# Saku (2-5 旧式)
# 偵察機索敵値×2 ＋ 電探索敵値 ＋ √(艦隊の装備込み索敵値合計 - 偵察機索敵値 - 電探索敵値)
getSaku25 = (deck) ->
  {$ships, $slotitems, _ships, _slotitems} = window
  reconSaku = shipSaku = radarSaku = 0
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    shipSaku += ship.api_sakuteki[0]
    for itemId, slotId in ship.api_slot
      continue unless itemId != -1 && _slotitems[itemId]?
      item = _slotitems[itemId]
      switch item.api_type[3]
        when 9
          reconSaku += item.api_saku
          shipSaku -= item.api_saku
        when 10
          if item.api_type[2] == 10
            reconSaku += item.api_saku
            shipSaku -= item.api_saku
        when 11
          radarSaku += item.api_saku
          shipSaku -= item.api_saku
  reconSaku = reconSaku * 2.00
  shipSaku = Math.sqrt(shipSaku)
  totalSaku = reconSaku + radarSaku + shipSaku

  recon: parseFloat(reconSaku.toFixed(2))
  radar: parseFloat(radarSaku.toFixed(2))
  ship: parseFloat(shipSaku.toFixed(2))
  total: parseFloat(totalSaku.toFixed(2))

# Saku (2-5 秋式)
# 索敵スコア = 艦上爆撃機 × (1.04) + 艦上攻撃機 × (1.37) + 艦上偵察機 × (1.66) + 水上偵察機 × (2.00)
#            + 水上爆撃機 × (1.78) + 小型電探 × (1.00) + 大型電探 × (0.99) + 探照灯 × (0.91)
#            + √(各艦毎の素索敵) × (1.69) + (司令部レベルを5の倍数に切り上げ) × (-0.61)
getSaku25a = (deck) ->
  {$ships, $slotitems, _ships, _slotitems} = window
  totalSaku = shipSaku = itemSaku = teitokuSaku = 0
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    shipPureSaku = ship.api_sakuteki[0]
    for itemId, slotId in ship.api_slot
      continue unless itemId != -1 && _slotitems[itemId]?
      item = _slotitems[itemId]
      shipPureSaku -= item.api_saku
      switch item.api_type[3]
        when 7
          itemSaku += item.api_saku * 1.04
        when 8
          itemSaku += item.api_saku * 1.37
        when 9
          itemSaku += item.api_saku * 1.66
        when 10
          if item.api_type[2] == 10
            itemSaku += item.api_saku * 2.00
          else if item.api_type[2] == 11
            itemSaku += item.api_saku * 1.78
        when 11
          if item.api_type[2] == 12
            itemSaku += item.api_saku * 1.00
          else if item.api_type[2] == 13
            itemSaku += item.api_saku * 0.99
        when 24
          itemSaku += item.api_saku * 0.91
    shipSaku += Math.sqrt(shipPureSaku) * 1.69
  teitokuSaku = 0.61 * Math.floor((window._teitokuLv + 4) / 5) * 5
  totalSaku = shipSaku + itemSaku - teitokuSaku

  ship: parseFloat(shipSaku.toFixed(2))
  item: parseFloat(itemSaku.toFixed(2))
  teitoku: parseFloat(teitokuSaku.toFixed(2))
  total: parseFloat(totalSaku.toFixed(2))

getDeckMessage = (deck) ->
  {$ships, $slotitems, _ships} = window
  totalLv = totalShip = 0
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    totalLv += ship.api_lv
    totalShip += 1

  totalLv: totalLv
  tyku: getTyku(deck)
  saku25: getSaku25(deck)
  saku25a: getSaku25a(deck)


TopAlert = React.createClass
  messages: [__ 'No data']
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
      return __ 'Expedition'
    else
      return __ 'Resting'
  setAlert: ->
    decks = window._decks
    @messages = getDeckMessage decks[@props.deckIndex]
    if !@props.mini
      tmp = getCondCountdown decks[@props.deckIndex]
      {inMission} = @state
      @missionCountdown = Math.max(0, Math.floor((@completeTime - new Date()) / 1000))
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
    if !@props.mini
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
          notify "#{@props.deckName} #{__ 'have recovered from fatigue'}",
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
    <div>
    {
      if @props.mini
        <div style={display: "flex", justifyContent: "space-around"}>
          <span style={flex: "none"}>{__ 'Total Lv'}{@messages.totalLv} </span>
          <span style={flex: "none", marginLeft: 5}>{__ 'Fighter Power'}: {@messages.tyku.total}</span>
          <span style={flex: "none", marginLeft: 5}>{__ 'LOS'}: {@messages.saku25a.total}</span>
        </div>
      else
        <Alert style={getFontStyle window.theme}>
          <div style={display: "flex"}>
            <span style={flex: 1}>{__ 'Total Lv'}. {@messages.totalLv}</span>
            <span style={flex: 1}>
              <OverlayTrigger placement='bottom' overlay={
                <Tooltip>
                  <span>{__ 'Basic FP'}: {@messages.tyku.basic} {__ 'Rank bonuses'}: {@messages.tyku.alv}</span>
                </Tooltip>
              }>
                <span>{__ 'Fighter Power'}: {@messages.tyku.total}</span>
              </OverlayTrigger>
            </span>
            <span style={flex: 1}>
              <OverlayTrigger placement='bottom' overlay={
                <Tooltip>
                  <div>2-5 {__ 'Autumn'}: {@messages.saku25a.ship} + {@messages.saku25a.item} - {@messages.saku25a.teitoku} = {@messages.saku25a.total}</div>
                  <div>2-5 {__ 'Old'}: {@messages.saku25.ship} + {@messages.saku25.recon} + {@messages.saku25.radar} = {@messages.saku25.total}</div>
                </Tooltip>
              }>
                <span>{__ 'LOS'}: {@messages.saku25a.total}</span>
              </OverlayTrigger>
            </span>
            <span style={flex: 1.5}>{@getState()}: <span id={"deck-condition-countdown-#{@props.deckIndex}-#{@componentId}"}>{resolveTime @maxCountdown}</span></span>
          </div>
        </Alert>
    }
    </div>
module.exports = TopAlert
