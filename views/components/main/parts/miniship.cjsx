{relative, join} = require 'path-extra'
path =  require 'path-extra'
{_, $, $$, React, ReactBootstrap, ROOT, FontAwesome, toggleModal} = window
{$ships, $shipTypes, _ships} = window
{Button, ButtonGroup} = ReactBootstrap
{ProgressBar, OverlayTrigger, Tooltip, Alert, Overlay, Label, Panel, Popover} = ReactBootstrap
{__, __n} = require 'i18n'

inBattle = [false, false, false, false]
goback = {}
combined = false
escapeId = -1
towId = -1

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

getDeckState = (deck) ->
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
    if shipId in window._ndocks
      state = Math.max(state, 3)
  state

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
    'info'
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
      textShadow: '0 0 3px #FFFF00'
    else if cond < 20
      textShadow: '0 0 3px #DD514C'
    else if cond < 30
      textShadow: '0 0 3px #F37B1D'
    else if cond < 40
      textShadow: '0 0 3px #FFC880'
    else
      null

getStatusStyle = (status) ->
  if status?
    flag = status == 0 or status == 1 # retreat or repairing
    if flag? and flag
      return {opacity: 0.4}
  else
    return {}

getShipStatus = (shipId) ->
  status = -1
  # retreat status
  if shipId == escapeId || shipId == towId
    return status = 0
  # reparing
  if shipId in _ndocks
    return status = 1
  # supply
  else if (Math.min _ships[shipId].api_fuel / _ships[shipId].api_fuel_max * 100, _ships[shipId].api_bull / _ships[shipId].api_bull_max * 100) < 100
    return status = 6
  # special 1 locked phase 1
  else if _ships[shipId].api_sally_area == 1
    return status = 2
  # special 2 locked phase 2
  else if _ships[shipId].api_sally_area == 2
    return status = 3
  # special 3 locked phase 3
  else if  _ships[shipId].api_sally_area == 3
    return status = 4
  # special 3 locked phase 3
  else if _ships[shipId].api_sally_area == 4
    return status = 5
  return status

###
# usage:
# get a ship's all status using props, sorted by status priority
# status array: [retreat, repairing, special1, special2, special3]
# value: boolean

      <Label bsStyle="info"><FontAwesome key={0} name='asterisk' /></Label>
    else if @props.status[3]? and @props.status[3]
      <Label bsStyle="primary"><FontAwesome key={0} name='heart' /></Label>
    else if @props.status[4]? and @props.status[4]
      <Label bsStyle="success"><FontAwesome key={0} name='leaf' /></Label>
    else if @props.status[4]? and @props.status[4]
      <Label bsStyle="warning"><FontAwesome key={0} name='rub' /></Label>

###
StatusLabelMini = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    not (_.isEqual(nextProps.label, @props.label) and _.isEqual(nextProps.supply, @props.supply))
  render: ->
    if @props.label? and @props.label == 0
      <Label bsStyle="danger"><FontAwesome key={0} name='exclamation-circle' /></Label>
    else if @props.label? and @props.label == 1
      <Label bsStyle="info"><FontAwesome key={0} name='wrench' /></Label>
    else if @props.label? and @props.label == 2
      <Label bsStyle="info"><FontAwesome key={0} name='lock' /></Label>
    else if @props.label? and @props.label == 3
      <Label bsStyle="primary"><FontAwesome key={0} name='lock' /></Label>
    else if @props.label? and @props.label == 4
      <Label bsStyle="success"><FontAwesome key={0} name='lock' /></Label>
    else if @props.label? and @props.label == 5
      <Label bsStyle="warning"><FontAwesome key={0} name='lock' /></Label>
    else if @props.label? and @props.label == 6
      <Label bsStyle={getMaterialStyle @props.supply}>{Math.round @props.supply}</Label>
    else
      <Label bsStyle="default" style={opacity: 0}></Label>

getFontStyle = (theme)  ->
  if window.isDarkTheme then color: '#FFF' else color: '#000'

getTyku = (deck) ->
  {$ships, $slotitems, _ships, _slotitems} = window
  basicTyku = alvTyku = totalTyku = 0
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    for itemId, slotId in ship.api_slot
      continue if itemId == -1
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


