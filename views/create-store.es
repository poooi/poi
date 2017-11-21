import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { observer, observe } from 'redux-observers'
import { get, set, debounce } from 'lodash'
import { remote } from 'electron'

import { middleware as promiseActionMiddleware } from './middlewares/promise-action'
import { reducerFactory, onConfigChange } from './redux'
import { saveQuestTracking, schedualDailyRefresh } from './redux/info/quests'
import { dispatchBattleResult } from './redux/battle'

const cachePosition = '_storeCache'
const targetPaths = ['const', 'info', 'fcd']
const storeCache = (function() {
  try {
    // clears store when in safe mode
    const item = !window.isSafeMode ? localStorage.getItem(cachePosition) : '{}'
    return JSON.parse(item || '{}')
  } catch (e) {
    return {}
  }
})()

//### Utils ###

const setLocalStorage = () => {
  if (!window.isMain) {
    return
  }
  process.nextTick(() => {
    localStorage.setItem(cachePosition, JSON.stringify(storeCache))
  })
}

const setLocalStorageDebounced = debounce(setLocalStorage, 5000)

function autoCacheObserver(store, path) {
  return observer(
    (state) => get(state, path),
    (dispatch, current, previous) => {
      set(storeCache, path, current)
      setLocalStorageDebounced()
    }
  )
}

remote.getCurrentWindow().on('close', (e) => {
  if (window.isMain) {
    localStorage.setItem(cachePosition, JSON.stringify(storeCache))
  }
})

//### Executing code ###

export const store = (window.dbg && window.dbg.isEnabled()) ?
  createStore(
    reducerFactory(),
    storeCache,
    compose(
      applyMiddleware(
        promiseActionMiddleware,
        thunk,
      ),
      window.devToolsExtension ? window.devToolsExtension() : f => f,
    )
  )
  :createStore(
    reducerFactory(),
    storeCache,
    compose(
      applyMiddleware(
        promiseActionMiddleware,
        thunk,
      ),
    )
  )
window.dispatch = store.dispatch

//### Listeners and exports ###

window.getStore = (path) => {
  return path ? get(store.getState(), path) : store.getState()
}

// Listen to config.set event
const solveConfSet = (path, value) => {
  const details = {
    path: path,
    value: typeof value === 'undefined' ? undefined : JSON.parse(JSON.stringify(value)),
  }
  store.dispatch(onConfigChange(details))
}
const config = remote.require('./lib/config')
config.addListener('config.set', solveConfSet)
window.addEventListener('unload', (e) => {
  config.removeListener('config.set', solveConfSet)
})

const ipc = remote.require('./lib/ipc')
ipc.on('update', action => store.dispatch(action))

// When any targetPath is modified, store it into localStorage
if (window.isMain)
  observe(store,
    targetPaths.map((path) => autoCacheObserver(store, path))
  )

// Save quest tracking to the file when it changes
if (window.isMain)
  observe(store, [observer(
    (state) => state.info.quests.records,
    (dispatch, current, previous) => saveQuestTracking(current)
  )])

schedualDailyRefresh(store.dispatch)

// Dispatch an action '@@BattleResult' when a battle is completed
observe(store, [observer(
  (state) => state.battle.result,
  dispatchBattleResult,
)])

// Use this function to extend extra reducers to the store, such as plugin
// specific data maintainance.
// Use extensionSelectorFactory(key) inside utils/selectors to access it.
export const extendReducer = (function () {
  let _reducerExtensions = {}

  return function (key, reducer) {
    const _reducerExtensionsNew = {
      ..._reducerExtensions,
      [key]: reducer,
    }
    try {
      store.replaceReducer(reducerFactory(_reducerExtensionsNew))
      _reducerExtensions = _reducerExtensionsNew
    } catch (e) {
      console.warn(`Reducer extension ${key} is not a valid reducer`, e.stack)
    }
  }
})()

window.config.get = (path, value) => {
  return get(window.getStore('config'), path, value)
}
