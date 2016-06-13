reduceReducers = require 'reduce-reducers'

mergeIndexifiedEquips = (state, body) -> 
  Object.assign {}, state, indexify(body)

# Returns a clone
# Don't worry about -1 because it won't cause error
removeEquips = (equips, idList) ->
  equips = Object.assign {}, equips
  for itemId in idList
    delete equips[itemId]
  equips

module.exports.reducer = reduceReducers(
  initAs({})
  ,
  listenToResponse('/kcsapi/api_get_member/slot_item',
    (state, {body}) ->
      indexify body
  ),
  listenToResponse('/kcsapi/api_get_member/require_info',
    (state, {body}) ->
      indexify body.api_slot_item
  ),
  listenToResponse('/kcsapi/api_req_kousyou/createitem',
    (state, {body: {api_slot_item: {api_id}, api_create_flag}}) ->
      if body.api_create_flag == 1
        equips = Object.assign {}, state
        equips[api_id] = api_slot_item
        equips
  ),
  listenToResponse('/kcsapi/api_req_kousyou/getship',
    (state, {body: {api_slotitem}}) ->
      if api_slotitem?
        mergeIndexifiedEquips state, api_slotitem
  ),
  listenToResponse('/kcsapi/api_req_kousyou/destroyitem2',
    (state, {postBody: {api_slotitem_ids}}) ->
      removeEquips state, api_slotitem_ids.split(',')
  ),
  listenToResponse('/kcsapi/api_req_kaisou/lock',
    (state, {postBody: {api_slotitem_id}, body: {api_locked}}) ->
      equips = Object.assign {}, state
      equips[api_slotitem_id] = Object.assign {}, equips[api_slotitem_id],
        api_locked: api_locked
      equips
  ),
  listenToResponse('/kcsapi/api_req_kaisou/powerup',
    (state, {postBody: {api_id_items}}) ->
      removeEquips state, [].concat.apply([], 
        api_id_items.split(',').map((shipId) ->
          getStore("info.ships.#{shipId}.api_slot") || []
        )
      )
  ),
  listenToResponse('/kcsapi/api_req_kousyou/destroyship',
    (state, {postBody: {api_ship_id}}) ->
      removeEquips state, getStore("info.ships.#{api_ship_id}.api_slot")
  ),
  listenToResponse('/kcsapi/api_req_kousyou/remodel_slot',
    (state, {body: {api_use_slot_id, api_remodel_flag, api_after_slot}}) ->
      if api_use_slot_id?
        state = removeEquips state, api_use_slot_id
      if api_remodel_flag == 1 and api_after_slot?
        state = Object.assign {}, state
        state[api_after_slot.api_id] = extendSlotitem api_after_slot
      state
  ),
)