getDeckMessage = (deck) ->
  {$ships, $slotitems, _ships} = window
  totalLv = totalShip = 0
  for shipId in deck.api_ship
    continue if shipId == -1
    ship = _ships[shipId]
    totalLv += ship.api_lv
    totalShip += 1
  avgLv = totalLv / totalShip
  totalLv: totalLv
  avgLv: parseFloat(avgLv.toFixed(0))
  tyku: getTyku(deck)

Slotitems = React.createClass
  render: ->
    <div className="slotitems" style={display:"flex", flexFlow:"column"}>
    {
      {$slotitems, _slotitems} = window
      for itemId, i in @props.data
        continue if itemId == -1
        item = _slotitems[itemId]
        <div key={i} className="slotitem-container">
          <img key={itemId} src={join('assets', 'img', 'slotitem', "#{item.api_type[3] + 100}.png")}} />
          <span className="slotitem-name">
            {item.api_name}
              {if item.api_level > 0 then <strong style={color: '#45A9A5'}>★+{item.api_level}</strong> else ''}
              &nbsp;&nbsp;{
                if item.api_alv? and item.api_alv >=1 and item.api_alv <= 3
                  for j in [1..item.api_alv]
                    <strong key={j} style={color: '#3EAEFF'}>|</strong>
                else if item.api_alv? and item.api_alv >= 4 and item.api_alv <= 6
                  for j in [1..item.api_alv - 3]
                    <strong key={j} style={color: '#F9C62F'}>\</strong>
                else if item.api_alv? and item.api_alv >= 7 and item.api_alv <= 9
                  <strong key={j} style={color: '#F9C62F'}> <FontAwesome key={0} name='angle-double-right'/> </strong>
                else if item.api_alv? and item.api_alv >= 9
                  <strong key={j} style={color: '#F94D2F'}>★</strong>
                else ''
              }
          </span>
          <Label className="slotitem-onslot
                          #{if (item.api_type[3] >= 6 && item.api_type[3] <= 10) || (item.api_type[3] >= 21 && item.api_type[3] <= 22) || item.api_type[3] == 33 then 'show' else 'hide'}"
                          bsStyle="#{if @props.onslot[i] < @props.maxeq[i] then 'warning' else 'default'}">
            {@props.onslot[i]}
          </Label>
        </div>
    }
    </div>

TopAlert = React.createClass
  messages: [__ 'No data']
  cond: [0, 0, 0, 0, 0, 0]
  isMount: false
  inBattle: false
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    refreshFlag = false
    switch path
      when '/kcsapi/api_port/port'
        if @props.deckIndex != 0
          deck = body.api_deck_port[@props.deckIndex]
        @inBattle = false
        refreshFlag = true
      when '/kcsapi/api_req_mission/start'
        # postBody.api_deck_id is a string starting from 1
        if postBody.api_deck_id == "#{@props.deckIndex + 1}"
          @inBattle = false
          refreshFlag = true
      when '/kcsapi/api_req_mission/return_instruction'
        if postBody.api_deck_id == @props.deckIndex
          @inBattle = false
          refreshFlag = true
      when '/kcsapi/api_req_map/start'
        @inBattle = true
      when '/kcsapi/api_get_member/deck', '/kcsapi/api_get_member/ship_deck', '/kcsapi/api_get_member/ship2', '/kcsapi/api_get_member/ship3'
        refreshFlag = true
      when '/kcsapi/api_req_hensei/change', '/kcsapi/api_req_kaisou/powerup', '/kcsapi/api_req_kousyou/destroyship', '/kcsapi/api_req_nyukyo/start'
        refreshFlag = true
    if refreshFlag
      @setAlert()
  setAlert: ->
    decks = window._decks
    @messages = getDeckMessage decks[@props.deckIndex]
  componentWillUpdate: ->
    @setAlert()
  componentWillMount: ->
    @componentId = Math.ceil(Date.now() * Math.random())
    @setAlert()
  componentDidMount: ->
    @isMount = true
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  render: ->
    <div style={display: "flex", justifyContent: "space-around"}>
      <span style={flex: "none"}>{__ 'Total Lv'}{@messages.totalLv} </span>
      <span style={flex: "none", marginLeft: 5}>{__ 'Avg. Lv'}{@messages.avgLv} </span>
      <span style={flex: "none", marginLeft: 5}>{__ 'Fighter Power'}: {@messages.tyku.total}</span>
    </div>

