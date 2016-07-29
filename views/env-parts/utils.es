import { isEqual, forEach, keyBy } from 'lodash'

Object.clone = (obj) =>
  JSON.parse(JSON.stringify(obj))
Object.remoteClone = (obj) =>
  JSON.parse(window.remote.require('./lib/utils').remoteStringify(obj))

function pad(n) {
  return n < 10 ? `0${n}` : n
}
window.resolveTime = (seconds) => {
  seconds = parseInt(seconds)
  if (seconds >= 0) {
    const s = seconds % 60
    const m = Math.trunc(seconds / 60) % 60
    const h = Math.trunc(seconds / 3600)
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  } else {
    return ''
  }
}
window.timeToString = (milliseconds) => {
  const date = new Date(milliseconds)
  return date.toTimeString().slice(0, 8)  // HH:mm:ss
}

// Input: [[index, value], ...]
// Return: Array
window.buildArray = (pairs) => {
  const ret = []
  pairs.forEach(([index, value]=[]) => {
    index = parseInt(index)
    if (isNaN(index) || index < 0)
      return
    ret[index] = value
  })
  return ret
}

// Not sure where this function should go, leave it here just for now, for easy access.
window.getCondStyle = (cond) => {
  let s = 'poi-ship-cond-'
  if (cond > 52)
    s += '53'
  else if (cond > 49)
    s += '50'
  else if (cond == 49)
    s += '49'
  else if (cond > 39)
    s += '40'
  else if (cond > 29)
    s += '30'
  else if (cond > 19)
    s += '20'
  else
    s += '0'
  s += window.isDarkTheme ? ' dark' : ' light'
  return s
}

window.pickId = (collection={}, keys) => {
  const res = {}
  keys.forEach((key) => {
    res[key] = collection[key]
  })
  return res
}

window.indexify = (array, key='api_id') => {
  return keyBy(array, key)
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

// Remove properties in `state` that no longer exist in `body`.
// Both `state` and `body` are objects, and only keys are compared.
window.pickExisting = (state, body) => {
  const stateBackup = state
  forEach(state, (v, k) => {
    if (!(k in body)) {
      state = copyIfSame(state, stateBackup)
      delete state[k]
    }
  })
  return state
}
