import { compareUpdate, indexify, pickExisting } from 'views/utils/tools'
import { flatMap, isArray, get, keyBy, filter } from 'lodash'
import { createSlice } from '@reduxjs/toolkit'
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
} from '../actions'

export interface Equip {
  api_id: number
  api_slotitem_id?: number
  api_locked?: number
  [key: string]: unknown
}

export interface EquipsState {
  [key: string]: Equip
}

interface Store {
  info?: {
    ships?: {
      [key: string]: {
        api_slot?: number[]
      }
    }
  }
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

const ensureArray = <T>(x: T | T[]): T[] => (isArray(x) ? x : [x])

const equipsSlice = createSlice({
  name: 'equips',
  initialState: {} as EquipsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIGetMemberSlotItemResponseAction, (state, { payload }) => {
        const bodyEquips = indexify(payload.body as unknown as Equip[])
        return pickExisting(compareUpdate(state, bodyEquips), bodyEquips)
      })
      .addCase(createAPIGetMemberRequireInfoAction, (state, { payload }) => {
        const bodyEquips = indexify((payload.body.api_slot_item || []) as unknown as Equip[])
        return pickExisting(compareUpdate(state, bodyEquips), bodyEquips)
      })
      .addCase(createAPIReqKousyouCreateitemResponseAction, (state, { payload }) => {
        const body = payload.body as unknown as {
          api_create_flag?: number
          api_get_items?: Equip[]
        }
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
        const body = payload.body as unknown as { api_slotitem?: Equip | Equip[] }
        if (!body.api_slotitem) return state
        if (Array.isArray(body.api_slotitem)) {
          return {
            ...state,
            ...indexify(body.api_slotitem as unknown as Equip[]),
          }
        }
        return {
          ...state,
          ...indexify([body.api_slotitem] as unknown as Equip[]),
        }
      })
      .addCase(createAPIReqKousyouDestroyitem2ResponseAction, (state, { payload }) => {
        return removeEquips(state, String(payload.postBody.api_slotitem_ids).split(','))
      })
      .addCase(createAPIReqKaisouLockResponseAction, (state, { payload }) => {
        const api_slotitem_id = String(payload.postBody.api_slotitem_id)
        const api_locked = (payload.body as { api_locked?: number }).api_locked
        return {
          ...state,
          [api_slotitem_id]: {
            ...state[api_slotitem_id],
            api_locked: api_locked,
          },
        }
      })
      .addCase(createAPIReqKousyouRemodelSlotResponseAction, (state, { payload }) => {
        const body = payload.body as {
          api_use_slot_id?: number[]
          api_remodel_flag?: number
          api_after_slot?: Equip
        }
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
        const body = payload.body as { api_slotitem?: Equip | Equip[] }
        if (!body.api_slotitem) return state
        return {
          ...state,
          ...indexify(ensureArray(body.api_slotitem)),
        }
      })
  },
})

export function reducer(
  state: EquipsState = {},
  action: { type: string; payload?: unknown },
  store?: Store,
): EquipsState {
  switch (action.type) {
    case createAPIReqKaisouPowerupResponseAction.type: {
      const payload = action.payload as {
        postBody?: { api_slot_dest_flag?: string; api_id_items?: string }
      }
      return parseInt(payload.postBody?.api_slot_dest_flag || '0') === 0
        ? state
        : removeEquips(
            state,
            (payload.postBody?.api_id_items || '')
              .split(',')
              .flatMap((shipId) => get(store, `info.ships.${shipId}.api_slot`) || []),
          )
    }
    case createAPIReqKousyouDestroyshipResponseAction.type: {
      const payload = action.payload as {
        postBody?: { api_slot_dest_flag?: string; api_ship_id: string }
      }
      return parseInt(payload.postBody?.api_slot_dest_flag || '0') === 0
        ? state
        : removeEquips(
            state,
            flatMap(
              String(payload.postBody?.api_ship_id || '')
                .split(',')
                .filter(Boolean),
              (shipId) => get(store, `info.ships.${shipId}.api_slot`) || [],
            ),
          )
    }
    default:
      return equipsSlice.reducer(state, action as never)
  }
}
