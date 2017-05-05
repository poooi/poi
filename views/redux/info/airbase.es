import { trimArray } from 'views/utils/tools'
import { zip, findIndex, get } from 'lodash'
const { buildArray, compareUpdate } = window

export default function reducer(state=[], {type, body, postBody}) {
  switch (type) {
  case '@@Response/kcsapi/api_get_member/mapinfo': {
    const airbase = body.api_air_base
    if (typeof airbase === 'undefined') {
      return state
    }
    return trimArray(compareUpdate(state, airbase, 3), airbase)
  }
  case '@@Response/kcsapi/api_req_air_corps/set_plane': {
    const {api_base_id, api_area_id} = postBody
    const {api_distance, api_plane_info} = body
    const baseIndex = findIndex(state,
      squad => squad.api_rid == api_base_id && squad.api_area_id == api_area_id
    )
    const index = baseIndex === -1 ? api_base_id - 1 : baseIndex
    const squadrons = buildArray(api_plane_info.map((p) => [p.api_squadron_id-1, p]))
    return compareUpdate(state, buildArray(index, {
      api_distance,
      api_plane_info: squadrons,
    }), 3)
  }
  case '@@Response/kcsapi/api_req_air_corps/change_name': {
    const {api_base_id, api_name, api_area_id} = postBody
    const baseIndex = findIndex(state,
      squad => squad.api_rid == api_base_id && squad.api_area_id == api_area_id
    )
    const index = baseIndex === -1 ? api_base_id - 1 : baseIndex
    return compareUpdate(state, buildArray(index, {
      api_name,
    }), 2)
  }
  case '@@Response/kcsapi/api_req_air_corps/set_action': {
    const {api_action_kind, api_base_id, api_area_id} = postBody
    const update = zip(api_base_id.split(','), api_action_kind.split(',')).map(
      ([base_id, action_kind]) => {
        const baseIndex = findIndex(state,
          squad => squad.api_rid == base_id && squad.api_area_id == api_area_id
        )
        const index = baseIndex === -1 ? base_id - 1 : baseIndex
        return [index, {api_action_kind: parseInt(action_kind)}]
      }
    )
    return compareUpdate(state, buildArray(update), 2)
  }
  case '@@Response/kcsapi/api_req_air_corps/supply': {
    const {api_base_id, api_area_id} = postBody
    const {api_plane_info} = body
    const baseIndex = findIndex(state,
      squad => squad.api_rid == api_base_id && squad.api_area_id == api_area_id
    )
    const index = baseIndex === -1 ? api_base_id - 1 : baseIndex
    const squadrons = buildArray(api_plane_info.map((p) => [p.api_squadron_id-1, p]))
    return compareUpdate(state, buildArray(index, {
      api_plane_info: squadrons,
    }), 3)
  }
  case '@@Response/kcsapi/api_req_map/next': {
    const { api_destruction_battle, api_maparea_id } = body
    if (api_destruction_battle) {
      const { api_maxhps, api_nowhps, api_air_base_attack } = api_destruction_battle
      const api_fdam = get(api_air_base_attack, 'api_stage3.api_fdam', [])
      let newState = [...state]
      for (let i = 0; i < state.length; i++) {
        const { api_area_id, api_rid } = state[i]
        let airbase = {
          ...state[i],
        }
        if (api_maparea_id === api_area_id && api_maxhps[api_rid] != null && api_maxhps[api_rid] >= 0) {
          airbase = {
            ...airbase,
            api_maxhp: api_maxhps[api_rid],
          }
        }
        if (api_maparea_id === api_area_id && api_nowhps[api_rid] != null && api_nowhps[api_rid] >= 0) {
          airbase = {
            ...airbase,
            api_nowhp: api_nowhps[api_rid] - (api_fdam[api_rid] >= 0 ? api_fdam[api_rid] : 0),
          }
        }
        newState = [
          ...newState.slice(0, i),
          airbase,
          ...newState.slice(i + 1, newState.length),
        ]
      }
      return newState
    }
    break
  }
  case '@@Response/kcsapi/api_port/port': {
    let newState = [...state]
    for (let i = 0; i < state.length; i++) {
      const airbase = {
        ...state[i],
      }
      if (airbase.api_nowhp != null || airbase.api_maxhp != null) {
        delete airbase.api_nowhp
        delete airbase.api_maxhp
        newState = [
          ...newState.slice(0, i),
          airbase,
          ...newState.slice(i + 1, newState.length),
        ]
      }
    }
    return newState
  }
  }
  return state
}
