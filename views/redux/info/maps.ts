import { mapValues } from 'lodash'
import { indexify, compareUpdate, pickExisting } from 'views/utils/tools'

import { createSlice } from '@reduxjs/toolkit'
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
  api_max_maphp?: number
  api_now_maphp?: number
  [key: string]: unknown
}

export interface MapInfo {
  api_id?: number
  api_eventmap?: MapEventInfo
  [key: string]: unknown
}

export interface MapsState {
  [key: string]: MapInfo
}

function normalizeState(state: MapsState): MapsState {
  // Compatibility: old api arranges maps in array
  if (Array.isArray(state as unknown)) {
    return indexify((state as unknown as MapInfo[]).filter((e) => e && e.api_id))
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
        const newState = indexify(payload.body.api_map_info as unknown as MapInfo[])
        // The 3rd arg shouldn't be 2, because defeated map has no defeat_count
        // and will remain its value in that case
        return pickExisting(compareUpdate(normalized, newState, 1), newState)
      })
      .addCase(createAPIReqMapSelectEventmapRankResponseAction, (state, { payload }) => {
        const normalized = normalizeState(state)
        const id = `${payload.postBody.api_maparea_id}${payload.postBody.api_map_no}`
        return compareUpdate(
          normalized,
          {
            [id]: {
              api_eventmap: {
                api_selected_rank: parseInt(payload.postBody.api_rank),
                ...mapValues(payload.body.api_maphp as unknown as Record<string, unknown>, Number),
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
