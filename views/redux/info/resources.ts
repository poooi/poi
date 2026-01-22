import { map, get } from 'lodash'

import { compareUpdate } from 'views/utils/tools'

// FORMAT
// 0: <Fuel>
// 1: <Ammo>
// 2: <Steel>
// 3: <Bauxite>
// 4: <Instant construction>
// 5: <Fast repair (bucket)>
// 6: <Development material>
// 7: <Improvement material>

export type ResourcesState = number[]

interface Action {
  type: string
  body?: {
    api_material?: { api_value: number }[] | number[]
    api_after_material?: number[]
    api_get_material?: number[]
    api_after_bauxite?: number
    api_after_fuel?: number
  }
  postBody?: {
    api_highspeed?: string | number
    api_item1?: string | number
    api_item2?: string | number
    api_item3?: string | number
    api_item4?: string | number
    api_item5?: string | number
    api_kdock_id?: string | number
    api_ship_id?: string | number
  }
}

interface Store {
  info?: {
    constructions?: { api_item1?: number }[]
    ships?: {
      [key: string]: {
        api_ndock_item?: [number, number]
      }
    }
  }
}

function addArrayResources(state: ResourcesState, arr: number[]): ResourcesState {
  const newState = state.slice()
  arr.forEach((n, i) => {
    newState[i] += n
  })
  return newState
}

export function reducer(
  state: ResourcesState = [],
  { type, body, postBody }: Action,
  store?: Store,
): ResourcesState {
  switch (type) {
    case '@@Response/kcsapi/api_port/port':
      return compareUpdate(state, map(body.api_material, 'api_value'))
    case '@@Response/kcsapi/api_get_member/material':
      return compareUpdate(state, map(body, 'api_value'))
    case '@@Response/kcsapi/api_req_hokyu/charge':
    case '@@Response/kcsapi/api_req_kousyou/destroyship':
      // These apis give only 4 resources
      return compareUpdate(state, body.api_material)
    case '@@Response/kcsapi/api_req_kousyou/createitem':
      return compareUpdate(state, body.api_material)
    case '@@Response/kcsapi/api_req_kousyou/remodel_slot':
      return compareUpdate(state, body.api_after_material)
    case '@@Response/kcsapi/api_req_kousyou/createship': {
      const newState = state.slice()
      if (parseInt(postBody.api_highspeed) > 0) {
        const lsc = parseInt(postBody.api_item1) > 1000
        newState[4] -= lsc ? 10 : 1
      }
      newState[0] -= parseInt(postBody.api_item1)
      newState[1] -= parseInt(postBody.api_item2)
      newState[2] -= parseInt(postBody.api_item3)
      newState[3] -= parseInt(postBody.api_item4)
      newState[6] -= parseInt(postBody.api_item5)
      return newState
    }
    case '@@Response/kcsapi/api_req_kousyou/createship_speedchange': {
      // There's no large ship construction flag in kdock, judge by resources
      const item1 = get(store, `info.constructions.${postBody.api_kdock_id - 1}.api_item1`)
      const lsc = item1 > 1000
      const newState = state.slice()
      newState[4] -= lsc ? 10 : 1
      return newState
    }
    case '@@Response/kcsapi/api_req_kousyou/destroyitem2':
      return addArrayResources(state, body.api_get_material)
    case '@@Response/kcsapi/api_req_nyukyo/start': {
      const [fuel, steel] = get(store, `info.ships.${postBody.api_ship_id}.api_ndock_item`)
      state = state.slice()
      state[0] -= fuel
      state[2] -= steel
      if (postBody.api_highspeed == 1) state[5] -= 1
      return state
    }
    case '@@Response/kcsapi/api_req_nyukyo/speedchange':
      state = state.slice()
      state[5] -= 1
      return state
    case '@@Response/kcsapi/api_req_air_corps/set_plane':
      if (body.api_after_bauxite) {
        state = state.slice()
        state[3] = body.api_after_bauxite
        return state
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
