import type { ConfigInstance, ConfigStringPath, ConfigValue } from 'lib/config'
import type { DeepKeyOf, DeepValueOf } from 'shims/utils'

import * as remote from '@electron/remote'
import { get, set, debounce, compact, cloneDeep, isEqual } from 'lodash-es'
import { createStore, applyMiddleware, compose, type Store } from 'redux'
import { observer, observe } from 'redux-observers'
import thunk from 'redux-thunk'
import { isMain } from 'views/env-parts/const'
import { ipc } from 'views/env-parts/ipc'

import { dispatchBattleResult } from './battle'
import { saveQuestTracking, schedualDailyRefresh } from './info/quests'
import { dockingCompleteObserver } from './info/repairs'
import { equipsCrossSliceMiddleware } from './middlewares/equips-cross-slice'
import { questsCrossSliceMiddleware } from './middlewares/quests-cross-slice'
import { resourcesCrossSliceMiddleware } from './middlewares/resources-cross-slice'
import { shipsCrossSliceMiddleware } from './middlewares/ships-cross-slice'
import { reducerFactory, onConfigChange, type RootState } from './reducer-factory'

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

const cachePosition = '_storeCache'
const targetPaths = ['const', 'info', 'fcd', 'wctf']
const storeCache: Record<string, unknown> = (function () {
  try {
    // clears store when in safe mode
    const item = !window.isSafeMode ? localStorage.getItem(cachePosition) : '{}'
    const parsed: unknown = JSON.parse(item ?? '{}')
    return isRecord(parsed) ? parsed : {}
  } catch (_) {
    return {}
  }
})()

//### Utils ###

const setLocalStorage = (): void => {
  if (!isMain) {
    return
  }
  process.nextTick(() => {
    localStorage.setItem(cachePosition, JSON.stringify(storeCache))
  })
}

const setLocalStorageDebounced = debounce(setLocalStorage, 5000)

function autoCacheObserver(store: Store<RootState>, path: string) {
  return observer(
    (state: RootState) => get(state, path),
    (_dispatch: unknown, current: unknown) => {
      set(storeCache, path, current)
      setLocalStorageDebounced()
    },
  )
}

remote.getCurrentWindow().on('close', () => {
  if (isMain) {
    localStorage.setItem(cachePosition, JSON.stringify(storeCache))
  }
})

//### Executing code ###

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose
  }
}

