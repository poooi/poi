{relative, join} = require 'path-extra'
{_, $, $$, React, ReactBootstrap, ROOT, toggleModal} = window
{$ships, $shipTypes, _ships} = window
{Button, ButtonGroup} = ReactBootstrap

{PaneBody} = require './parts'

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
getMaterialStyle = (percent) ->
  if percent <= 50
    'danger'
  else if percent <= 75
    'warning'
  else if percent < 100
    'info'
  else
    'success'
getFontStyle = (theme)  ->
  if window.theme.indexOf('dark') != -1 or window.theme == 'slate' or window.theme == 'superhero'
    color: '#FFF'
  else
    color: '#000'
getCondStyle = (cond) ->
  if window.theme.indexOf('dark') != -1 or window.theme == 'slate' or window.theme == 'superhero'
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

module.exports =
  name: 'ShipView'
  priority: 0.1
  displayName: '舰队'
  description: '舰队展示页面，展示舰队详情信息'
  reactClass: React.createClass
    getInitialState: ->
      names: ['第1艦隊', '第2艦隊', '第3艦隊', '第4艦隊']
      states: [-1, -1, -1, -1]
      decks: []
      ndocks: []
      activeDeck: 0
      dataVersion: 0
    showDataVersion: 0
    shouldComponentUpdate: (nextProps, nextState)->
      #only when this pane is visibile and its data is changed, this pane update.
      if nextProps.selectedKey[0]?  # if layout is double-tabareas
        if nextProps.selectedKey[0] is @props.index # if ship-pane is visibile
          if nextProps.selectedKey[1] is @props.selectedKey[1] # rule out the condition of switching plugin-tab
            if nextState.dataVersion isnt @showDataVersion # if dataVersion is changed, this pane should update!
              @showDataVersion = nextState.dataVersion
              return true
      else  # layout is single-tabareas
        if nextProps.selectedKey is @props.index # if ship-pane is visibile
          if nextState.dataVersion isnt @showDataVersion # if dataVersion is changed, this pane should update!
            @showDataVersion = nextState.dataVersion
            return true
      false
    handleClick: (idx) ->
      if idx isnt @state.activeDeck
        @setState
          activeDeck: idx
          dataVersion: @state.dataVersion += 1
    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {names, ndocks} = @state
      flag = true
      switch path
        when '/kcsapi/api_port/port'
          names = body.api_deck_port.map (e) ->
            e.api_name
          ndocks = body.api_ndock.map (e) ->
            e.api_ship_id
          inBattle = [false, false, false, false]
        when '/kcsapi/api_req_hensei/change', '/kcsapi/api_req_hokyu/charge', '/kcsapi/api_get_member/deck', '/kcsapi/api_get_member/ship_deck', '/kcsapi/api_get_member/ship3', '/kcsapi/api_req_kousyou/destroyship', '/kcsapi/api_req_kaisou/powerup'
          true
        when '/kcsapi/api_req_map/start'
          deckId = parseInt(postBody.api_deck_id) - 1
          inBattle[deckId] = true
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
        when '/kcsapi/api_get_member/ndock'
          ndocks = body.map (e) -> e.api_ship_id
        when '/kcsapi/api_req_nyukyo/speedchange'
          if body.api_result == 1
            id = ndocks[postBody.api_ndock_id - 1]
            for deck, i in decks
              for shipId in deck.api_ship
                if shipId == id
                  ship = _ships[id]
                  ship.api_nowhp = ship.api_maxhp
        when '/kcsapi/api_req_nyukyo/start'
          if body.api_result == 1 and postBody.api_highspeed == '1'
            id = parseInt(postBody.api_ship_id)
            for deck, i in decks
              for shipId in deck.api_ship
                if shipId == id
                  ship = _ships[id]
                  ship.api_nowhp = ship.api_maxhp
        else
          flag = false
      return unless flag
      decks = window._decks
      states = decks.map (deck) ->
        getDeckState deck, ndocks
      @setState
        names: names
        decks: decks
        ndocks: ndocks
        states: states
        dataVersion: @state.dataVersion += 1
    componentDidMount: ->
      window.addEventListener 'game.response', @handleResponse
    componentWillUnmount: ->
      window.removeEventListener 'game.response', @handleResponse
      @interval = clearInterval @interval if @interval?
    render: ->
      <div>
        <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'ship.css')} />
        <ButtonGroup>
        {
          for i in [0..3]
            <Button key={i} bsSize="small"
                            bsStyle={getStyle @state.states[i]}
                            onClick={@handleClick.bind(this, i)}
                            className={if @state.activeDeck == i then 'active' else ''}>
              {@state.names[i]}
            </Button>
        }
        </ButtonGroup>
        {
          for deck, i in @state.decks
            <div className="ship-deck" className={if @state.activeDeck is i then 'show' else 'hidden'} key={i}>
              <PaneBody 
                key={i}
                deckIndex={i}
                deck={@state.decks[i]}
                activeDeck={@state.activeDeck}
                deckState={@state.states[i]}
                deckName={@state.names[i]}
              />
            </div>
        }
      </div>
