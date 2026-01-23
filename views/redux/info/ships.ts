import { values } from 'lodash'

import { compareUpdate, indexify, pickExisting } from 'views/utils/tools'
import { createSlice } from '@reduxjs/toolkit'

import {
  createAPIPortPortResponseAction,
  createAPIGetMemberShipDeckResponseAction,
  createAPIGetMemberShip3ResponseAction,
  createAPIGetMemberShip2ResponseAction,
  createAPIReqHokyuChargeResponseAction,
  createAPIReqHenseiLockResponseAction,
  createAPIReqKaisouPowerupResponseAction,
  createAPIReqKaisouSlotExchangeIndexResponseAction,
  createAPIReqKaisouMarriageResponseAction,
  createAPIReqKaisouSlotDepriveResponseAction,
  createAPIReqKousyouDestroyshipResponseAction,
  createAPIReqKousyouGetShipResponseAction,
  createAPIReqNyukyoStartResponseAction,
  createAPIGetMemberNdockResponseAction,
  createAPIReqMapAnchorageRepairResponseAction,
  createAPIReqKaisouOpenExslotResponseAction,
  createInfoShipsRepairCompletedAction,
} from '../actions'

export interface Ship {
  api_id: number
  api_ship_id?: number
  api_nowhp?: number
  api_maxhp?: number
  api_cond?: number
  api_ndock_time?: number
  api_ndock_item?: number[]
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

const shipsSlice = createSlice({
  name: 'ships',
  initialState: {} as ShipsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIPortPortResponseAction, (state, { payload }) => {
        const ships = payload.body?.api_ship as unknown
        const bodyShips = indexify(Array.isArray(ships) ? (ships as Ship[]) : [])
        return pickExisting(compareUpdate(state, bodyShips), bodyShips)
      })
      .addCase(createAPIGetMemberShipDeckResponseAction, (state, { payload }) => {
        return compareUpdate(
          state,
          indexify(
            Array.isArray(payload.body?.api_ship_data)
              ? (payload.body.api_ship_data as unknown as Ship[])
              : [],
          ),
        )
      })
      .addCase(createAPIGetMemberShip3ResponseAction, (state, { payload }) => {
        return compareUpdate(
          state,
          indexify(
            Array.isArray(payload.body?.api_ship_data)
              ? (payload.body.api_ship_data as unknown as Ship[])
              : [],
          ),
        )
      })
      .addCase(createAPIGetMemberShip2ResponseAction, (state, { payload }) => {
        return compareUpdate(
          state,
          indexify(Array.isArray(payload.body) ? (payload.body as unknown as Ship[]) : []),
        )
      })
      .addCase(createAPIReqHokyuChargeResponseAction, (state, { payload }) => {
        return compareUpdate(
          state,
          indexify(
            Array.isArray(payload.body?.api_ship)
              ? (payload.body.api_ship as unknown as Ship[])
              : [],
          ),
          2,
        )
      })
      .addCase(createAPIReqHenseiLockResponseAction, (state, { payload }) => {
        const api_ship_id = payload.postBody?.api_ship_id
        if (!api_ship_id) return state
        return {
          ...state,
          [api_ship_id]: {
            ...state[api_ship_id],
            api_locked: (payload.body as { api_locked?: number } | undefined)?.api_locked,
          },
        }
      })
      .addCase(createAPIReqKaisouPowerupResponseAction, (state, { payload }) => {
        const body = payload.body as unknown as { api_ship?: Ship }
        if (!isRecord(body) || !isRecord(body.api_ship)) return state
        if (!payload.postBody?.api_id_items) return state

        const nextState: ShipsState = {
          ...state,
          [body.api_ship.api_id as number]: body.api_ship as Ship,
        }
        getShipIdList(payload.postBody.api_id_items).forEach((id) => {
          delete nextState[id]
        })
        return nextState
      })
      .addCase(createAPIReqKaisouSlotExchangeIndexResponseAction, (state, { payload }) => {
        const api_ship_data = isRecord(payload.body)
          ? (payload.body as Record<string, unknown>).api_ship_data
          : undefined
        if (!isRecord(api_ship_data) || typeof api_ship_data.api_id !== 'number') return state
        return {
          ...state,
          [api_ship_data.api_id]: api_ship_data as unknown as Ship,
        }
      })
      .addCase(createAPIReqKaisouMarriageResponseAction, (state, { payload }) => {
        const body = payload.body as unknown
        if (!body || typeof (body as { api_id?: unknown }).api_id !== 'number') return state
        const api_id = (body as { api_id: number }).api_id
        return {
          ...state,
          [api_id]: body as Ship,
        }
      })
      .addCase(createAPIReqKaisouSlotDepriveResponseAction, (state, { payload }) => {
        const body = payload.body as unknown
        if (!isRecord(body) || !isRecord((body as Record<string, unknown>).api_ship_data))
          return state
        return {
          ...state,
          ...indexify(
            values((body as { api_ship_data: unknown }).api_ship_data) as unknown as Ship[],
          ),
        }
      })
      .addCase(createAPIReqKousyouDestroyshipResponseAction, (state, { payload }) => {
        const api_ship_id = payload.postBody?.api_ship_id
        if (!api_ship_id) return state
        const nextState: ShipsState = { ...state }
        getShipIdList(api_ship_id).forEach((id) => {
          delete nextState[id]
        })
        return nextState
      })
      .addCase(createAPIReqKousyouGetShipResponseAction, (state, { payload }) => {
        const body = payload.body as unknown
        if (!isRecord(body) || !isRecord((body as Record<string, unknown>).api_ship)) return state
        const ship = (body as { api_ship: Ship }).api_ship
        return {
          ...state,
          [ship.api_id]: ship,
        }
      })
      .addCase(createAPIReqNyukyoStartResponseAction, (state, { payload }) => {
        const api_ship_id = payload.postBody?.api_ship_id
        const api_highspeed = payload.postBody?.api_highspeed
        const api_ndock_id = payload.postBody?.api_ndock_id
        if (!api_ship_id) return state

        if (api_highspeed === '1') {
          const ship = state[api_ship_id]
          if (!ship) return state
          return {
            ...state,
            [api_ship_id]: completeRepair(ship),
          }
        }

        if (api_ndock_id) {
          instantDockingCompletionState = {
            rstId: api_ship_id,
            dockId: Number(api_ndock_id),
          }
        }

        return state
      })
      .addCase(createAPIGetMemberNdockResponseAction, (state, { payload }) => {
        let newState = state
        if (instantDockingCompletionState) {
          const { rstId, dockId } = instantDockingCompletionState
          const dockInfo = Array.isArray(payload.body)
            ? (payload.body as unknown as DockInfo[]).find((x) => x.api_id === dockId)
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
      })
      .addCase(createInfoShipsRepairCompletedAction, (state, { payload }) => {
        const api_ship_id = payload.api_ship_id
        const ship = state[api_ship_id]
        if (!ship) return state
        return {
          ...state,
          [api_ship_id]: completeRepair(ship),
        }
      })
      .addCase(createAPIReqMapAnchorageRepairResponseAction, (state, { payload }) => {
        const body = payload.body as unknown
        const api_ship_data = isRecord(body)
          ? (body as Record<string, unknown>).api_ship_data
          : undefined
        return compareUpdate(
          state,
          indexify(Array.isArray(api_ship_data) ? (api_ship_data as Ship[]) : []),
        )
      })
      .addCase(createAPIReqKaisouOpenExslotResponseAction, (state, { payload }) => {
        const api_id = payload.postBody?.api_id
        if (!api_id) return state
        return {
          ...state,
          [api_id]: {
            ...state[api_id],
            api_slot_ex: -1,
          },
        }
      })
  },
})

export const reducer = shipsSlice.reducer
