import { createSlice } from '@reduxjs/toolkit'
import { indexify, compareUpdate, pickExisting } from 'views/utils/tools'

import {
  createAPIGetMemberRequireInfoAction,
  createAPIGetMemberUseitemResponseAction,
  createAPIReqKousyouRemodelSlotlistDetailResponseAction,
  createAPIReqMissionResultResponseAction,
  createAPIReqCombinedBattleBattleresultResponseAction,
  createAPIReqSortieBattleResultResponseAction,
} from '../actions'

export interface UseItem {
  api_id?: number
  api_count?: number
}

export interface UseItemsState {
  [key: string]: UseItem
}

/**
 * Helper function to update useitem count (api_count).
 * If the item does not exist, it will create one.
 */

const increment = (state: UseItemsState, key: number, value: number): UseItemsState => ({
  ...state,
  [key]: {
    ...(state[key] || {}),
    api_count: (state[key]?.api_count || 0) + value,
  },
})

/**
 * useitems reducer
 *
 * ATTENTION:
 * It should be noted that APIs on useitems are not complete, and its update may not be timely.
 * One should not expect the value to be always correct.
 */

const useitemsSlice = createSlice({
  name: 'useitems',
  initialState: {} as UseItemsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // info from login
      .addCase(createAPIGetMemberRequireInfoAction, (state, { payload }) => {
        const newState = indexify((payload.body.api_useitem || []) as UseItem[])
        return compareUpdate(pickExisting(state, newState), newState)
      })
      // info from login
      .addCase(createAPIGetMemberUseitemResponseAction, (state, { payload }) => {
        const newState = indexify<UseItem>(payload.body)
        return compareUpdate(pickExisting(state, newState), newState)
      })
      // item remodel consumption
      .addCase(createAPIReqKousyouRemodelSlotlistDetailResponseAction, (state, { payload }) => {
        const {
          api_req_useitem_id,
          api_req_useitem_num,
          api_req_useitem_id2,
          api_req_useitem_num2,
        } = payload.body

        let nextState = { ...state }

        // assume there's enough items
        if (api_req_useitem_id && api_req_useitem_num) {
          nextState = increment(nextState, api_req_useitem_id, -api_req_useitem_num)
        }
        if (api_req_useitem_id2 && api_req_useitem_num2) {
          nextState = increment(nextState, api_req_useitem_id2, -api_req_useitem_num2)
        }
        return compareUpdate(state, nextState)
      })
      // mission award
      .addCase(createAPIReqMissionResultResponseAction, (state, { payload }) => {
        const body = payload.body as {
          api_get_item1?: { api_useitem_id?: number; api_useitem_count?: number }
        }
        const { api_get_item1 } = body
        if (api_get_item1?.api_useitem_id != null && api_get_item1.api_useitem_id > 0) {
          return increment(
            state,
            api_get_item1.api_useitem_id,
            api_get_item1.api_useitem_count || 0,
          )
        }
        return state
      })
      // sortie award
      .addCase(createAPIReqCombinedBattleBattleresultResponseAction, (state, { payload }) => {
        const body = payload.body as {
          api_get_useitem?: { api_useitem_id?: number }
          api_get_exmap_useitem_id?: number
        }
        const { api_get_useitem, api_get_exmap_useitem_id } = body
        let nextState = { ...state }
        if (api_get_useitem?.api_useitem_id != null && api_get_useitem.api_useitem_id > 0) {
          nextState = increment(nextState, api_get_useitem.api_useitem_id, 1)
        }
        if (api_get_exmap_useitem_id != null && api_get_exmap_useitem_id > 0) {
          nextState = increment(nextState, api_get_exmap_useitem_id, 1)
        }
        return compareUpdate(state, nextState)
      })
      .addCase(createAPIReqSortieBattleResultResponseAction, (state, { payload }) => {
        const body = payload.body as {
          api_get_useitem?: { api_useitem_id?: number }
          api_get_exmap_useitem_id?: number
        }
        const { api_get_useitem, api_get_exmap_useitem_id } = body
        let nextState = { ...state }
        if (api_get_useitem?.api_useitem_id != null && api_get_useitem.api_useitem_id > 0) {
          nextState = increment(nextState, api_get_useitem.api_useitem_id, 1)
        }
        if (api_get_exmap_useitem_id != null && api_get_exmap_useitem_id > 0) {
          nextState = increment(nextState, api_get_exmap_useitem_id, 1)
        }
        return compareUpdate(state, nextState)
      })
  },
})

export const reducer = useitemsSlice.reducer
