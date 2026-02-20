import type { APIMaphp } from 'kcsapi/api_req_map/select_eventmap_rank/response'

import { createSlice } from '@reduxjs/toolkit'
import { indexify, compareUpdate, pickExisting } from 'views/utils/tools'

import {
  createAPIGetMemberMapinfoResponseAction,
  createAPIReqMapSelectEventmapRankResponseAction,
  createAPIReqMapStartResponseAction,
} from '../actions'

export type Action =
  | ReturnType<typeof createAPIGetMemberMapinfoResponseAction>
  | ReturnType<typeof createAPIReqMapSelectEventmapRankResponseAction>
  | ReturnType<typeof createAPIReqMapStartResponseAction>
  | { type: string; body?: unknown; postBody?: unknown }

export interface MapEventInfo {
  api_selected_rank?: number
  api_gauge_num?: number
  api_gauge_type?: number
  api_max_maphp?: number
  api_now_maphp?: number
}

export interface MapInfo {
  api_id?: number
  api_eventmap?: MapEventInfo
}

export interface MapsState {
  [key: string]: MapInfo
}

function normalizeState(state: MapsState): MapsState {
  // Compatibility: old api arranges maps in array
  if (Array.isArray(state)) {
    const legacy = state satisfies unknown as MapInfo[]
    return indexify(legacy.filter((e) => e && e.api_id))
  }
  return state
}

const mapsSlice = createSlice({
  name: 'maps',
  initialState: {} as MapsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createAPIGetMemberMapinfoResponseAction, (state, { payload }) => {
        const normalized = normalizeState(state)
        const newState = indexify<MapInfo>(payload.body.api_map_info)
        // The 3rd arg shouldn't be 2, because defeated map has no defeat_count
        // and will remain its value in that case
        return pickExisting(compareUpdate(normalized, newState, 1), newState)
      })
      .addCase(createAPIReqMapSelectEventmapRankResponseAction, (state, { payload }) => {
        const normalized = normalizeState(state)
        const id = `${payload.postBody.api_maparea_id}${payload.postBody.api_map_no}`
        const maphp: APIMaphp = payload.body.api_maphp
        return compareUpdate(
          normalized,
          {
            [id]: {
              api_eventmap: {
                api_selected_rank: parseInt(payload.postBody.api_rank),
                api_gauge_num: Number(maphp.api_gauge_num),
                api_gauge_type: Number(maphp.api_gauge_type),
                api_max_maphp: Number(maphp.api_max_maphp),
                api_now_maphp: Number(maphp.api_now_maphp),
              },
            },
          },
          3,
        )
      })
      .addCase(createAPIReqMapStartResponseAction, (state, { payload }) => {
        const normalized = normalizeState(state)
        const { api_eventmap } = payload.body
        const id = `${payload.postBody.api_maparea_id}${payload.postBody.api_mapinfo_no}`
        if (api_eventmap) {
          const { api_max_maphp, api_now_maphp } = api_eventmap
          return compareUpdate(
            normalized,
            {
              [id]: {
                api_eventmap: {
                  api_max_maphp,
                  api_now_maphp,
                },
              },
            },
            3,
          )
        }
        return state
      })
  },
})

export const reducer = mapsSlice.reducer
