import reduceReducers from 'reduce-reducers'

export function reducer(state={}, {type, body}) {
  switch (type) {
    // Does this api still exist?
    case '@@Response/kcsapi/api_get_member/basic': 
      return Object.assign({}, state, body)
    case '@@Response/kcsapi/api_port/port':
    case '@@Response/kcsapi/api_get_member/require_info':
      return Object.assign({}, state, body.api_basic)
    case '@@Response/kcsapi/api_req_mission/result':
      return Object.assign({}, state, {
        api_level: body.api_member_lv,
      })
    case '@@Response/kcsapi/api_req_practice/battle_result': 
    case '@@Response/kcsapi/api_req_sortie/battleresult': 
      return Object.assign({}, state, {
        api_experience: body.api_member_exp,
        api_level: body.api_member_lv,
      })
  }
  return state;
}
