reduceReducers = require 'reduce-reducers'

module.exports.reducer = reduceReducers(
  initAs([])
  ,
  listenToResponse('/kcsapi/api_get_member/mapinfo', 
    (state, {body}) -> indexify body
  ),
  listenToResponse('/kcsapi/api_req_map/select_eventmap_rank', 
    (state, {postBody: {api_maparea_id, api_map_no, api_rank}}) ->
      id = "#{api_maparea_id}#{api_map_no}"
      state = state.slice()
      state[id] = Object.assign {}, state[id], 
        api_selected_rank: api_rank
      state
  ),
)
