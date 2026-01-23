import { values, get } from 'lodash'

import { compareUpdate, indexify, pickExisting } from 'views/utils/tools'

export interface Ship {
  api_id: number
  api_ship_id?: number
  api_nowhp?: number
  api_maxhp?: number
  api_cond?: number
  api_ndock_time?: number
  api_ndock_item?: [number, number]
  api_locked?: number
  api_slot?: number[]
  api_slot_ex?: number
  [key: string]: unknown
}

export interface ShipsState {
  [key: string]: Ship
}

interface DockInfo {
  api_id: number
  api_ship_id: number
}

interface Action {
  type: string
  body?: {
    api_ship?: Ship | Ship[]
    api_ship_data?: Ship | Ship[]
    api_locked?: number
    api_id?: number
    [key: string]: unknown
  } & Ship[] &
    Ship &
    DockInfo[]
  postBody?: {
    api_ship_id?: string
    api_highspeed?: string
    api_ndock_id?: string
    api_id_items?: string
    api_id?: string
    [key: string]: unknown
  }
}

function getShipIdList(csv: string): number[] {
  return csv
    .split(',')
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((x) => !Number.isNaN(x))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object'
}

interface Store {
  info?: {
    repair?: {
      [key: string]: {
        api_ship_id?: number
      }
    }
  }
}

interface InstantDockingState {
  dockId: number
  rstId: string
}

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
let instantDockingCompletionState: InstantDockingState | null = null

// Restore a ship with full health and >=40 cond.
// Returns a clone.
function completeRepair(ship: Ship): Ship {
  return compareUpdate(ship, {
    ...ship,
    api_nowhp: ship.api_maxhp,
    api_cond: Math.max(40, ship.api_cond || 0),
    api_ndock_time: 0,
  })
}

export function reducer(
  state: ShipsState = {},
  { type, body, postBody }: Action,
  store?: Store,
): ShipsState {
  switch (type) {
    case '@@Response/kcsapi/api_port/port': {
      const ships = body?.api_ship
      const bodyShips = indexify(Array.isArray(ships) ? ships : [])
      return pickExisting(compareUpdate(state, bodyShips), bodyShips)
    }
    case '@@Response/kcsapi/api_get_member/ship_deck':
    case '@@Response/kcsapi/api_get_member/ship3':
      return compareUpdate(
        state,
        indexify(Array.isArray(body?.api_ship_data) ? body.api_ship_data : []),
      )
    case '@@Response/kcsapi/api_get_member/ship2':
      return compareUpdate(state, indexify(Array.isArray(body) ? body : []))
    case '@@Response/kcsapi/api_req_hokyu/charge':
      // Only partial info is given for each ship here
      return compareUpdate(state, indexify(Array.isArray(body?.api_ship) ? body.api_ship : []), 2)
    case '@@Response/kcsapi/api_req_hensei/lock': {
      const api_ship_id = postBody?.api_ship_id
      if (!api_ship_id) {
        break
      }
      return {
        ...state,
        [api_ship_id]: {
          ...state[api_ship_id],
          api_locked: body?.api_locked,
        },
      }
    }
    case '@@Response/kcsapi/api_req_kaisou/powerup':
      if (!isRecord(body) || !isRecord(body.api_ship)) {
        break
      }
      if (!postBody?.api_id_items) {
        break
      }
      state = {
        ...state,
        [body.api_ship.api_id as number]: body.api_ship as unknown as Ship,
      }
      getShipIdList(postBody.api_id_items).forEach((id) => {
        delete state[id]
      })
      return state
    case '@@Response/kcsapi/api_req_kaisou/slot_exchange_index': {
      const api_ship_data = isRecord(body) ? body.api_ship_data : undefined
      if (!isRecord(api_ship_data) || typeof api_ship_data.api_id !== 'number') {
        break
      }
      return {
        ...state,
        [api_ship_data.api_id]: api_ship_data as unknown as Ship,
      }
    }
    case '@@Response/kcsapi/api_req_kaisou/marriage': {
      if (!body || typeof body.api_id !== 'number') {
        break
      }
      return {
        ...state,
        [body.api_id]: body as Ship,
      }
    }
    case '@@Response/kcsapi/api_req_kaisou/slot_deprive':
      if (!isRecord(body) || !isRecord(body.api_ship_data)) {
        break
      }
      return {
        ...state,
        ...indexify(values(body.api_ship_data) as unknown as Ship[]),
      }
    case '@@Response/kcsapi/api_req_kousyou/destroyship':
      if (!postBody?.api_ship_id) {
        break
      }
      state = { ...state }
      getShipIdList(postBody.api_ship_id).forEach((id) => {
        delete state[id]
      })
      return state
    case '@@Response/kcsapi/api_req_kousyou/getship':
      if (!isRecord(body) || !isRecord(body.api_ship)) {
        break
      }
      return {
        ...state,
        [body.api_ship.api_id as number]: body.api_ship as unknown as Ship,
      }
    case '@@Response/kcsapi/api_req_nyukyo/start': {
      const api_ship_id = postBody?.api_ship_id
      const api_highspeed = postBody?.api_highspeed
      const api_ndock_id = postBody?.api_ndock_id
      if (!api_ship_id) {
        break
      }

      if (api_highspeed == '1') {
        const ship = state[api_ship_id]
        if (!ship) {
          break
        }
        return {
          ...state,
          [api_ship_id]: completeRepair(ship),
        }
      } else {
        if (!api_ndock_id) {
          break
        }
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
        const { rstId, dockId } = instantDockingCompletionState
        const dockInfo = Array.isArray(body)
          ? (body as unknown as DockInfo[]).find((x) => x.api_id === dockId)
          : undefined
        if (dockInfo && dockInfo.api_ship_id === 0 && state[rstId]) {
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
      const dockId = postBody?.api_ndock_id
      if (!dockId) {
        break
      }
      const api_ship_id = get(store, `info.repair.${dockId}.api_ship_id`) as number | undefined
      if (api_ship_id) {
        const ship = state[api_ship_id]
        if (!ship) {
          break
        }
        return {
          ...state,
          [api_ship_id]: completeRepair(ship),
        }
      }
      break
    }
    case '@@info.ships@RepairCompleted': {
      const api_ship_id = isRecord(body) ? body.api_ship_id : undefined
      if (typeof api_ship_id !== 'number') {
        break
      }
      const ship = state[api_ship_id]
      if (!ship) {
        break
      }
      return {
        ...state,
        [api_ship_id]: completeRepair(ship),
      }
    }
    case '@@Response/kcsapi/api_req_map/anchorage_repair': {
      const api_ship_data = isRecord(body) ? body.api_ship_data : undefined
      return compareUpdate(state, indexify(Array.isArray(api_ship_data) ? api_ship_data : []))
    }
    case '@@Response/kcsapi/api_req_kaisou/open_exslot': {
      const api_id = postBody?.api_id
      if (!api_id) {
        break
      }
      return {
        ...state,
        [api_id]: {
          ...state[api_id],
          api_slot_ex: -1, // 補強スロット 0=未解放, -1=未装備
        },
      }
    }
  }
  return state
}
