import reduceReducers from 'reduce-reducers'

const completeConstruction = {
  api_complete_time: 0,
  api_complete_time_str: '0',
  api_state: 3,
}

export function reducer(state=[], {type, body}) {
  switch (type) {
    case '@@Response/kcsapi/api_get_member/require_info':
    case '@@Response/kcsapi/api_get_member/kdock':
      return body.api_kdock
    case '@@Response/kcsapi/api_req_kousyou/getship':
      return body
    case '@@Response/kcsapi/api_req_kousyou/createship_speedchange':
      const {api_kdock_id} = postBody
      state = state.slice()
      state[api_kdock_id] = Object.assign({}, state[api_kdock_id], completeConstruction)
      return state
  }
  return state
}
