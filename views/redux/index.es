import {combineReducers} from 'redux'
import reduceReducers from 'reduce-reducers'

import {reducer as constReducer} from './const'
import {reducer as info} from './info'
import {reducer as sortie} from './sortie'
import {reducer as timers} from './timers'
import {reducer as config} from './config'
import {reducer as battle} from './battle'

// === Utils ===

window.indexify = (array, key='api_id') => {
  let keyFunc;
  if (typeof key === 'string') {
    keyFunc = (element) => element[key]
  } else {
    keyFunc = key
  }
  const result = {}
  array.forEach((e) => {
    result[keyFunc(e)] = e
  })
  return result
}


// === Root reducer ===

export const reducer = reduceReducers(
  combineReducers({
    const: constReducer,
    info,
    sortie,
    timers,
    config,
    battle,
  }),
)


// === Actions ===

export function onGameResponse({method, path, body, postBody}) {
  return {
    type: `@@Response${path}`,
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
