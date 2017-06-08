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
  }
  return state
}

export default reducer
