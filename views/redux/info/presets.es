import { reduxSet, compareUpdate } from 'views/utils/tools'
import { omit } from 'lodash'

const initState = {
  api_max_num: 0,
  api_deck: {},
}

const reducer = (state = initState, action) => {
  const { type, body, postBody } = action
  switch (type) {
    case '@@Response/kcsapi/api_get_member/preset_deck':
      return {
        ...state,
        api_max_num: body.api_max_num,
        api_deck: compareUpdate(state.api_deck, body.api_deck, 3),
      }
    case '@@Response/kcsapi/api_req_hensei/preset_register': {
      const { api_preset_no } = body
      return {
        ...state,
        api_deck: reduxSet(state.api_deck, String(api_preset_no), body),
      }
    }
    case '@@Response/kcsapi/api_req_hensei/preset_delete': {
      const { api_preset_no } = postBody // it's a String
      return {
        ...state,
        api_deck: omit(state.api_deck, api_preset_no),
      }
    }
    case '@@Response/kcsapi/api_req_hensei/preset_order_change': {
      // This action is triggered by dragging one preset (api_preset_from)
      // to another preset position (api_preset_to).
      // Note that we are implementing as if both values may not exist, just to be safe.
      const { api_preset_from, api_preset_to } = postBody

      const vFrom = state.api_deck[api_preset_from]
      const vTo = state.api_deck[api_preset_to]

      if (!vFrom && !vTo) {
        // none
        return state
      }

      const newDeck = {...state.api_deck}

      if (vFrom) delete newDeck[api_preset_from]
      if (vTo) delete newDeck[api_preset_to]

      if (vFrom) {
         newDeck[api_preset_to] = {
          ...vFrom,
           api_preset_no: parseInt(api_preset_to, 10),
        }
      }

      if (vTo) {
        newDeck[api_preset_from] =  {
          ...vTo,
          api_preset_no: parseInt(api_preset_from, 10),
        }
      }

      return {...state, api_deck: newDeck}
    }
  }
  return state
}

export default reducer
