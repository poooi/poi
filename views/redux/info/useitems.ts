import { indexify, compareUpdate, pickExisting } from 'views/utils/tools'

export interface UseItem {
  api_id?: number
  api_count?: number
  [key: string]: unknown
}

export interface UseItemsState {
  [key: string]: UseItem
}

interface Action {
  type: string
  body?: {
    api_useitem?: UseItem[]
    api_req_useitem_id?: number
    api_req_useitem_num?: number
    api_req_useitem_id2?: number
    api_req_useitem_num2?: number
    api_get_item1?: {
      api_useitem_id?: number
      api_useitem_count?: number
    }
    api_get_useitem?: {
      api_useitem_id?: number
    }
    api_get_exmap_useitem_id?: number
    [key: string]: unknown
  }
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
export const reducer = (state: UseItemsState = {}, action: Action): UseItemsState => {
  const { type, body = {} } = action
  switch (type) {
    // info from login
    case '@@Response/kcsapi/api_get_member/require_info': {
      const newState = indexify(body.api_useitem || [])
      return compareUpdate(pickExisting(state, newState), newState)
    }
    // info from login
    case '@@Response/kcsapi/api_get_member/useitem': {
      const newState = indexify(Array.isArray(body) ? body : [])
      return compareUpdate(pickExisting(state, newState), newState)
    }
    // item remodel consumption
    case '@@Response/kcsapi/api_req_kousyou/remodel_slotlist_detail': {
      const { api_req_useitem_id, api_req_useitem_num, api_req_useitem_id2, api_req_useitem_num2 } =
        body
      let nextState = { ...state }

      // assume there's enough items
      if (api_req_useitem_id && api_req_useitem_num) {
        nextState = increment(nextState, api_req_useitem_id, api_req_useitem_num)
      }
      if (api_req_useitem_id2 && api_req_useitem_num2) {
        nextState = increment(nextState, api_req_useitem_id2, api_req_useitem_num2)
      }
      return compareUpdate(state, nextState)
    }
    // mission award
    case '@@Response/kcsapi/api_req_mission/result': {
      const { api_get_item1 } = body
      if (api_get_item1?.api_useitem_id != null && api_get_item1.api_useitem_id > 0) {
        return increment(state, api_get_item1.api_useitem_id, api_get_item1.api_useitem_count || 0)
      }
      break
    }
    // sortie award
    case '@@Response/kcsapi/api_req_combined_battle/battleresult':
    case '@@Response/kcsapi/api_req_sortie/battleresult': {
      const { api_get_useitem, api_get_exmap_useitem_id } = body
      let nextState = { ...state }
      if (api_get_useitem?.api_useitem_id != null && api_get_useitem.api_useitem_id > 0) {
        nextState = increment(nextState, api_get_useitem.api_useitem_id, 1)
      }
      if (api_get_exmap_useitem_id != null && api_get_exmap_useitem_id > 0) {
        nextState = increment(nextState, api_get_exmap_useitem_id, 1)
      }
      return compareUpdate(state, nextState)
    }
    // item consumption on item interface
    // info for api_exchange_type is not self complete, not going to support
    case '@@Request/kcsapi/api_req_member/itemuse':
    case '@@Response/kcsapi/api_req_member/itemuse':
    default:
  }
  return state
}
