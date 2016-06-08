reduceReducers = require 'reduce-reducers'

module.exports.reducer = reduceReducers(
  initAs({})
  ,
  listenToResponse('/kcsapi/api_get_member/basic', 
    (state, {body}) ->
      Object.assign {}, state, 
        teitokuLv: body.api_level
        nickName: body.api_nickname
        nickNameId: body.api_nickname_id
        teitokuExp: body.api_experience
        teitokuId: body.api_member_id
  ),
  listenToResponse('/kcsapi/api_port/port', 
    (state, {body}) -> 
      if body.api_basic?
        Object.assign {}, state, 
          teitokuLv: body.api_level
          nickName: body.api_nickname
          nickNameId: body.api_nickname_id
          teitokuExp: body.api_experience
  ),
  listenToResponse('/kcsapi/api_get_member/require_info', 
    (state, {body}) -> 
      if body.api_basic?
        Object.assign {}, state, 
          teitokuId: body.api_basic.api_member_id
  ),
  listenToResponse('/kcsapi/api_req_mission/result',
    (state, {body}) -> 
      Object.assign {}, state,
        teitokuLv: body.api_member_lv
  ),
  listenToResponse([
      '/kcsapi/api_req_practice/battle_result', 
      '/kcsapi/api_req_sortie/battleresult',
    ], (state, {body}) -> 
      Object.assign {}, state,
        teitokuExp = body.api_member_exp
        teitokuLv = body.api_member_lv
  ),
)
