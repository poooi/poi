reduceReducers = require 'reduce-reducers'
{values} = require 'underscore'

mergeIndexifiedShips = (state, body) -> 
  Object.assign {}, state, indexify(body)

# Returns a clone
completeRepair = (ship) ->
  Object.assign {}, ship,
    api_nowhp: ship.api_maxhp
    api_cond: Math.max(40, ship.api_cond)

module.exports.reducer = reduceReducers(
  initAs({})
  ,
  listenToResponse([
      '/kcsapi/api_get_member/ship_deck',
      '/kcsapi/api_get_member/ship3',
    ], (state, {body}) ->
      mergeIndexifiedShips state, body.api_ship_data
  ),
  listenToResponse('/kcsapi/api_get_member/ship2',
    (state, {body}) ->
      mergeIndexifiedShips state, body
  ),
  listenToResponse([
      '/kcsapi/api_port/port',
      '/kcsapi/api_req_hokyu/charge',
    ], (state, {body}) ->
      mergeIndexifiedShips state, body.api_ship
  ),
  listenToResponse('/kcsapi/api_req_hensei/lock',
    (state, {postBody: {api_ship_id}, body}) ->
      ships = Object.assign {}, state
      ships[api_ship_id] = Object.assign {}, ships[api_ship_id]
        api_locked: body.api_locked
      ships
  ),
  listenToResponse('/kcsapi/api_req_kaisou/powerup',
    (state, {postBody, body}) ->
      ships = Object.assign {}, state
      for shipId in postBody.api_id_items.split(',')
        delete ships[parseInt(shipId)]
      ships[body.api_ship.api_id] = body.api_ship
      ships
  ),
  listenToResponse('/kcsapi/api_req_kaisou/slotset',
    (state, {postBody: {api_id, api_slot_idx, api_item_id}}) ->
      newSlot = ships[parseInt(api_id)].api_slot.slice()
      newSlot[parseInt(api_slot_idx)] = parseInt(api_item_id)
      ships = Object.assign {}, state
      ships[parseInt(api_id)] = Object.assign {}, ships[parseInt(api_id)]
        api_slot: newSlot
      ships
  ),
  listenToResponse('/kcsapi/api_req_kaisou/slot_exchange_index',
    (state, {postBody: {api_id}, body}) ->
      ships = Object.assign {}, state
      ships[parseInt(api_id)] = Object.assign {}, ships[parseInt(api_id)]
        api_slot: body.api_slot
      ships
  ),
  listenToResponse('/kcsapi/api_req_kaisou/slot_deprive',
    (state, {body}) ->
      mergeIndexifiedShips state, values(body.api_ship_data)
  ),
  listenToResponse('/kcsapi/api_req_kousyou/destroyship',
    (state, {postBody: {api_ship_id}}) ->
      ships = Object.assign {}, state
      delete ships[parseInt(api_ship_id)]
      ships
  ),
  listenToResponse('/kcsapi/api_req_kousyou/getship',
    (state, {body: {api_ship}}) ->
      ships = Object.assign {}, state
      ships[api_ship.api_id] = api_ship
      ships
  ),
  listenToResponse('/kcsapi/api_req_nyukyo/start',
    (state, {postBody: {api_ship_id, api_highspeed}}) ->
      if api_highspeed == '1'
        ship = state[api_ship_id]
        ships = Object.assign {}, state
        ships[api_ship_id] = completeRepair ship
        ships
  ),
  listenToResponse('/kcsapi/api_req_nyukyo/speedchange',
    (state, {postBody: {api_ndock_id}}) ->
      api_ship_id = getStore("info.repair.#{api_ndock_id}.api_ship_id")
      if api_ship_id
        ship = state[api_ship_id]
        ships = Object.assign {}, state
        ships[api_ship_id] = completeRepair ship
        ships
  ),
)
