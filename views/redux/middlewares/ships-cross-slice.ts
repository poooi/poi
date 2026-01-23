import {
  createAPIReqNyukyoSpeedchangeResponseAction,
  createInfoShipsRepairCompletedAction,
} from '../actions'

import type { Middleware } from 'redux'

/**
 * shipsCrossSliceMiddleware
 *
 * Business logic:
 * - api_req_nyukyo/speedchange is the "use bucket" action.
 * - The response doesn't include which ship was in the selected dock.
 * - The ship roster id must be derived from info.repairs.
 */

type RootState = {
  info?: {
    repairs?: Array<{ api_ship_id?: number }>
  }
}

type Action = {
  type: string
  payload?: {
    postBody?: Record<string, unknown>
  }
}

export const shipsCrossSliceMiddleware: Middleware = (store) => (next) => (action) => {
  const state = store.getState() as RootState
  const a = action as Action

  if (a.type === createAPIReqNyukyoSpeedchangeResponseAction.type) {
    const dockId = Number(a.payload?.postBody?.api_ndock_id)
    if (dockId > 0) {
      const shipId = state?.info?.repairs?.[dockId - 1]?.api_ship_id
      if (typeof shipId === 'number' && shipId > 0) {
        store.dispatch(createInfoShipsRepairCompletedAction({ api_ship_id: shipId }))
      }
    }
  }

  return next(action)
}
