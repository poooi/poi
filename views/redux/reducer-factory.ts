import type { Config } from 'views/env'
import type { Plugin } from 'views/services/plugin-manager/utils'

import { mapValues } from 'lodash-es'

import { createConfigAction } from './actions'
import { reducer as battle, type BattleState } from './battle'
import { combineReducers, type PoiReducer } from './combine-reducers'
import { reducer as config } from './config'
import { reducer as constReducer, type ConstState } from './const'
import { reducer as fcd, type FcdState } from './fcd'
import { reducer as info, type InfoState } from './info'
import { reducer as ipc, type IpcState } from './ipc'
import { reducer as layout, type LayoutState } from './layout'
import misc, { type MiscState } from './misc'
import { reducer as plugins } from './plugins'
import { reducer as sortie, type SortieState } from './sortie'
import { reducer as timers, type TimersState } from './timers'
import { reducer as ui, type UiState } from './ui'
import { reducer as wctf, type WctfState } from './wctf'

const emptyObject = {}

/**
 * Root state shape of the Redux store.
 * `layout`, `ui`, and `plugins` are only populated in the main window;
 * they return `{}` in plugin windows.
 */
export interface RootState {
  const: ConstState
  info: InfoState
  sortie: SortieState
  timers: TimersState
  config: Config
  battle: BattleState
  misc: MiscState
  fcd: FcdState
  plugins: Plugin[]
  layout: LayoutState
  ui: UiState
  ext: Record<string, unknown>
  ipc: IpcState
  wctf: WctfState
}

function secureExtensionConfig(
  extensionConfig: Record<string, PoiReducer>,
): Record<string, PoiReducer> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return mapValues(extensionConfig, (func, key) => {
    if (func) {
      const wrappedReducer = combineReducers({ _: func })
      return (
        state: Record<string, unknown> = {},
        action: { type: string },
        store?: Record<string, unknown>,
      ) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          return wrappedReducer(state as { _: unknown }, action, store)
        } catch (e) {
          console.error(`Error in extension ${key}`, e instanceof Error ? e.stack : String(e))
          return state
        }
      }
    } else {
      return () => emptyObject
    }
  }) as Record<string, PoiReducer>
}

export function reducerFactory(
  extensionConfig?: Record<string, PoiReducer>,
): PoiReducer<RootState> {
  // RootState lacks a string index signature so it can't satisfy the combineReducers
  // constraint; cast at this store-construction boundary.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return combineReducers({
    const: constReducer,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    info: info as PoiReducer,
    sortie,
    timers,
    config,
    battle,
    misc,
    fcd,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    plugins: plugins as PoiReducer,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    layout: layout as PoiReducer,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    ui: ui as PoiReducer,
    ext: extensionConfig
      ? combineReducers(secureExtensionConfig(extensionConfig))
      : () => emptyObject,
    ipc,
    wctf,
  }) as PoiReducer<RootState>
}

// === Actions ===

interface GameActionPayload {
  method: string
  path: string
  body: unknown
  postBody: unknown
  time: number
}

export function onGameResponse({ method, path, body, postBody, time }: GameActionPayload): {
  type: string
  payload: GameActionPayload
  method: string
  path: string
  body: unknown
  postBody: unknown
  time: number
} {
  return {
    type: `@@Response${path}`,
    payload: {
      method,
      path,
      body,
      postBody,
      time,
    },
    method,
    path,
    body,
    postBody,
    time,
  }
}

interface RequestPayload {
  method: string
  path: string
  body: unknown
  time: number
}

export function onGameRequest({ method, path, body, time }: RequestPayload): {
  type: string
  payload: RequestPayload
  method: string
  path: string
  body: unknown
  time: number
} {
  return {
    type: `@@Request${path}`,
    payload: {
      method,
      path,
      body,
      time,
    },
    method,
    path,
    body,
    time,
  }
}

export function onConfigChange({
  path,
  value,
}: {
  path: string
  value: unknown
}): ReturnType<typeof createConfigAction> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return createConfigAction({ path, value: value as object })
}
