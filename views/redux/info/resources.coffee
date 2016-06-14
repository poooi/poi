reduceReducers = require 'reduce-reducers'
{pluck} = require 'underscore'

# FORMAT
# 0: <Fuel>
# 1: <Ammo>
# 2: <Steel>
# 3: <Bauxite>
# 4: <Instant construction>
# 5: <Fast repair (bucket)>
# 6: <Development material>
# 7: <Improvement material>

mergeArrayResources = (state, arr) -> 
  state = state.slice()
  state[0...arr.length] = arr
  state

addArrayResources = (state, arr) -> 
  state = state.slice()
  for n, i in arr
    state[i] += n
  state

module.exports.reducer = reduceReducers(
  initAs([])
  ,
  listenToResponse([
      '/kcsapi/api_get_member/material', 
      '/kcsapi/api_port/port', 
    ], (state, {path, body}) -> 
      if path == '/kcsapi/api_port/port'
        body = body.api_material
      pluck body, 'api_value'
  ),
  listenToResponse([
      '/kcsapi/api_req_hokyu/charge', 
      '/kcsapi/api_req_kousyou/destroyship', 
    ],
    (state, {body}) -> 
      mergeArrayResources state, body.api_material
  ),
  listenToResponse('/kcsapi/api_req_kousyou/createitem'
    (state, {body}) -> 
      body.api_material
  ),
  listenToResponse('/kcsapi/api_req_kousyou/remodel_slot'
    (state, {body}) -> 
      body.api_after_material
  ),
  listenToResponse('/kcsapi/api_req_kousyou/createship_speedchange', 
    (state, {postBody: {api_kdock_id}}) -> 
      lsc = getStore("info.construct.#{api_kdock_id-1}.api_large_flag")
      state = state.slice()
      state[4] -= if lsc then 10 else 1
      state
  ),
  listenToResponse('/kcsapi/api_req_kousyou/destroyitem2', 
    (state, {body}) -> 
      addArrayResources state, body.api_get_material
  ),
  listenToResponse([
      '/kcsapi/api_req_nyukyo/start', 
      '/kcsapi/api_req_nyukyo/speedchange',
    ], (state, {path, body}) -> 
      if path == '/kcsapi/api_req_nyukyo/start' &&
          parseInt(body.api_highspeed) != 1
        return
      state = state.slice()
      state[5] -= 1
      state
  ),
  listenToResponse('/kcsapi/api_req_air_corps/set_plane', 
    (state, {body: {api_after_bauxite}}) -> 
      if api_after_bauxite
        state = state.slice()
        state[3] = api_after_bauxite
        state
  ),
  listenToResponse('/kcsapi/api_req_air_corps/supply', 
    (state, {body: {api_after_fuel, api_after_bauxite}}) -> 
      state = state.slice()
      state[0] = api_after_fuel
      state[3] = api_after_bauxite
      state
  ),
)
