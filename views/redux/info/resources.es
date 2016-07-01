import reduceReducers from 'reduce-reducers'
import {pluck} from 'underscore'

// FORMAT
// 0: <Fuel>
// 1: <Ammo>
// 2: <Steel>
// 3: <Bauxite>
// 4: <Instant construction>
// 5: <Fast repair (bucket)>
// 6: <Development material>
// 7: <Improvement material>

function mergeArrayResources(state, arr) {
  state = state.slice()
  state.splice(0, arr.length, ...arr)
  return state
}

function addArrayResources(state, arr) {
  state = state.slice()
  arr.forEach((n, i) => {
    state[i] += n
  })
  return state
}

export function reducer(state=[], {type, body, postBody}) {
  switch (type) {
    case '@@Response/kcsapi/api_port/port':
      return pluck(body.api_material, 'api_value')
    case '@@Response/kcsapi/api_get_member/material':
      return pluck(body, 'api_value')
    case '@@Response/kcsapi/api_req_hokyu/charge':
    case '@@Response/kcsapi/api_req_kousyou/destroyship':
      return mergeArrayResources(state, body.api_material)
    case '@@Response/kcsapi/api_req_kousyou/createitem':
      return body.api_material
    case '@@Response/kcsapi/api_req_kousyou/remodel_slot':
      return body.api_after_material
    case '@@Response/kcsapi/api_req_kousyou/createship_speedchange':
      let lsc = getStore(`info.construct.${postBody.api_kdock_id-1}.api_large_flag`)
      state = state.slice()
      state[4] -= lsc ? 10 : 1
      return state
    case '@@Response/kcsapi/api_req_kousyou/destroyitem2':
      return addArrayResources(state, body.api_get_material)
    case '@@Response/kcsapi/api_req_nyukyo/start':
      if (body.api_highspeed != 1)
        return
      state = state.slice()
      state[5] -= 1
      return state
    case '@@Response/kcsapi/api_req_nyukyo/speedchange':
      state = state.slice()
      state[5] -= 1
      return state
    case '@@Response/kcsapi/api_req_air_corps/set_plane':
      if (body.api_after_bauxite) {
        state = state.slice()
        state[3] = body.api_after_bauxite
        state
      }
      break
    case '@@Response/kcsapi/api_req_air_corps/supply':
      state = state.slice()
      state[0] = body.api_after_fuel
      state[3] = body.api_after_bauxite
      return state
  }
  return state
}
