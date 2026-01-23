import {
  createAPIReqKousyouCreateShipSpeedChangeResponseAction,
  createAPIReqNyukyoStartResponseAction,
  createInfoResourcesApplyDeltaAction,
} from '../actions'

import type { Middleware } from 'redux'

/**
 * resourcesCrossSliceMiddleware
 *
 * Business logic:
 * - Some resource changes are not fully described by the API response payload.
 * - The game returns "command succeeded" but the exact cost must be derived from
 *   other parts of the current store (e.g. which ship is being repaired, or which
 *   construction recipe was used).
 *
 * Why middleware:
 * - RTK slice reducers intentionally only receive (state, action), and cannot read
 *   other slices.
 * - In this project, legacy reducers used a 3rd "store" arg (root state) via a
 *   custom combineReducers implementation, but RTK does not support that signature.
 * - This middleware keeps reducers pure by computing the derived cost using
 *   store.getState(), then dispatching a small internal action that only targets
 *   info.resources.
 */

type RootState = {
  info?: {
    constructions?: Array<{ api_item1?: number }>
    ships?: Record<string, { api_ndock_item?: number[] }>
  }
}

type Action = {
  type: string
  payload?: {
    postBody?: Record<string, unknown>
  }
}

export const resourcesCrossSliceMiddleware: Middleware = (store) => (next) => (action) => {
  // Compute deltas based on *current* store before reducers handle the action.
  // This mirrors the previous behavior where reducers received the root state.
  const state = store.getState() as RootState
  const a = action as Action

  if (a.type === createAPIReqKousyouCreateShipSpeedChangeResponseAction.type) {
    // api_req_kousyou/createship_speedchange
    // This is "instant build" for an in-progress construction dock.
    // The API response itself doesn't tell us if it was a Large Ship Construction (LSC).
    // We infer it from the original recipe in kdock:
    // - if api_item1 (fuel) > 1000 => LSC => consumes 10 instant construction materials
    // - otherwise => consumes 1 instant construction material
    const kdockId = Number(a.payload?.postBody?.api_kdock_id)
    if (kdockId > 0) {
      const item1 = state?.info?.constructions?.[kdockId - 1]?.api_item1
      if (typeof item1 === 'number') {
        const lsc = item1 > 1000
        store.dispatch(
          createInfoResourcesApplyDeltaAction({
            delta: [0, 0, 0, 0, -(lsc ? 10 : 1), 0, 0, 0],
          }),
        )
      }
    }
  } else if (a.type === createAPIReqNyukyoStartResponseAction.type) {
    // api_req_nyukyo/start
    // Starting a repair consumes fuel/steel (and optionally a bucket if highspeed).
    // These costs are stored on the ship object (api_ndock_item = [fuel, steel]),
    // not in the API response.
    const shipId = String(a.payload?.postBody?.api_ship_id || '')
    if (shipId) {
      const ndockItem = state?.info?.ships?.[shipId]?.api_ndock_item
      if (Array.isArray(ndockItem) && ndockItem.length >= 2) {
        const fuel = Number(ndockItem[0]) || 0
        const steel = Number(ndockItem[1]) || 0
        const highspeed = Number(a.payload?.postBody?.api_highspeed) === 1
        store.dispatch(
          createInfoResourcesApplyDeltaAction({
            delta: [-fuel, 0, -steel, 0, 0, highspeed ? -1 : 0, 0, 0],
          }),
        )
      }
    }
  }

  return next(action)
}
