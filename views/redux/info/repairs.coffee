reduceReducers = require 'reduce-reducers'

# Preserved fields: api_id, api_member_id
emptyRepair = 
  api_complete_time: 0,
  api_complete_time_str: "0",
  api_item1: 0,
  api_item2: 0,
  api_item3: 0,
  api_item4: 0,
  api_ship_id: 0,
  api_state: 0

module.exports.reducer = reduceReducers(
  initAs([])
  ,
  listenToResponse('/kcsapi/api_get_member/ndock', 
    (state, {body}) ->
      body
  ),
  listenToResponse('/kcsapi/api_port/port', 
    (state, {body}) ->
      body.api_ndock
  ),
  listenToResponse('/kcsapi/api_req_nyukyo/speedchange', 
    (state, {postBody: {api_ndock_id}}) ->
      repairs = state.slice()
      repairs[api_ndock_id-1] = Object.assign {}, repairs[api_ndock_id-1], emptyRepair
      repairs
  ),
)
