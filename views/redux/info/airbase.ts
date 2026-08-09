import type { APIAirBase } from 'kcsapi/api_get_member/mapinfo/response'
import type { APIBaseItem } from 'kcsapi/api_req_air_corps/change_deployment_base/response'

import { createSlice } from '@reduxjs/toolkit'
import { zip, findIndex, get, map, omit, unzip } from 'lodash'
import { trimArray, compareUpdate, constructArray } from 'views/utils/tools'

import {
  createAPIGetMemberMapinfoResponseAction,
  createAPIReqAirCorpsSetPlaneResponseAction,
  createAPIReqAirCorpsChangeNameResponseAction,
  createAPIReqAirCorpsSetActionResponseAction,
  createAPIReqAirCorpsSupplyResponseAction,
  createAPIReqAirCorpsCondRecoveryResponseAction,
  createAPIPortAirCorpsCondRecoveryWithTimerResponseAction,
  createAPIReqMapNextResponseAction,
  createAPIPortPortResponseAction,
  createAPIReqAirCorpsChangeDeploymentBaseResponseAction,
} from '../actions'

export interface AirBase extends Partial<APIAirBase> {
  api_maxhp?: number
  api_nowhp?: number
}

// Bases are addressed by (area, rid) in the API, but fall back to the 1-based
// base id as index when the base is not in state yet.
const findBaseIndex = (state: AirBase[], baseId: number | string, areaId: number | string) => {
  const index = findIndex(
    state,
    (squad) => squad.api_rid === +baseId && squad.api_area_id === +areaId,
  )
  return index === -1 ? +baseId - 1 : index
}

// Squadrons are indexed by api_squadron_id - 1 in state, but responses only
// carry the squadrons they touched.
const constructSquadrons = <T extends { api_squadron_id: number }>(planeInfo: T[]) =>
  constructArray(
    planeInfo.map((p) => p.api_squadron_id - 1),
    planeInfo,
  )

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
        const index = findBaseIndex(state, api_base_id, api_area_id)
        return compareUpdate(
          state,
          constructArray(
            [index],
            [
              {
                api_distance,
                api_plane_info: constructSquadrons(api_plane_info),
              },
            ],
          ),
          3,
        )
      })
      .addCase(createAPIReqAirCorpsCondRecoveryResponseAction, (state, { payload }) => {
        const { api_base_id, api_area_id } = payload.postBody
        const { api_distance, api_plane_info } = payload.body
        const index = findBaseIndex(state, api_base_id, api_area_id)
        return compareUpdate(
          state,
          constructArray(
            [index],
            [
              {
                api_distance,
                api_plane_info: constructSquadrons(api_plane_info),
              },
            ],
          ),
          3,
        )
      })
      .addCase(createAPIPortAirCorpsCondRecoveryWithTimerResponseAction, (state, { payload }) => {
        const { api_base_id, api_area_id } = payload.postBody
        const { api_result, api_distance, api_plane_info } = payload.body
        // Every field is optional on this endpoint; bail out unless it actually
        // reported recovered squadrons.
        if ((typeof api_result === 'number' && api_result !== 1) || !api_plane_info) {
          return state
        }
        const index = findBaseIndex(state, api_base_id, api_area_id)
        return compareUpdate(
          state,
          constructArray(
            [index],
            [
              {
                ...(api_distance ? { api_distance } : {}),
                api_plane_info: constructSquadrons(api_plane_info),
              },
            ],
          ),
          // One level deeper than the other air corps cases: this endpoint may
          // report a squadron partially, so merge per field instead of
          // replacing the whole squadron.
          4,
        )
      })
      .addCase(createAPIReqAirCorpsChangeDeploymentBaseResponseAction, (state, { payload }) => {
        const { api_area_id, api_base_id_src, api_base_id, api_item_id } = payload.postBody
        const { api_base_items } = payload.body
        // Err on the side of caution, few preconditions before updating.

        // Only two plane slots are supposed to be swapped.
        if (api_base_items.length !== 2) {
          return state
        }

        // Moving a plane equip from src slot to dst slot.
        const indexSrc = findBaseIndex(state, api_base_id_src, api_area_id)
        const indexDst = findBaseIndex(state, api_base_id, api_area_id)

        const squadronSrc = state[indexSrc]
        const squadronDst = state[indexDst]
        if (!squadronSrc || !squadronDst) {
          return state
        }

        // The equip in question should exist.
        if (
          findIndex(
            squadronSrc.api_plane_info || [],
            (squad) => squad.api_slotid === +api_item_id,
          ) === -1
        ) {
          return state
        }

        const [objSrc, objDst] = (() => {
          const [item0, item1] = api_base_items
          return item0.api_rid === +api_base_id_src ? [item0, item1] : [item1, item0]
        })()

        const convertItem = ({ api_distance, api_plane_info }: APIBaseItem) => ({
          api_distance,
          api_plane_info: constructSquadrons(api_plane_info || []),
        })

        return compareUpdate(
          state,
          constructArray([indexSrc, indexDst], map([objSrc, objDst], convertItem)),
          3,
        )
      })
      .addCase(createAPIReqAirCorpsChangeNameResponseAction, (state, { payload }) => {
        const { api_base_id, api_name, api_area_id } = payload.postBody
        const index = findBaseIndex(state, api_base_id, api_area_id)
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
        const update = zip(api_base_id.split(','), api_action_kind.split(',')).map(
          ([base_id, action_kind]) => {
            const index = findBaseIndex(state, Number(base_id ?? 0), api_area_id)
            return [index, { api_action_kind: Number(action_kind ?? 0) }] as [
              number,
              Partial<AirBase>,
            ]
          },
        )
        const [idx, values] = unzip(update) as [number[], Partial<APIAirBase>[]]
        return compareUpdate(state, constructArray(idx, values), 2)
      })
      .addCase(createAPIReqAirCorpsSupplyResponseAction, (state, { payload }) => {
        const { api_base_id, api_area_id } = payload.postBody
        const { api_plane_info } = payload.body
        const index = findBaseIndex(state, api_base_id, api_area_id)
        return compareUpdate(
          state,
          constructArray(
            [index],
            [
              {
                api_plane_info: constructSquadrons(api_plane_info),
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

            const index = (api_rid || 0) - 1
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

export const reducer = airBaseSlice.reducer