PaneBodyMini = React.createClass
  condDynamicUpdateFlag: false
  getInitialState: ->
    cond: [0, 0, 0, 0, 0, 0]
    label: [-1, -1, -1, -1, -1, -1]
  updateLabels: ->
    # refresh label
    {label} = @state
    for shipId, j in @props.deck.api_ship
      continue if shipId == -1
      ship = _ships[shipId]
      status = getShipStatus shipId
      label[j] = status
    label
  onCondChange: (cond) ->
    condDynamicUpdateFlag = true
    @setState
      cond: cond
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {label} = @state
    updateflag = false
    switch path
      when '/kcsapi/api_port/port'
        updateflag = true
        label = @updateLabels()
      when '/kcsapi/api_req_hensei/change'
        updateflag = true
        label = @updateLabels()
      when '/kcsapi/api_req_hokyu/charge'
        updateflag = true
        label = @updateLabels()
      when '/kcsapi/api_req_map/next'
        updateflag = true
        label = @updateLabels()
      when '/kcsapi/api_req_nyukyo/start'
        shipId = parseInt postBody.api_ship_id
        if shipId in @props.deck.api_ship
          i = @props.deck.api_ship.indexOf shipId
          # status = getShipStatus shipId
          label[i] = 1
          updateflag = true
    if updateflag
      @setState
        label: label
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
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    label = @updateLabels()
    @setState
      label: label
  render: ->
    <div>
      <div className="fleet-name">
        <OverlayTrigger placement="top" overlay={
          <Popover>
            <div>
              <TopAlert
                updateCond={@onCondChange}
                messages={@props.messages}
                deckIndex={@props.deckIndex}
                deckName={@props.deckName}
              />
            </div>
          </Popover>
          }>
          <span style={margin: 'auto'}>{@props.deck.api_name}</span>
        </OverlayTrigger>
      </div>
      <div className="ship-details">
      {
        {$ships, $shipTypes, _ships} = window
        for shipId, j in @props.deck.api_ship
          continue if shipId == -1
          ship = _ships[shipId]
          shipInfo = $ships[ship.api_ship_id]
          shipType = $shipTypes[shipInfo.api_stype].api_name
          <div key={j} className="ship-tile">
            <OverlayTrigger placement="top" overlay={
              <Popover className="ship-pop">
                <div className="item-name">
                  <Slotitems data={ship.api_slot.concat(ship.api_slot_ex || -1)} onslot={ship.api_onslot} maxeq={ship.api_maxeq} />
                </div>
              </Popover>
            }>
              <div className="ship-item">
                <OverlayTrigger placement='left' overlay={
                  <Tooltip>
                    Next. {ship.api_exp[1]}
                  </Tooltip>
                }>
                  <div className="ship-info">
                    <span className="ship-name" style={getStatusStyle @state.label[j]}>
                      {shipInfo.api_name}
                    </span>
                    <span className="ship-lv-text top-space" style={getStatusStyle @state.label[j]}>
                      Lv. {ship.api_lv}
                    </span>
                  </div>
                </OverlayTrigger>
                <div className="ship-stat">
                  <div className="div-row">
                    <span className="ship-hp" style={getStatusStyle @state.label[j]}>
                      {ship.api_nowhp} / {ship.api_maxhp}
                    </span>
                    <div className="status-label">
                      <StatusLabelMini label={@state.label[j]} supply={Math.min ship.api_fuel / shipInfo.api_fuel_max * 100, ship.api_bull / shipInfo.api_bull_max * 100} />
                    </div>
                    <div style={getStatusStyle @state.label[j]}>
                      <span className="ship-cond" style={getCondStyle ship.api_cond}>
                        ★{ship.api_cond}
                      </span>
                    </div>
                  </div>
                  <span className="hp-progress top-space" style={getStatusStyle @state.label[j]}>
                    <ProgressBar bsStyle={getHpStyle ship.api_nowhp / ship.api_maxhp * 100} now={ship.api_nowhp / ship.api_maxhp * 100} />
                  </span>
                </div>
              </div>
            </OverlayTrigger>
          </div>
      }
      </div>
    </div>

