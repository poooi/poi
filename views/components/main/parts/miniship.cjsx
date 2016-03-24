{relative, join} = require 'path-extra'
path =  require 'path-extra'
{_, $, $$, React, ReactBootstrap, ROOT, FontAwesome, toggleModal} = window
{$ships, $shipTypes, _ships} = window
{Button, ButtonGroup} = ReactBootstrap
{ProgressBar, OverlayTrigger, Tooltip, Alert, Overlay, Label, Panel, Popover} = ReactBootstrap
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)

inBattle = [false, false, false, false]
goback = {}
combined = false
escapeId = -1
towId = -1

{PaneBodyMini} = require '../../ship-parts'

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
      names: ["#{__ 'I'}", "#{__ 'II'}", "#{__ 'III'}", "#{__ 'IV'}"]
      fullnames: [__('No.%s fleet', 1), __('No.%s fleet', 2), __('No.%s fleet', 3), __('No.%s fleet', 4)]
      states: [-1, -1, -1, -1]
      decks: []
      activeDeck: 0
      enableTransition: config.get 'poi.transition.enable', true
    nowTime: 0
    componentWillUpdate: (nextProps, nextState) ->
      @nowTime = (new Date()).getTime()
    componentDidUpdate: (prevProps, prevState) ->
      cur = (new Date()).getTime()
      dbg.extra('moduleRenderCost').log "the cost of ship-module's render: #{cur-@nowTime}ms"
    handleClick: (idx) ->
      if idx isnt @state.activeDeck
        event = new CustomEvent 'ShipView.deckChange',
          bubbles: true
          cancelable: true
          detail:
            idx: idx
        window.dispatchEvent event
        @setState
          activeDeck: idx
    handleClickOnce: (e) ->
      idx = e.detail?.idx
      if idx? && idx isnt @state.activeDeck
        @setState
          activeDeck: idx
    setMiniShipState: (e) ->
      state = e.detail
      @setState state
    changeShipView: ->
      event = new CustomEvent 'tabarea.change',
        bubbles: true
        cancelable: true
        detail:
          tab: 'shipView'
      window.dispatchEvent event
    handleSetTransition: (e) ->
      @setState
        enableTransition: config.get 'poi.transition.enable', true
    componentDidMount: ->
      window.addEventListener 'MiniShip.deckChange', @handleClickOnce
      window.addEventListener 'MiniShip.getResponse', @setMiniShipState
      window.addEventListener 'display.transition.change', @handleSetTransition
      window.setMiniShipState = @setMiniShipState
    componentWillUnmount: ->
      window.removeEventListener 'MiniShip.deckChange', @handleClickOnce
      window.removeEventListener 'MiniShip.getResponse', @setMiniShipState
      window.removeEventListener 'display.transition.change', @handleSetTransition
      @interval = clearInterval @interval if @interval?
    render: ->
      <div style={height: '100%'} onDoubleClick={@changeShipView}>
        <Panel id="ShipViewMini" bsStyle="default" style={minHeight: 322, height: 'calc(100% - 6px)'}>
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
          </div>
          <div className="no-scroll">
            <div className="ship-tab-content #{if @state.enableTransition then 'ship-tab-content-transition'}"
                 style={left: "-#{@state.activeDeck}00%"}>
            {
              for deck, i in @state.decks
                <div className="ship-deck" className="ship-tabpane" key={i}>
                  <PaneBodyMini
                    key={i}
                    deckIndex={i}
                    deck={@state.decks[i]}
                    activeDeck={@state.activeDeck}
                    deckName={@state.names[i]}
                  />
                </div>
            }
            </div>
          </div>
        </Panel>
      </div>
