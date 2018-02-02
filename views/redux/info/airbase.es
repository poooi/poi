import { trimArray, buildArray, compareUpdate } from 'views/utils/tools'
import { zip, findIndex, get, map, omit } from 'lodash'

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
      const { api_f_maxhps, api_f_nowhps, api_air_base_attack } = api_destruction_battle
      const api_fdam = get(api_air_base_attack, 'api_stage3.api_fdam', [])
      return map(state, airbase => {
        const { api_area_id, api_rid } = airbase
        if (api_maparea_id !== api_area_id) {
          return airbase
        }

        const index = api_rid - 1
        const newBase = { ...airbase }

        if (get(api_f_maxhps, index) >= 0) {
          newBase.api_maxhp = api_f_maxhps[index]
        }

        if (get(api_f_nowhps, index) >= 0) {
          newBase.api_nowhp = api_f_nowhps[index] - get(api_fdam, index, 0)
        }

        return newBase
      })
    }
    break
  }
  case '@@Response/kcsapi/api_port/port': {
    return map(state, airbase =>
      (typeof airbase.api_nowhp !== 'undefined' || typeof airbase.api_maxhp !== 'undefined')
        ? omit(airbase, ['api_nowhp', 'api_maxhp'])
        : airbase
    )
  }
  }
  return state
}
