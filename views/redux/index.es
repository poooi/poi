import {combineReducers} from 'redux'
import reduceReducers from 'reduce-reducers'
import {isEqual, forEach} from 'lodash'

import {reducer as constReducer} from './const'
import {reducer as info} from './info'
import {reducer as sortie} from './sortie'
import {reducer as timers} from './timers'
import {reducer as config} from './config'
import {reducer as layout} from './layout'
import {reducer as battle} from './battle'
import {reducer as alert} from './alert'
import {reducer as plugins} from './plugins'

// === Utils ===

window.indexify = (array, key='api_id', useArray=false) => {
  let keyFunc
  if (typeof key === 'string') {
    keyFunc = (element) => element[key]
  } else {
    keyFunc = key
  }
  const result = useArray ? [] : {}
  array.forEach((e) => {
    result[keyFunc(e)] = e
  })
  return result
}

// Input: [[index, value], ...]
// Return: Array
window.buildArray = (pairs) => {
  const ret = []
  pairs.forEach(([index, value]=[]) => {
    if (!parseInt(index))
      return
    ret[index] = value
  })
  return ret
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

const copyIfSame = window.copyIfSame = (obj, to) => {
  // assert(typeof obj === 'object')
  if (obj === to)
    return Array.isArray(obj) ? obj.slice() : {...obj}
  return obj
}

// Return Object.assign(prevState, newState) until `depth` level, while
// keeping as many parts from prevState as possible. Neither state is modified
// in-place.
// By default `depth` == 1, and every property of the returned value will be the
// prevProperty if not mentioned in newState or `isEqual` to the corresponding,
// or o/w the newProperty as a whole. Therefore,
// - If you only provide one grand-property of a property, its other
//   grand-properties will be deleted.
// - If a property is updated, all its grand-properties will be new ones,
//   even if the grand-property itself isEqual.
const compareUpdate = window.compareUpdate = (prevState, newState, depth=1) => {
  if (typeof prevState !== typeof newState)
    return newState
  if (prevState === newState)
    return prevState
  if (depth == 0 || typeof depth !== 'number' || typeof prevState !== 'object') {
    return isEqual(prevState, newState) ? prevState : newState
  }
  const prevStateBackup = prevState
  // Update existing properties
  const nextDepth = depth - 1
  forEach(newState, (v, k) => {
    const newV = compareUpdate(prevState[k], v, nextDepth)
    // ATTENTION: Any null properties are ignored
    if (newV != null && prevState[k] !== newV) {
      prevState = copyIfSame(prevState, prevStateBackup)
      if (newV != null)
        prevState[k] = newV
    }
  })
  return prevState
}
/* TEST
function test(a, b, d) {
  const c = compareUpdate(a, b, d)
  console.log(c !== a, c)
}

test(2, 2)
// false 2
test({1:'a'},{2:'b'})
// true {"1":"a","2":"b"}
test({1:'a'},{1:'b'})
// true {"1":"b"}
test({1:'a'},{1:'a'})
// false {"1":"a"}
test({1:{1:2}},{1:{1:2}})
// false {"1":{"1":2}}
test({1:{1:[], 2:['g']}},{1:{1:[]}})
// true {"1":{"1":[]}}
test({1:{1:[], 2:['g']}},{1:{1:[]}}, 2)
// false {"1":{"1":[],"2":["g"]}}

let a=[]
a[1] = {1:2}
test([{1:1}],a)
// true [{"1":1},{"1":2}]

*/

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
    alert,
    plugins,
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
