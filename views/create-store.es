import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { observer, observe } from 'redux-observers'
import { get, set, debounce, compact } from 'lodash'
import { remote } from 'electron'

import { middleware as promiseActionMiddleware } from './middlewares/promise-action'
import { reducerFactory, onConfigChange } from './redux'
import { saveQuestTracking, schedualDailyRefresh } from './redux/info/quests'
import { dockingCompleteObserver } from './redux/info/repairs'
import { dispatchBattleResult } from './redux/battle'

const cachePosition = '_storeCache'
const targetPaths = ['const', 'info', 'fcd', 'wctf']
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
  const storeContent = window.getStore.lock ? window.getStore.cache : store.getState()
  if (window.getStore.cache !== storeContent) {
    window.getStore.cache = storeContent
  } else if (window.dbg && window.dbg.isEnabled() && window.dbg.isExtraEnabled('deprecateWarning')) {
    console.warn(new Error('You should not call getStore() in reducer.'))
  }
  return path ? get(storeContent, path) : storeContent
}
window.getStore.cache = store.getState()

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

const clone = obj => JSON.parse(JSON.stringify(obj))
const ipc = remote.require('./lib/ipc')
if (!window.isMain) {
  store.dispatch({ type: '@@initIPC', content: clone(ipc.list()) })
}
ipc.on('update', action => store.dispatch(action))

observe(store, compact([
  // When any targetPath is modified, store it into localStorage
  ...(window.isMain ? targetPaths.map((path) => autoCacheObserver(store, path)) : []),

  // Save quest tracking to the file when it changes
  window.isMain && observer(
    (state) => state.info.quests.records,
    (dispatch, current, previous) => saveQuestTracking(current)
  ),

  // Dispatch an action '@@BattleResult' when a battle is completed
  observer(
    (state) => state.battle.result,
    dispatchBattleResult,
  ),

  // observe on docking status and send an action to update info.ships
  // when docking is done.
  dockingCompleteObserver,
]))

schedualDailyRefresh(store.dispatch)

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
