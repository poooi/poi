window._portStorageUpdated = true
envKeyList = ['_teitokuLv', '_nickName', '_nickNameId', '_teitokuExp', '_teitokuId', '_slotitems', '_ships', '_decks', '_ndocks']

handleProxyGameOnRequest = (method, path, body) ->
  # Parse the json object
  try
    body = JSON.parse body
    event = new CustomEvent 'game.request',
      bubbles: true
      cancelable: true
      detail:
        method: method
        path: path
        body: body
    window.dispatchEvent event
  catch e
    console.log e

start2Version = 0
initStart2Value = ->
  if localStorage.start2Version?
    start2Version = parseInt localStorage.start2Version
    # We need a hack to deal with Infinity for historical reasons.
    if start2Version > 0xFFFFFFFF
      start2Version = 0
      localStorage.start2Version = 0
  if localStorage.start2Body?
    body = JSON.parse localStorage.start2Body
    window.$ships = []
    $ships[ship.api_id] = ship for ship in body.api_mst_ship
    window.$shipTypes = []
    $shipTypes[stype.api_id] = stype for stype in body.api_mst_stype
    window.$slotitems = []
    $slotitems[slotitem.api_id] = slotitem for slotitem in body.api_mst_slotitem
    window.$slotitemTypes = []
    $slotitemTypes[slotitemtype.api_id] = slotitemtype for slotitemtype in body.api_mst_slotitem_equiptype
    window.$mapareas = []
    $mapareas[maparea.api_id] = maparea for maparea in body.api_mst_maparea
    window.$maps = []
    $maps[map.api_id] = map for map in body.api_mst_mapinfo
    window.$missions = []
    $missions[mission.api_id] = mission for mission in body.api_mst_mission
    window.$useitems = []
    $useitems[useitem.api_id] = useitem for useitem in body.api_mst_useitem
  for key in envKeyList
    if localStorage[key]? then window[key] = JSON.parse localStorage[key]
initStart2Value()

