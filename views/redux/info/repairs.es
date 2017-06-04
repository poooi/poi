import { compareUpdate } from 'views/utils/tools'

// Preserved fields: api_id, api_member_id
const emptyRepair = {
  api_complete_time: 0,
  api_complete_time_str: '0',
  api_item1: 0,
  api_item2: 0,
  api_item3: 0,
  api_item4: 0,
  api_ship_id: 0,
  api_state: 0,
}

export function reducer(state=[], {type, body, postBody}) {
  switch (type) {
  case '@@Response/kcsapi/api_get_member/ndock':
    return compareUpdate(state, body)
  case '@@Response/kcsapi/api_port/port':
    return compareUpdate(state, body.api_ndock)
  case '@@Response/kcsapi/api_req_nyukyo/speedchange': {
    const {api_ndock_id} = postBody
    state = state.slice()
    state[api_ndock_id-1] = {
      ...state[api_ndock_id-1],
      ...emptyRepair,
    }
    state
  }
  }
  return state
}
