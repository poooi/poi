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

{PaneBodyMini, PaneBody} = require './miniship-parts'

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

module.exports =
  name: 'MiniShip'
  priority: 100000.1
  displayName: <span><FontAwesome key={0} name='bars' /> Mini舰队</span>
  description: '舰队展示页面，展示舰队详情信息'
  reactClass: React.createClass
    getInitialState: ->
      show: false
      names: ["#{__ 'I'}", "#{__ 'II'}", "#{__ 'III'}", "#{__ 'IV'}"]
      fullnames: [__('No.%s fleet', 1), __('No.%s fleet', 2), __('No.%s fleet', 3), __('No.%s fleet', 4)]
      states: [-1, -1, -1, -1]
      decks: []
      activeDeck: 0
      dataVersion: 0
    showDataVersion: 0
    nowTime: 0
    componentWillUpdate: (nextProps, nextState) ->
      @nowTime = (new Date()).getTime()
    componentDidUpdate: (prevProps, prevState) ->
      cur = (new Date()).getTime()
      console.log "the cost of ship-module's render: #{cur-@nowTime}ms" if process.env.DEBUG?
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
    toggle: (e) ->
      event = new CustomEvent 'view.main.visible',
        bubbles: true
        cancelable: false
        detail:
          visible: @state.show
      window.dispatchEvent event
      e.preventDefault()
    handleMiniShipChange: (e) ->
      # dispatch an event about whether the main pane is show or not
      e.preventDefault()
      if e.detail.visible == @state.show
        @setState
          show: !@state.show
          dataVersion: @state.dataVersion + 1
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {fullnames} = @state
      flag = true
      switch path
        when '/kcsapi/api_port/port'
          fullnames = body.api_deck_port.map (e) -> e.api_name
          inBattle = [false, false, false, false]
          goback = {}
          combined = body.api_combined_flag? && body.api_combined_flag > 0
        when '/kcsapi/api_req_hensei/change', '/kcsapi/api_req_hokyu/charge', '/kcsapi/api_get_member/deck', '/kcsapi/api_get_member/ship_deck', '/kcsapi/api_get_member/ship2', '/kcsapi/api_get_member/ship3', '/kcsapi/api_req_kousyou/destroyship', '/kcsapi/api_req_kaisou/powerup', '/kcsapi/api_req_nyukyo/start', '/kcsapi/api_req_nyukyo/speedchange', '/kcsapi/api_req_hensei/preset_select', '/kcsapi/api_req_kaisou/slot_exchange_index'
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
          {decks, states} = @state
          {_ships, _slotitems} = window
          damagedShips = []
          for deckId in [0..3]
            continue unless inBattle[deckId]
            deck = decks[deckId]
            for shipId, idx in deck.api_ship
              continue if shipId == -1 or idx == 0
              ship = _ships[shipId]
              if ship.api_nowhp / ship.api_maxhp < 0.250001 and !goback[shipId]
                # 应急修理要员/女神
                safe = false
                for slotId in ship.api_slot.concat(ship.api_slot_ex || -1)
                  continue if slotId == -1
                  safe = true if _slotitems[slotId].api_type[3] is 14
                if !safe
                  damagedShips.push("Lv. #{ship.api_lv} - #{ship.api_name}")
          if damagedShips.length > 0
            toggleModal __('Attention!'), damagedShips.join(' ') + __('is heavily damaged!')
        else
          flag = false
      return unless flag
      decks = window._decks
      states = decks.map (deck) ->
        getDeckState deck
      @setState
        fullnames: fullnames
        decks: decks
        states: states
        dataVersion: @state.dataVersion + 1
    componentDidMount: ->
      window.addEventListener 'game.response', @handleResponse
      window.addEventListener 'view.main.visible', @handleMiniShipChange
    componentWillUnmount: ->
      window.removeEventListener 'game.response', @handleResponse
      window.removeEventListener 'view.main.visible', @handleMiniShipChange
      @interval = clearInterval @interval if @interval?
    render: ->
      <div style={height: '100%'} onDoubleClick={@toggle}>
        <Panel id="ShipViewMini" bsStyle="default" style={minHeight: 322, height: 'calc(100% - 8px)'}>
          <link rel="stylesheet" href={join(relative(ROOT, __dirname), '..', 'assets', 'miniship.css')} />
          <div className="panel-row">
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
            <Button bsSize="xsmall" onClick={@toggle}>
              <FontAwesome name='external-link' />
            </Button>
          </div>
          {
            for deck, i in @state.decks
              <div className="ship-deck" className={if @state.activeDeck is i then 'show' else 'hidden'} key={i}>
                <PaneBodyMini
                  key={i}
                  show={!@state.show}
                  deckIndex={i}
                  deck={@state.decks[i]}
                  activeDeck={@state.activeDeck}
                  deckName={@state.names[i]}
                />
              </div>
          }
        </Panel>
        <Panel id="ShipView"
               className="#{if window.doubleTabbed then 'ship-panel-half' else 'ship-panel-full'}#{if @state.show then '' else '-hidden'}
                          #{if (!window.doubleTabbed) && (window.layout == 'vertical') then 'toright' else 'toleft'}
                          #{if (window.layout == 'vertical') && (!window.doubleTabbed) then if (!@state.show) then 'top-vertical' else if (!@state.show) then 'top-horizontal'}">
          <link rel="stylesheet" href={join(relative(ROOT, __dirname), '..', 'assets', 'ship.css')} />
          <div className="panel-row">
            <ButtonGroup className="fleet-name-button">
            {
              for i in [0..3]
                <Button key={i} bsSize="small"
                                bsStyle={getStyle @state.states[i]}
                                onClick={@handleClick.bind(this, i)}
                                className={if @state.activeDeck == i then 'active' else ''}>
                  {@state.fullnames[i]}
                </Button>
            }
            </ButtonGroup>
            <ButtonGroup style={width: 50}>
              <Button bsSize="small" onClick={@toggle}>
                <FontAwesome name='external-link-square' rotate=180 />
              </Button>
            </ButtonGroup>
          </div>
          {
            for deck, i in @state.decks
              <div className="ship-deck #{if @state.activeDeck is i then 'show' else 'hidden'}" key={i}>
                <PaneBody
                  key={i}
                  show={@state.show}
                  deckIndex={i}
                  deck={@state.decks[i]}
                  activeDeck={@state.activeDeck}
                  deckName={@state.fullnames[i]}
                />
              </div>
          }
        </Panel>
      </div>
