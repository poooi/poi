import {combineReducers} from 'redux'
import reduceReducers from 'reduce-reducers'
import {isEqual} from 'lodash'

import {reducer as constReducer} from './const'
import {reducer as info} from './info'
import {reducer as sortie} from './sortie'
import {reducer as timers} from './timers'
import {reducer as config} from './config'
import {reducer as layout} from './layout'
import {reducer as battle} from './battle'

// === Utils ===

window.indexify = (array, key='api_id') => {
  let keyFunc
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

window.reduxSet = (obj, path, val) => {
  const [prop, ...restPath] = path
  if (typeof prop === 'undefined') {
    if (!isEqual(obj, val))
      return val
    else
      return obj
  }
  let before
  if (prop in obj) {
    before = obj[prop]
  } else {
    before = {}
  }
  const after = window.reduxSet(before, restPath, val)
  if (after !== before) {
    let result
    if (Array.isArray(obj)) {
      result = obj.slice()
      result[prop] = after
    } else {
      result = {
        ...obj,
        [prop]: after,
      }
    }
    return result
  }
  return obj
}


// === Root reducer ===

export const reducer = reduceReducers(
  combineReducers({
    const: constReducer,
    info,
    sortie,
    timers,
    config,
    layout,
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