responses = []
locked = false
resolveResponses = ->
  extendShip = (ship) ->
    _.extend _.clone(window.$ships[ship.api_ship_id]), ship
  extendSlotitem = (item) ->
    _.extend _.clone(window.$slotitems[item.api_slotitem_id]), item
  locked = true
  while responses.length > 0
    [method, path, body, postBody] = responses.shift()
    try
      # Delete api_token
      delete postBody.api_token if postBody?.api_token?
      # Fix api
      body.api_level = parseInt body.api_level if body?.api_level?
      body.api_member_lv = parseInt body.api_member_lv if body?.api_member_lv?
      switch path
        # Game datas prefixed by $
        when '/kcsapi/api_start2'
          start2Version += 1
          window.$ships = []
          $ships[ship.api_id] = ship for ship in body.api_mst_ship
          window.$shipTypes = []
          $shipTypes[stype.api_id] = stype for stype in body.api_mst_stype
          window.$slotitems = []
          $slotitems[slotitem.api_id] = slotitem for slotitem in body.api_mst_slotitem
          window.$slotitemTypes = []
          $slotitemTypes[slotitemtype.api_id] = slotitemtype for slotitemtype in body.api_mst_slotitem_equiptype
          window.$mapareas = []
          $mapareas[maparea.api_id] = maparea for maparea in body.api_mst_maparea
          window.$maps = []
          $maps[map.api_id] = map for map in body.api_mst_mapinfo
          window.$missions = []
          $missions[mission.api_id] = mission for mission in body.api_mst_mission
          window.$useitems = []
          $useitems[useitem.api_id] = useitem for useitem in body.api_mst_useitem
          # updating start2Body while avoiding body from being updated by multi-plugins
          if not localStorage.start2Version? or start2Version > localStorage.start2Version
            localStorage.start2Version = start2Version % 0xFFFFFFFF
            localStorage.start2Body = JSON.stringify body
          window.dispatchEvent new Event 'initialize.complete'
        # User datas prefixed by _
        when '/kcsapi/api_get_member/basic'
          window._teitokuLv = body.api_level
          window._nickName = body.api_nickname
          window._nickNameId = body.api_nickname_id
          window._teitokuExp = body.api_experience
          window._teitokuId = body.api_member_id
        when '/kcsapi/api_get_member/deck'
          window._decks[deck.api_id - 1] = deck for deck in body
        when '/kcsapi/api_get_member/mapinfo'
          window._eventMapRanks = {}
          for map in body
            if map.api_eventmap?.api_selected_rank?
              window._eventMapRanks[map.api_id] = map.api_eventmap.api_selected_rank
        when '/kcsapi/api_get_member/ndock'
          window._ndocks = body.map (e) -> e.api_ship_id
        when '/kcsapi/api_get_member/ship_deck'
          window._decks[deck.api_id - 1] = deck for deck in body.api_deck_data
          for ship in body.api_ship_data
            _ships[ship.api_id] = extendShip ship
        when '/kcsapi/api_get_member/ship2'
          for ship in body
            _ships[ship.api_id] = extendShip ship
        when '/kcsapi/api_get_member/ship3'
          window._decks[deck.api_id - 1] = deck for deck in body.api_deck_data
          for ship in body.api_ship_data
            _ships[ship.api_id] = extendShip ship
        when '/kcsapi/api_get_member/slot_item'
          window._slotitems = {}
          _slotitems[item.api_id] = extendSlotitem item for item in body
        when '/kcsapi/api_port/port'
          window._ships = {}
          _ships[ship.api_id] = extendShip ship for ship in body.api_ship
          window._decks = body.api_deck_port
          window._ndocks = body.api_ndock.map (e) -> e.api_ship_id
          window._teitokuLv = body.api_basic.api_level
          window._portStorageUpdated = false
        when '/kcsapi/api_req_hensei/change'
          decks = window._decks
          deckId = parseInt(postBody.api_id) - 1
          idx = parseInt(postBody.api_ship_idx)
          curId = decks[deckId].api_ship[idx]
          shipId = parseInt(postBody.api_ship_id)
          # Remove all
          if idx == -1
            decks[deckId].api_ship[i] = -1 for i in [1..5]
          # Empty -> One
          else if curId == -1
            [x, y] = [-1, -1]
            for deck, i in decks
              for ship, j in deck.api_ship
                if ship == shipId
                  [x, y] = [i, j]
                  break
            decks[deckId].api_ship[idx] = shipId
            # Empty to ship in deck
            if x != -1 && y != -1
              if y <= 4
                for i in [y..4]
                  decks[x].api_ship[i] = decks[x].api_ship[i + 1]
              decks[x].api_ship[5] = -1
          # One -> Empty
          else if shipId == -1
            if idx <= 4
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
        when '/kcsapi/api_req_hensei/lock'
          _ships[parseInt(postBody.api_ship_id)].api_locked = body.api_locked
        when '/kcsapi/api_req_hensei/preset_select'
          decks = window._decks
          deckId = parseInt(postBody.api_deck_id) - 1
          decks[deckId] = body
        when '/kcsapi/api_req_hokyu/charge'
          for ship in body.api_ship
            _ships[ship.api_id] = _.extend _ships[ship.api_id], ship
        when '/kcsapi/api_req_kaisou/powerup'
          for shipId in postBody.api_id_items.split(',')
            idx = parseInt(shipId)
            for itemId in _ships[idx].api_slot
              continue if itemId == -1
              delete _slotitems[itemId]
            delete _ships[idx]
          _ships[body.api_ship.api_id] = extendShip body.api_ship
          window._decks = body.api_deck
        when '/kcsapi/api_req_kaisou/slotset'
          _ships[parseInt(postBody.api_id)].api_slot[parseInt(postBody.api_slot_idx)] = parseInt(postBody.api_item_id)
        when '/kcsapi/api_req_kaisou/slot_exchange_index'
          _ships[parseInt(postBody.api_id)].api_slot = body.api_slot
        when '/kcsapi/api_req_kaisou/lock'
          _slotitems[parseInt(postBody.api_slotitem_id)].api_locked = body.api_locked
        when '/kcsapi/api_req_kousyou/createitem'
          _slotitems[body.api_slot_item.api_id] = extendSlotitem body.api_slot_item if body.api_create_flag == 1
        when '/kcsapi/api_req_kousyou/destroyitem2'
          for itemId in postBody.api_slotitem_ids.split(',')
            delete _slotitems[parseInt(itemId)]
        when '/kcsapi/api_req_kousyou/destroyship'
          decks = window._decks
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
          for itemId in _ships[removeId].api_slot
            continue if itemId == -1
            delete _slotitems[itemId]
          delete _ships[removeId]
        when '/kcsapi/api_req_kousyou/getship'
          _ships[body.api_ship.api_id] = extendShip body.api_ship
          if body.api_slotitem?
            _slotitems[item.api_id] = extendSlotitem item for item in body.api_slotitem
        when '/kcsapi/api_req_kousyou/remodel_slot'
          if body.api_use_slot_id?
            for itemId in body.api_use_slot_id
              delete _slotitems[itemId]
          if body.api_remodel_flag == 1 and body.api_after_slot?
            afterSlot = body.api_after_slot
            itemId = afterSlot.api_id
            _slotitems[itemId] = extendSlotitem afterSlot
        when '/kcsapi/api_req_map/select_eventmap_rank'
          window._eventMapRanks["#{postBody.api_maparea_id}#{postBody.api_map_no}"] = postBody.api_rank
        when '/kcsapi/api_req_mission/result'
          window._teitokuLv = body.api_member_lv
        when '/kcsapi/api_req_nyukyo/speedchange'
          shipId = _ndocks[postBody.api_ndock_id - 1]
          _ships[shipId].api_nowhp = _ships[shipId].api_maxhp
          _ships[shipId].api_cond = Math.max(40, _ships[shipId].api_cond)
          _ndocks[postBody.api_ndock_id - 1] = 0
        when '/kcsapi/api_req_nyukyo/start'
          if postBody.api_highspeed == '1'
            shipId = parseInt postBody.api_ship_id
            _ships[shipId].api_nowhp = _ships[shipId].api_maxhp
            _ships[shipId].api_cond = Math.max(40, _ships[shipId].api_cond)
        when '/kcsapi/api_req_practice/battle_result'
          window._teitokuExp = body.api_experience
          window._teitokuLv = body.api_member_lv
        when '/kcsapi/api_req_sortie/battleresult'
          window._teitokuExp = body.api_experience
          window._teitokuLv = body.api_member_lv
      event = new CustomEvent 'game.response',
        bubbles: true
        cancelable: true
        detail:
          method: method
          path: path
          body: body
          postBody: postBody
      window.dispatchEvent event
    catch err
      console.error err
  locked = false

