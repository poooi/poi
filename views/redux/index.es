import { combineReducers } from 'redux'

import { reducer as constReducer } from './const'
import { reducer as info } from './info'
import { reducer as sortie } from './sortie'
import { reducer as timers } from './timers'
import { reducer as config } from './config'
import { reducer as layout } from './layout'
import { reducer as battle } from './battle'
import { reducer as alert } from './alert'
import { reducer as plugins } from './plugins'
import misc from './misc'

// === Utils ===

// === Root reducer ===

export function reducerFactory(extensionConfig) {
  return combineReducers({
    const: constReducer,
    info,
    sortie,
    timers,
    config,
    layout,
    battle,
    alert,
    plugins,
    misc,
    ext: extensionConfig ? combineReducers(extensionConfig) : (() => ({})),
  })
}

// === Actions ===

export function onGameResponse({method, path, body, postBody}) {
  return {
    type: `@@Response${path}`,
    method,
    path,
    body,
    postBody,
  }
}

export function onGameRequest({method, path, body}) {
  return {
    type: `@@Request${path}`,
    method,
    path,
    body,
  }
}

export function onConfigChange({path, value}) {
  return {
    type: `@@Config`,
    path,
    value,
  }
}
