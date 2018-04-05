import { compareUpdate, indexify, pickExisting } from 'views/utils/tools'
import { flatMap, isArray, get } from 'lodash'

// Returns a clone
// Don't worry about -1 because it won't cause error
function removeEquips(equips, idList) {
  equips = Object.assign({}, equips)
  idList.forEach((itemId) => delete equips[itemId])
  return equips
}

const ensureArray = x => isArray(x) ? x : [x]

export function reducer(state={}, {type, postBody, body}, store) {
  switch (type) {
  case '@@Response/kcsapi/api_get_member/slot_item': {
    const bodyEquips = indexify(body)
    return pickExisting(compareUpdate(state, bodyEquips), bodyEquips)
  }
  case '@@Response/kcsapi/api_get_member/require_info': {
    const bodyEquips = indexify(body.api_slot_item)
    return pickExisting(compareUpdate(state, bodyEquips), bodyEquips)
  }
  case '@@Response/kcsapi/api_req_kousyou/createitem':
    if (body.api_create_flag == 1) {
      const {api_slot_item} = body
      return {
        ...state,
        [api_slot_item.api_id]: api_slot_item,
      }
    }
    break
  case '@@Response/kcsapi/api_req_kousyou/getship':
    if (body.api_slotitem) {
      return {
        ...state,
        ...indexify(body.api_slotitem),
      }
    }
    break
  case '@@Response/kcsapi/api_req_kousyou/destroyitem2':
    return removeEquips(state, postBody.api_slotitem_ids.split(','))
  case '@@Response/kcsapi/api_req_kaisou/lock': {
    const {api_slotitem_id} = postBody
    const {api_locked} = body
    return {
      ...state,
      [api_slotitem_id]: {
        ...state[api_slotitem_id],
        api_locked: api_locked,
      },
    }
  }
  case '@@Response/kcsapi/api_req_kaisou/powerup':
    return removeEquips(state, [].concat.apply([],
      postBody.api_id_items.split(',').map((shipId) =>
        get(store, `info.ships.${shipId}.api_slot`) || []
      )
    ))
  case '@@Response/kcsapi/api_req_kousyou/destroyship':
    return parseInt(postBody.api_slot_dest_flag) === 0 ? state :
      removeEquips(state, flatMap(
        postBody.api_ship_id.split(','),
        shipId => get(store, `info.ships.${shipId}.api_slot`) || [],
      ))
  case '@@Response/kcsapi/api_req_kousyou/remodel_slot': {
    const {api_use_slot_id, api_remodel_flag, api_after_slot} = body
    if (api_use_slot_id != null) {
      state = removeEquips(state, api_use_slot_id)
    }
    if (api_remodel_flag == 1 && api_after_slot != null) {
      state = {
        ...state,
        [api_after_slot.api_id]: api_after_slot,
      }
    }
    return state
  }
  case '@@Response/kcsapi/api_req_member/itemuse': {
    if (body.api_slotitem) {
      return {
        ...state,
        ...indexify(ensureArray(body.api_slotitem)),
      }
    }
  }
  }
  return state
}