handleProxyGameOnResponse = (method, path, body, postBody) ->
  # Parse the json object
  try
    responses.push [method, path, JSON.parse(body), JSON.parse(postBody)]
    resolveResponses() if !locked
  catch e
    console.log e

handleProxyGameStart = ->
  window.dispatchEvent new Event 'game.start'

handleProxyGamePayitem = ->
  window.dispatchEvent new Event 'game.payitem'

handleProxyNetworkErrorRetry = (counter) ->
  event = new CustomEvent 'network.error.retry',
    bubbles: true
    cancelable: true
    detail:
      counter: counter
  window.dispatchEvent event

handleProxyNetworkInvalidCode = (code) ->
  event = new CustomEvent 'network.invalid.code',
    bubbles: true
    cancelable: true
    detail:
      code: code
  window.dispatchEvent event

handleProxyNetworkError = ->
  window.dispatchEvent new Event 'network.error'

proxyListener =
  'game.on.request': handleProxyGameOnRequest
  'game.on.response': handleProxyGameOnResponse
  'game.start': handleProxyGameStart
  'game.payitem': handleProxyGamePayitem
  'network.error.retry': handleProxyNetworkErrorRetry
  'network.invalid.code': handleProxyNetworkInvalidCode
  'network.error': handleProxyNetworkError

window.listenerStatusFlag = false

addProxyListener = ()->
  if not window.listenerStatusFlag
    window.listenerStatusFlag = true
    for eventName, handler of proxyListener
      proxy.addListener eventName, handler

addProxyListener()

window.addEventListener 'load', ->
  addProxyListener()

window.addEventListener 'unload', ->
  if window.listenerStatusFlag
    window.listenerStatusFlag = false
    for eventName, handler of proxyListener
      proxy.removeListener eventName, handler
