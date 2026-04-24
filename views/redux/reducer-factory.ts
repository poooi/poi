import type { Config } from 'views/env-parts/config'
import type { Plugin } from 'views/services/plugin-manager/utils'

import { mapValues, isEqual } from 'lodash'

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
  extensionConfig: Record<string, PoiReducer | null | undefined>,
): Record<string, PoiReducer> {
  return mapValues(extensionConfig, (func, key) => {
    if (func) {
      const wrappedReducer = combineReducers({ _: func })
      return (state = {}, action: { type: string }, store?: Record<string, unknown>) => {
        try {
          return wrappedReducer(state, action, store)
        } catch (e) {
          console.error(`Error in extension ${key}`, e instanceof Error ? e.stack : String(e))
          return state
        }
      }
    } else {
      return () => emptyObject
    }
  })
}

export function reducerFactory(
  extensionConfig?: Record<string, PoiReducer | null | undefined>,
): PoiReducer<RootState> {
  return combineReducers<RootState>({
    const: constReducer,
    info,
    sortie,
    timers,
    config,
    battle,
    misc,
    fcd,
    plugins: window.isMain ? plugins : () => emptyObject,
    layout: window.isMain ? layout : () => emptyObject,
    ui: window.isMain ? ui : () => emptyObject,
    ext: extensionConfig
      ? combineReducers(secureExtensionConfig(extensionConfig))
      : () => emptyObject,
    ipc,
    wctf,
  })
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
  return createConfigAction({ path, value })
}

// publish data changes to plugin windows
if (!window.isMain) {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === '_storeCache' && e.newValue) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const { fcd, wctf = {} } = JSON.parse(e.newValue) as {
        fcd: Record<string, unknown>
        wctf?: { lastModified?: unknown; version?: string }
      }
      for (const key of Object.keys(fcd)) {
        if (!isEqual(fcd[key], window.getStore(`fcd.${key}`))) {
          // eslint-disable-next-line no-console
          console.log(`Update ${key} from localStorage`)
          window.dispatch({
            type: '@@replaceFCD',
            value: {
              path: key,
              data: fcd[key],
            },
          })
        }
      }
      if (wctf.lastModified && wctf.lastModified !== window.getStore('wctf.lastModified')) {
        // eslint-disable-next-line no-console
        console.log(`Update wctf-db to ${wctf.version} from localstorage`)
        window.dispatch({
          type: '@@wctf-db-update',
          payload: wctf,
        })
      }
    }
  })
}