module.exports =
  name: 'MiniShip'
  priority: 100000.1
  displayName: <span><FontAwesome key={0} name='bars' /> Mini舰队</span>
  description: '舰队展示页面，展示舰队详情信息'
  reactClass: React.createClass
    getInitialState: ->
      names: ["#{__ 'I'}", "#{__ 'II'}", "#{__ 'III'}", "#{__ 'IV'}"]
      states: [-1, -1, -1, -1]
      decks: []
      activeDeck: 0
      dataVersion: 0
    showDataVersion: 0
    shouldComponentUpdate: (nextProps, nextState) ->
      # if ship-pane is visibile and dataVersion is changed, this pane should update!
      if nextProps.selectedKey is @props.index and nextState.dataVersion isnt @showDataVersion
        @showDataVersion = nextState.dataVersion
        return true
      if @state.decks.length is 0 and nextState.decks.length isnt 0
        return true
      false
    handleClick: (idx) ->
      if idx isnt @state.activeDeck
        @setState
          activeDeck: idx
          dataVersion: @state.dataVersion + 1
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {names} = @state
      flag = true
      switch path
        when '/kcsapi/api_port/port'
          # names = body.api_deck_port.map (e) -> e.api_name
          inBattle = [false, false, false, false]
          goback = {}
          combined = body.api_combined_flag? && body.api_combined_flag > 0
        when '/kcsapi/api_req_hensei/change', '/kcsapi/api_req_hokyu/charge', '/kcsapi/api_get_member/deck', '/kcsapi/api_get_member/ship_deck', '/kcsapi/api_get_member/ship2', '/kcsapi/api_get_member/ship3', '/kcsapi/api_req_kousyou/destroyship', '/kcsapi/api_req_kaisou/powerup', '/kcsapi/api_req_nyukyo/start', '/kcsapi/api_req_nyukyo/speedchange'
          true
        when '/kcsapi/api_req_sortie/battleresult', '/kcsapi/api_req_combined_battle/battleresult'
          {decks} = @state
          if body.api_escape_flag? && body.api_escape_flag > 0
            escapeIdx = body.api_escape.api_escape_idx[0] - 1
            towIdx = body.api_escape.api_tow_idx[0] - 1
            escapeId = decks[escapeIdx // 6].api_ship[escapeIdx % 6]
            towId = decks[towIdx // 6].api_ship[towIdx % 6]
        when '/kcsapi/api_req_combined_battle/goback_port'
          {decks} = @state
          {_ships} = window
          if escapeId != -1 && towId != -1
            # console.log "退避：#{_ships[escapeId].api_name} 护卫：#{_ships[towId].api_name}"
            goback[escapeId] = goback[towId] = true
        when '/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next'
          if path == '/kcsapi/api_req_map/start'
            if combined && parseInt(postBody.api_deck_id) == 1
              deckId = 0
              inBattle[0] = inBattle[1] = true
            else
              deckId = parseInt(postBody.api_deck_id) - 1
              inBattle[deckId] = true
          escapeId = towId = -1
        else
          flag = false
      return unless flag
      decks = window._decks
      states = decks.map (deck) ->
        getDeckState deck
      @setState
        names: names
        decks: decks
        states: states
        dataVersion: @state.dataVersion + 1
    componentDidMount: ->
      window.addEventListener 'game.response', @handleResponse
    componentWillUnmount: ->
      window.removeEventListener 'game.response', @handleResponse
      @interval = clearInterval @interval if @interval?
    render: ->
      <Panel bsStyle="default" style={minHeight: 320}>
        <link rel="stylesheet" href={join(relative(ROOT, __dirname),'..', 'assets', 'miniship.css')} />
        <ButtonGroup bsSize="xsmall">
        {
          for i in [0..3]
            <Button key={i} bsStyle={getStyle @state.states[i]}
                            onClick={@handleClick.bind(this, i)}
                            className={if @state.activeDeck == i then 'active' else ''}>
              {@state.names[i]}
            </Button>
        }
        </ButtonGroup>
        {
          for deck, i in @state.decks
            <div className="ship-deck" className={if @state.activeDeck is i then 'show' else 'hidden'} key={i}>
              <PaneBodyMini
                key={i}
                deckIndex={i}
                deck={@state.decks[i]}
                activeDeck={@state.activeDeck}
                deckName={@state.names[i]}
              />
            </div>
        }
      </Panel>
