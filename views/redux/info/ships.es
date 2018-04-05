import { values, get } from 'lodash'

import { compareUpdate, indexify, pickExisting } from 'views/utils/tools'

/*

   turns out if it takes less than 60 seconds to repair a ship,
   the following will happen:

   - kcsapi/api_req_nyukyo/start is requested
   - kcsapi/api_get_member/ndock is requested right after previous request is done,
     but in the response body, the corresponding slot does not contain any ship
     and is marked as available (api_state === 0) as if the docking never happened.
     simply observing changes to info.repairs will not help in this case,
     as the ship being docked is never included in the response body.

   we call this scenario "instant docking completion".

   to handle this scenario correctly,
   an internal state (could be null) of the following shape is used for detection:

   instantDockingCompletionState = {
     dockId: <number from 1 to 4>,
     rstId: <ship roster id>,
   }

   - initially, the state is set to `null`.

   - any docking action (i.e. kcsapi/api_req_nyukyo/start) sets it accordingly.

   - any kcsapi/api_get_member/ndock request sets it back to `null` after state
     transition is handled.

   - as `kcsapi/api_req_nyukyo/start` is always followed by `kcsapi/api_get_member/ndock`,
     this internal state can only be non-null after `kcsapi/api_req_nyukyo/start` and
     before finishing handling `kcsapi/api_get_member/ndock`.

   - while handling `kcsapi/api_get_member/ndock`, we check whether the dock we just used
     is empty, and if it's indeed the case, that indicates instant docking completion is happening
     so we apply repair accordingly.

   justification for using an internal state instead of keeping it in redux store:
   the transition is short, and no other part cares about this particular part of state.

 */
let instantDockingCompletionState = null

// Restore a ship with full health and >=40 cond.
// Returns a clone.
function completeRepair(ship) {
  return compareUpdate(ship, {
    api_nowhp: ship.api_maxhp,
    api_cond: Math.max(40, ship.api_cond),
    api_ndock_time: 0,
  })
}

export function reducer(state={}, {type, body, postBody}, store) {
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
    const {api_ship_id, api_highspeed, api_ndock_id} = postBody

    if (api_highspeed == '1') {
      return {
        ...state,
        [api_ship_id]: completeRepair(state[api_ship_id]),
      }
    } else {
      instantDockingCompletionState = {
        rstId: api_ship_id,
        dockId: Number(api_ndock_id),
      }
    }
    break
  }
  case '@@Response/kcsapi/api_get_member/ndock': {
    let newState = state
    if (instantDockingCompletionState) {
      const {rstId, dockId} = instantDockingCompletionState
      const dockInfo = body.find(x => x.api_id === dockId)
      if (dockInfo.api_ship_id === 0) {
        newState = {
          ...state,
          [rstId]: completeRepair(state[rstId]),
        }
      }
    }

    instantDockingCompletionState = null
    return newState
  }
  case '@@Response/kcsapi/api_req_nyukyo/speedchange': {
    const api_ship_id = get(store, `info.repair.${postBody.api_ndock_id}.api_ship_id`)
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
