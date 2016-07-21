import { createStore } from 'redux'
import { observer, observe } from 'redux-observers'
import { get, set } from 'lodash'

import { reducer as rootReducer, onConfigChange } from './redux'
import { saveQuestTracking, schedualDailyRefresh } from './redux/info/quests'
import { dispatchBattleResult } from './redux/battle'

const cachePosition = '_storeCache'
const targetPaths = ['const', 'info']
const storeCache = (function() {
  try {
    return JSON.parse(localStorage.getItem(cachePosition) || '{}')
  } catch (e) {
    return {}
  }
})()

//### Utils ###

function autoCacheObserver(store, path) {
  return observer(
    (state) => get(state, path),
    (dispatch, current, previous) => {
      set(storeCache, path, current)
      // TODO: Here's a potential performance problem where this setItem
      // will be called multiple times if more than one targetPath
      // is modified in one action.
      localStorage.setItem(cachePosition, JSON.stringify(storeCache))
    }
  )
}


//### Executing code ###

const store = createStore(rootReducer, storeCache)
window.dispatch = store.dispatch

//### Listeners and exports ###

window.getStore = (path) => {
  return get(store.getState(), path)
}

// Listen to config.set event
window.config.on('config.set', (path, value) => {
  const details = {
    path: path,
    value: Object.clone(value),
  }
  store.dispatch(onConfigChange(details))
})

// When any targetPath is modified, store it into localStorage
observe(store,
  targetPaths.map((path) => autoCacheObserver(store, path))
)

// Save quest tracking to the file when it changes
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

export default store
