import type { SelectorTables } from 'views/utils/game-selector/tables'

import { createSlice } from '@reduxjs/toolkit'

import type { QuestGoalTable } from './info/quests/types'

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
    // the UI looks up fleetname by the current i18n language, which can be any
    // locale string; only the four locales below are guaranteed to exist
    [language: string]: string[] | undefined
    'zh-CN': string[]
    'zh-TW': string[]
    'en-US': string[]
    'ja-JP': string[]
  }
  mapname: string[]
}

/**
 * Tables the game hardcodes in main.js, shipped over fcd so they can be
 * corrected without a poi release. Partial: anything omitted falls back to the
 * built-in defaults in views/utils/game-selector/tables.
 */
export type FcdGameSelectorState = Partial<SelectorTables>

/**
 * Quest goal definitions, shipped over fcd so a new or corrected quest can be
 * tracked without a poi release. Partial: quest ids omitted here keep the
 * definition bundled in `assets/data/quest_goal.cson`, which stays the fallback
 * and the source this payload is generated from.
 */
export type FcdQuestGoalState = QuestGoalTable

export interface FcdState {
  version: Record<string, string>
  map?: FcdMapState
  shipavatar?: FcdShipAvatarState
  shiptag?: FcdShipTagState
  gameselector?: FcdGameSelectorState
  questgoal?: FcdQuestGoalState
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