const composeEnhancers =
  (window.dbg?.isEnabled() && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

// @ts-expect-error TS2589: Redux PreloadedState<RootState> recurses into DOM types via
// LayoutState.webview.ref (ExtendedWebviewTag extends HTMLElement); pre-existing issue.
export const store: Store<RootState> = createStore(
  reducerFactory(),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  storeCache as unknown as RootState,
  composeEnhancers(
    applyMiddleware(
      thunk,
      resourcesCrossSliceMiddleware,
      equipsCrossSliceMiddleware,
      shipsCrossSliceMiddleware,
      questsCrossSliceMiddleware,
    ),
  ),
)

//### Listeners and exports ###
export function getStore(): RootState
export function getStore<const Path extends DeepKeyOf<RootState>>(
  path: Path,
): DeepValueOf<RootState, Path>
export function getStore(path?: string): unknown {
  // cache and lock are used by the custom combineReducers polyfill
  if (getStore.lock) {
    const cached = getStore.cache
    const storeContent = isRecord(cached) ? cached : {}
    return path !== undefined ? get(storeContent, path) : storeContent
  }
  const storeStateRaw = store.getState()
  const storeContent = isRecord(storeStateRaw) ? (storeStateRaw as RootState) : undefined
  if (getStore.cache !== storeContent) {
    getStore.cache = storeContent
  }
  return path !== undefined ? get(storeContent, path) : storeContent
}
getStore.lock = undefined as boolean | undefined
getStore.cache = undefined as RootState | undefined
getStore.cache = store.getState()
export const dispatch = store.dispatch

// Listen to config.set event
const solveConfSet = <P extends ConfigStringPath>(path: P, value: ConfigValue<P>): void => {
  const details = {
    path,
    value: typeof value === 'undefined' ? undefined : cloneDeep(value),
  }
  store.dispatch(onConfigChange(details))
}
const remoteConfig: ConfigInstance = remote.require('./lib/config')
remoteConfig.addListener('config.set', solveConfSet)
window.addEventListener('unload', () => {
  remoteConfig.removeListener('config.set', solveConfSet)
})

if (!isMain) {
  store.dispatch({ type: '@@initIPC', content: ipc.list() })
}
ipc.on('update', (action: { type: string }) => store.dispatch(action))

observe(
  store,
  compact([
    // When any targetPath is modified, store it into localStorage
    ...(isMain ? targetPaths.map((path) => autoCacheObserver(store, path)) : []),

    // Save quest tracking to the file when it changes
    isMain &&
      observer(
        (state: RootState) => state.info.quests.records,
        (_dispatch, current) => {
          const { activeQuests } = getStore('info.quests')
          const admiralId = String(getStore('info.basic.api_member_id') ?? '')
          saveQuestTracking(current, activeQuests, admiralId)
        },
      ),

    // Dispatch an action '@@BattleResult' when a battle is completed
    observer(
      (state: RootState) => state.battle.result,
      (dispatch, current) => dispatchBattleResult(dispatch, current),
    ),

    // observe on docking status and send an action to update info.ships
    // when docking is done.
    dockingCompleteObserver,
  ]),
)

// publish data changes to plugin windows
if (!isMain) {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === '_storeCache' && e.newValue) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const { fcd, wctf = {} } = JSON.parse(e.newValue) as {
        fcd: Record<string, unknown>
        wctf?: { lastModified?: unknown; version?: string }
      }
      for (const key of Object.keys(fcd)) {
        if (!isEqual(fcd[key], get(getStore('fcd'), key))) {
          // eslint-disable-next-line no-console
          console.log(`Update ${key} from localStorage`)
          store.dispatch({
            type: '@@replaceFCD',
            value: {
              path: key,
              data: fcd[key],
            },
          })
        }
      }
      if (wctf.lastModified && wctf.lastModified !== getStore('wctf').lastModified) {
        // eslint-disable-next-line no-console
        console.log(`Update wctf-db to ${wctf.version} from localstorage`)
        store.dispatch({
          type: '@@wctf-db-update',
          payload: wctf,
        })
      }
    }
  })
}

schedualDailyRefresh(store.dispatch)

// Use this function to extend extra reducers to the store, such as plugin
// specific data maintainance.
// Use extensionSelectorFactory(key) inside utils/selectors to access it.
export const extendReducer = (function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _reducerExtensions: Record<string, any> = {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (key: string, reducer: any): void {
    const _reducerExtensionsNew = {
      ..._reducerExtensions,
      [key]: reducer,
    }
    try {
      store.replaceReducer(reducerFactory(_reducerExtensionsNew))
      _reducerExtensions = _reducerExtensionsNew
    } catch (e) {
      console.warn(
        `Reducer extension ${key} is not a valid reducer`,
        e instanceof Error ? e.stack : String(e),
      )
    }
  }
})()

declare global {
  interface Window {
    /**
     * @deprecated use import { getStore } from 'views/create-store' instead
     */
    getStore: typeof getStore
    /**
     * @deprecated use import { dispatch } from 'views/create-store' instead
     */
    dispatch: typeof store.dispatch
  }
}
/** @deprecated Use `import { getStore } from 'views/create-store'` instead */
window.getStore = getStore
/** @deprecated Use `import { dispatch } from 'views/create-store'` instead */
window.dispatch = store.dispatch
window.config.get = (path, value) => {
  if (path === '') {
    return getStore('config')
  }
  const config = getStore('config')
  return get(isRecord(config) ? config : {}, path, value)
}
