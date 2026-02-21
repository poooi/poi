import { createSlice } from '@reduxjs/toolkit'
import { keyBy, filter } from 'lodash'
import { compareUpdate, indexify, pickExisting } from 'views/utils/tools'

import {
  createAPIGetMemberSlotItemResponseAction,
  createAPIGetMemberRequireInfoAction,
  createAPIReqKousyouCreateitemResponseAction,
  createAPIReqKousyouGetShipResponseAction,
  createAPIReqKousyouDestroyitem2ResponseAction,
  createAPIReqKaisouLockResponseAction,
  createAPIReqKaisouPowerupResponseAction,
  createAPIReqKousyouDestroyshipResponseAction,
  createAPIReqKousyouRemodelSlotResponseAction,
  createAPIReqMemberItemuseResponseAction,
  createInfoEquipsRemoveByIdsAction,
} from '../actions'

export interface Equip {
  api_id: number
  api_slotitem_id?: number
  api_locked?: number
}

export interface EquipsState {
  [key: string]: Equip
}

// Returns a clone
// Don't worry about -1 because it won't cause error
function removeEquips(equips: EquipsState, idList: (string | number)[]): EquipsState {
  equips = Object.assign({}, equips)
  idList.forEach((itemId) => {
    delete equips[itemId]
  })
  return equips
}

const equipsSlice = createSlice({
  name: 'equips',
  initialState: {} as EquipsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIGetMemberSlotItemResponseAction, (state, { payload }) => {
        const bodyEquips = indexify<Equip>(payload.body)
        return pickExisting(compareUpdate(state, bodyEquips), bodyEquips)
      })
      .addCase(createAPIGetMemberRequireInfoAction, (state, { payload }) => {
        const bodyEquips = indexify<Equip>(payload.body.api_slot_item || [])
        return pickExisting(compareUpdate(state, bodyEquips), bodyEquips)
      })
      .addCase(createAPIReqKousyouCreateitemResponseAction, (state, { payload }) => {
        const body = payload.body
        if (body.api_create_flag !== 1) return state
        const items = keyBy(
          filter(body.api_get_items, (item) => item?.api_id > 0),
          'api_id',
        )
        return {
          ...state,
          ...items,
        }
      })
      .addCase(createAPIReqKousyouGetShipResponseAction, (state, { payload }) => {
        const items = payload.body.api_slotitem
        if (!items || items.length === 0) return state
        return {
          ...state,
          ...indexify<Equip>(items),
        }
      })
      .addCase(createAPIReqKousyouDestroyitem2ResponseAction, (state, { payload }) => {
        return removeEquips(state, String(payload.postBody.api_slotitem_ids).split(','))
      })
      .addCase(createAPIReqKaisouLockResponseAction, (state, { payload }) => {
        const api_slotitem_id = String(payload.postBody.api_slotitem_id)
        const api_locked = payload.body.api_locked
        return {
          ...state,
          [api_slotitem_id]: {
            ...state[api_slotitem_id],
            api_locked: api_locked,
          },
        }
      })
      .addCase(createAPIReqKousyouRemodelSlotResponseAction, (state, { payload }) => {
        const body = payload.body
        let nextState = state
        if (body.api_use_slot_id != null) {
          nextState = removeEquips(nextState, body.api_use_slot_id)
        }
        if (body.api_remodel_flag === 1 && body.api_after_slot != null) {
          nextState = {
            ...nextState,
            [body.api_after_slot.api_id]: body.api_after_slot,
          }
        }
        return nextState
      })
      .addCase(createAPIReqMemberItemuseResponseAction, (state, { payload }) => {
        const items = (payload.body.api_getitem || [])
          .flatMap((g) => (g?.api_slotitem ? [g.api_slotitem] : []))
          .filter((x) => x && typeof x.api_id === 'number')
        if (items.length === 0) return state
        return {
          ...state,
          ...indexify<Equip>(items),
        }
      })
      .addCase(createInfoEquipsRemoveByIdsAction, (state, { payload }) => {
        return removeEquips(state, payload.ids)
      })
  },
})

export function reducer(
  state: EquipsState = {},
  action: { type: string; payload?: unknown },
): EquipsState {
  switch (action.type) {
    // These cross-slice dependent cases are handled by equipsCrossSliceMiddleware.
    // Keep the type here so the old behavior isn't accidentally reintroduced.
    case createAPIReqKaisouPowerupResponseAction.type:
    case createAPIReqKousyouDestroyshipResponseAction.type:
      return state
    default:
      return equipsSlice.reducer(state, action as never // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion)
  }
}
