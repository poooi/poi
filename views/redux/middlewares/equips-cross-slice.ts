import type { Middleware } from 'redux'

import { flatMap } from 'lodash'

import type { RootState } from '../reducer-factory'

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

export const equipsCrossSliceMiddleware: Middleware = (store) => (next) => (action) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- RootState type from store
  const state = store.getState() as RootState

  if (createAPIReqKaisouPowerupResponseAction.match(action)) {
    // api_req_kaisou/powerup
    // When api_slot_dest_flag != 0, the sacrificed ships' equips are destroyed.
    const slotDestFlag = Number(action.payload.postBody.api_slot_dest_flag ?? 0)
    if (slotDestFlag !== 0) {
      const ids = action.payload.postBody.api_id_items
        .split(',')
        .filter(Boolean)
        .flatMap((shipId) => state.info?.ships?.[Number(shipId)]?.api_slot || [])

      if (ids.length) {
        store.dispatch(createInfoEquipsRemoveByIdsAction({ ids }))
      }
    }
  } else if (createAPIReqKousyouDestroyshipResponseAction.match(action)) {
    // api_req_kousyou/destroyship
    // When api_slot_dest_flag != 0, equips on the scrapped ships are destroyed.
    const slotDestFlag = Number(action.payload.postBody.api_slot_dest_flag)
    if (slotDestFlag !== 0) {
      const ids = flatMap(
        action.payload.postBody.api_ship_id.split(',').filter(Boolean),
        (shipId) => (state.info?.ships?.[Number(shipId)]?.api_slot || []).filter((x) => x != null),
      )

      if (ids.length) {
        store.dispatch(createInfoEquipsRemoveByIdsAction({ ids }))
      }
    }
  }

  return next(action)
}
