reduceReducers = require 'reduce-reducers'

completeConstruction = 
  api_complete_time: 0,
  api_complete_time_str: "0",
  api_state: 3

module.exports.reducer = reduceReducers(
  initAs([])
  ,
  listenToResponse([
      '/kcsapi/api_get_member/require_info',
      '/kcsapi/api_get_member/kdock',
      '/kcsapi/api_req_kousyou/getship',
    ], (state, {path, body}) ->
      if path in ['/kcsapi/api_get_member/require_info', 
          '/kcsapi/api_req_kousyou/getship']
        body = body.api_kdock
      body
  ),
  listenToResponse('/kcsapi/api_req_kousyou/createship_speedchange',
    (state, {postBody: {api_kdock_id}}) ->
      state = state.slice()
      state[api_kdock_id] = Object.assign {}, state[api_kdock_id], completeConstruction
      state
  ),
)
