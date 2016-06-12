reduceReducers = require 'reduce-reducers'

module.exports.reducer = reduceReducers(
  initAs({})
  ,
  # Does this api still exist?
  listenToResponse('/kcsapi/api_get_member/basic', 
    (state, {body}) ->
      Object.assign {}, state, body
  ),
  listenToResponse([
      '/kcsapi/api_port/port', 
      '/kcsapi/api_get_member/require_info', 
    ], 
    (state, {body: {api_basic}}) -> 
      Object.assign {}, api_basic 
  ),
  listenToResponse('/kcsapi/api_req_mission/result',
    (state, {body}) -> 
      Object.assign {}, state,
        api_level: body.api_member_lv
  ),
  listenToResponse([
      '/kcsapi/api_req_practice/battle_result', 
      '/kcsapi/api_req_sortie/battleresult',
    ], (state, {body}) -> 
      Object.assign {}, state,
        api_experience = body.api_member_exp
        api_level = body.api_member_lv
  ),
)
