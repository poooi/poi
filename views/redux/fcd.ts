import { createSlice } from '@reduxjs/toolkit'

import { createReplaceFCDAction, createUpdateFCDAction } from './actions/app'

// Route entry: [fromNode | null (start), toNode]
type MapRouteEntry = [string | null, string]

// Spot entry: [x, y, nodeType]
type MapSpotEntry = [number, number, string]

export interface FcdMapData {
  route: Record<`${number}` | number, MapRouteEntry>
  spots: Record<string, MapSpotEntry>
}

export type FcdMapState = Record<`${number}-${number}`, FcdMapData>
export interface FcdShipAvatarState {
  backs: Record<`${number}` | number, number>
  marginMagics: Record<`${number}` | number, { normal: number; damaged: number }>
}
export interface FcdShipTagState {
  color: string[]
  fleetname: {
    'zh-CN': string[]
    'zh-TW': string[]
    'en-US': string[]
    'ja-JP': string[]
  }
  mapname: string[]
}

export interface FcdState {
  version: Record<string, string>
  map?: FcdMapState
  shipavatar?: FcdShipAvatarState
  shiptag?: FcdShipTagState
}

export interface FcdValue<K extends keyof FcdState = keyof FcdState> {
  data?: FcdState[K]
  meta?: { name?: string; version?: string }
  path: K
}

const initState: FcdState = {
  version: {},
}

const fcdSlice = createSlice({
  name: 'fcd',
  initialState: initState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createUpdateFCDAction, (state, { payload }) => {
        if (payload.data && payload.meta) {
          const { name, version } = payload.meta
          if (name && version) {
            return Object.assign({}, state, {
              version: { ...state.version, [name]: version },
              [name]: payload.data,
            }) as FcdState
          }
        }
        return state
      })
      .addCase(createReplaceFCDAction, (state, { payload }) => {
        if (payload.path && payload.data) {
          return Object.assign({}, state, { [payload.path]: payload.data })
        }
        return state
      })
  },
})

export const reducer = fcdSlice.reducer
