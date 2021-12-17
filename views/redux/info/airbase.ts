import { trimArray, compareUpdate, constructArray } from 'views/utils/tools'
import { zip, findIndex, get, map, omit, unzip } from 'lodash'
import { createSlice } from '@reduxjs/toolkit'
import { APIAirBase } from 'kcsapi/api_get_member/mapinfo/response'

import {
  createAPIGetMemberMapinfoResponseAction,
  createAPIReqAirCorpsSetPlaneResponseAction,
  createAPIReqAirCorpsChangeNameResponseAction,
  createAPIReqAirCorpsSetActionResponseAction,
  createAPIReqAirCorpsSupplyResponseAction,
  createAPIReqMapNextResponseAction,
  createAPIPortPortResponseAction,
} from '../actions'

export interface AirBase extends Partial<APIAirBase> {
  api_maxhp?: number
  api_nowhp?: number
}

const airBaseSlice = createSlice({
  name: 'airbase',
  initialState: [] as AirBase[],
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIGetMemberMapinfoResponseAction, (state, { payload }) => {
        const airbase = payload.body.api_air_base
        if (typeof airbase === 'undefined') {
          return state
        }
        return trimArray(compareUpdate(state, airbase, 3), airbase)
      })
      .addCase(createAPIReqAirCorpsSetPlaneResponseAction, (state, { payload }) => {
        const { api_base_id, api_area_id } = payload.postBody
        const { api_distance, api_plane_info } = payload.body
        const baseIndex = findIndex(
          state,
          (squad) => squad.api_rid === +api_base_id && squad.api_area_id === +api_area_id,
        )
        const index = baseIndex === -1 ? +api_base_id - 1 : baseIndex
        const squadrons = constructArray(
          api_plane_info.map((p) => p.api_squadron_id - 1),
          api_plane_info,
        )
        return compareUpdate(
          state,
          constructArray(
            [index],
            [
              {
                api_distance,
                api_plane_info: squadrons,
              },
            ],
          ),
          3,
        )
      })
      .addCase(createAPIReqAirCorpsChangeNameResponseAction, (state, { payload }) => {
        const { api_base_id, api_name, api_area_id } = payload.postBody
        const baseIndex = findIndex(
          state,
          (squad) => squad.api_rid === +api_base_id && squad.api_area_id === +api_area_id,
        )
        const index = baseIndex === -1 ? +api_base_id - 1 : baseIndex
        return compareUpdate(
          state,
          constructArray(
            [index],
            [
              {
                api_name,
              },
            ],
          ),
          2,
        )
      })
      .addCase(createAPIReqAirCorpsSetActionResponseAction, (state, { payload }) => {
        const { api_action_kind, api_base_id, api_area_id } = payload.postBody
        const update = (
          zip(api_base_id.split(','), api_action_kind.split(',')) as [string, string][]
        ).map(([base_id, action_kind]) => {
          const baseIndex = findIndex(
            state,
            (squad) => squad.api_rid === +base_id && squad.api_area_id === +api_area_id,
          )
          const index = baseIndex === -1 ? +base_id - 1 : baseIndex
          return [index, { api_action_kind: parseInt(action_kind) }]
        })
        const [idx, values] = unzip(update) as [number[], Partial<APIAirBase>[]]
        return compareUpdate(state, constructArray(idx, values), 2)
      })
      .addCase(createAPIReqAirCorpsSupplyResponseAction, (state, { payload }) => {
        const { api_base_id, api_area_id } = payload.postBody
        const { api_plane_info } = payload.body
        const baseIndex = findIndex(
          state,
          (squad) => squad.api_rid === +api_base_id && squad.api_area_id === +api_area_id,
        )
        const index = baseIndex === -1 ? +api_base_id - 1 : baseIndex
        const squadrons = constructArray(
          api_plane_info.map((p) => p.api_squadron_id - 1),
          api_plane_info,
        )
        return compareUpdate(
          state,
          constructArray(
            [index],
            [
              {
                api_plane_info: squadrons,
              },
            ],
          ),
          3,
        )
      })
      .addCase(createAPIReqMapNextResponseAction, (state, { payload }) => {
        const { api_destruction_battle, api_maparea_id } = payload.body
        if (api_destruction_battle) {
          const { api_f_maxhps, api_f_nowhps, api_air_base_attack } = api_destruction_battle
          const parsed_api_air_base_attack =
            typeof api_air_base_attack === 'string'
              ? JSON.parse(api_air_base_attack)
              : api_air_base_attack
          const api_fdam = get(parsed_api_air_base_attack, 'api_stage3.api_fdam', [])
          return map(state, (airbase) => {
            const { api_area_id, api_rid } = airbase
            if (api_maparea_id !== api_area_id) {
              return airbase
            }

            const index = api_rid! - 1
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
      })
      .addCase(createAPIPortPortResponseAction, (state) => {
        return map(state, (airbase) =>
          typeof airbase.api_nowhp !== 'undefined' || typeof airbase.api_maxhp !== 'undefined'
            ? omit(airbase, ['api_nowhp', 'api_maxhp'])
            : airbase,
        )
      })
  },
})

const reducer = airBaseSlice.reducer

export default reducer
