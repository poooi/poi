const completeConstruction = {
  api_complete_time: 0,
  api_complete_time_str: '0',
  api_state: 3,
}

export function reducer(state=[], {type, body, postBody}) {
  switch (type) {
  case '@@Response/kcsapi/api_get_member/require_info':
  case '@@Response/kcsapi/api_req_kousyou/getship':
    return body.api_kdock
  case '@@Response/kcsapi/api_get_member/kdock':
    return body
  case '@@Response/kcsapi/api_req_kousyou/createship_speedchange': {
    const {api_kdock_id} = postBody
    const dockId = parseInt(api_kdock_id, 10)
    const newState = state.slice()
    newState[dockId - 1] = Object.assign({}, newState[dockId - 1], completeConstruction)
    return newState
  }
  }
  return state
}
