import type { Middleware } from 'redux'

import { flatMap, get } from 'lodash'

import {
  createAPIReqKaisouPowerupResponseAction,
  createAPIReqKousyouDestroyshipResponseAction,
  createInfoEquipsRemoveByIdsAction,
} from '../actions'

/**
 * equipsCrossSliceMiddleware
 *
 * Business logic:
 * - Some equip removals are controlled by request flags, but the list of equip IDs
 *   to delete must be derived from ships (another slice).
 *
 * Why middleware:
 * - RTK slice reducers cannot read other slices.
 * - The legacy reducer used the custom combineReducers 3rd arg (root state) to
 *   look up ship slots and delete equips.
 */

type RootState = {
  info?: {
    ships?: Record<string, { api_slot?: number[] }>
  }
}

type Action = {
  type: string
  payload?: {
    postBody?: Record<string, unknown>
  }
}

export const equipsCrossSliceMiddleware: Middleware = (store) => (next) => (action) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- RootState type from store
  const state = store.getState() as RootState
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Action type narrowing
  const a = action as Action

  if (a.type === createAPIReqKaisouPowerupResponseAction.type) {
    // api_req_kaisou/powerup
    // When api_slot_dest_flag != 0, the sacrificed ships' equips are destroyed.
    const slotDestFlag = Number(a.payload?.postBody?.api_slot_dest_flag || 0)
    if (slotDestFlag !== 0) {
      const ids = String(a.payload?.postBody?.api_id_items || '')
        .split(',')
        .filter(Boolean)
        .flatMap(
          (shipId) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- api_slot is known to be number[]
            (get(state, `info.ships.${shipId}.api_slot`) as number[]) || [],
        )

      if (ids.length) {
        store.dispatch(createInfoEquipsRemoveByIdsAction({ ids }))
      }
    }
  } else if (a.type === createAPIReqKousyouDestroyshipResponseAction.type) {
    // api_req_kousyou/destroyship
    // When api_slot_dest_flag != 0, equips on the scrapped ships are destroyed.
    const slotDestFlag = Number(a.payload?.postBody?.api_slot_dest_flag || 0)
    if (slotDestFlag !== 0) {
      const shipIds = String(a.payload?.postBody?.api_ship_id || '')
        .split(',')
        .filter(Boolean)

      const ids = flatMap(shipIds, (shipId) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- api_slot is known to be number[]
        ((get(state, `info.ships.${shipId}.api_slot`) as number[]) || []).filter((x) => x != null),
      )

      if (ids.length) {
        store.dispatch(createInfoEquipsRemoveByIdsAction({ ids }))
      }
    }
  }

  return next(action)
}
