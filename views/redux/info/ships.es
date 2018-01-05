import {values} from 'lodash'

import { compareUpdate, indexify, pickExisting } from 'views/utils/tools'

// Restore a ship with full health and >=40 cond.
// Returns a clone.
function completeRepair(ship) {
  return compareUpdate(ship, {
    api_nowhp: ship.api_maxhp,
    api_cond: Math.max(40, ship.api_cond),
    api_ndock_time: 0,
  })
}

export function reducer(state={}, {type, body, postBody}) {
  const {getStore} = window
  switch (type) {
  case '@@Response/kcsapi/api_port/port': {
    const bodyShips = indexify(body.api_ship)
    return pickExisting(compareUpdate(state, bodyShips), bodyShips)
  }
  case '@@Response/kcsapi/api_get_member/ship_deck':
  case '@@Response/kcsapi/api_get_member/ship3':
    return compareUpdate(state, indexify(body.api_ship_data))
  case '@@Response/kcsapi/api_get_member/ship2':
    return compareUpdate(state, indexify(body))
  case '@@Response/kcsapi/api_req_hokyu/charge':
    // Only partial info is given for each ship here
    return compareUpdate(state, indexify(body.api_ship), 2)
  case '@@Response/kcsapi/api_req_hensei/lock': {
    const {api_ship_id} = postBody
    return {
      ...state,
      [api_ship_id]: {
        ...state[api_ship_id],
        api_locked: body.api_locked,
      },
    }
  }
  case '@@Response/kcsapi/api_req_kaisou/powerup':
    state = {
      ...state,
      [body.api_ship.api_id]: body.api_ship,
    }
    postBody.api_id_items.split(',').forEach((shipId) => {
      delete state[parseInt(shipId)]
    })
    return state
  case '@@Response/kcsapi/api_req_kaisou/slot_exchange_index': {
    const {api_id} = postBody
    return {
      ...state,
      [api_id]: {
        ...state[api_id],
        api_slot: body.api_slot,
      },
    }
  }
  case '@@Response/kcsapi/api_req_kaisou/slot_deprive':
    return {
      ...state,
      ...indexify(values(body.api_ship_data)),
    }
  case '@@Response/kcsapi/api_req_kousyou/destroyship':
    state = {...state}
    postBody.api_ship_id.split(',').forEach((shipId) => {
      delete state[parseInt(shipId)]
    })
    return state
  case '@@Response/kcsapi/api_req_kousyou/getship':
    return {
      ...state,
      [body.api_ship.api_id]: body.api_ship,
    }
  case '@@Response/kcsapi/api_req_nyukyo/start': {
    const {api_ship_id, api_highspeed} = postBody
    if (api_highspeed == '1')
      return {
        ...state,
        [api_ship_id]: completeRepair(state[api_ship_id]),
      }
    break
  }
  case '@@Response/kcsapi/api_req_nyukyo/speedchange': {
    const api_ship_id = getStore(`info.repair.${postBody.api_ndock_id}.api_ship_id`)
    if (api_ship_id) {
      return {
        ...state,
        [api_ship_id]: completeRepair(state[api_ship_id]),
      }
    }
    break
  }
  case '@@info.ships@RepairCompleted': {
    const {api_ship_id} = body
    return {
      ...state,
      [api_ship_id]: completeRepair(state[api_ship_id]),
    }
  }
  }
  return state
}
