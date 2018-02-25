/*
 * This file contains utility functions that is unrelated to the game mechanism.
 */

import _, { isEqual, forEach, keyBy, zip, unzip, sum, isString, toString } from 'lodash'
import path from 'path'
import { readJsonSync } from 'fs-extra'
import url from 'url'

// For a given array, sum up each position of the subarray respectively.
// Args:
//   arr - [ [ number ] ]
// Returns:
//   [ sum(arr[..][0]), sum(arr[..][1]), ... ]
export function arraySum(arr) {
  return unzip(arr).map(sum)
}

export function arrayMultiply(arr, n) {
  return arr.map((i) => i * n)
}

// Args:
//   arr - Array
//   n   - number or Array
export function arrayAdd(arr, n) {
  if (Array.isArray(n)) {
    return zip(arr, n).map(([a, b]) => a+b)
  } else {
    return arr.map((i) => i + n)
  }
}

// Args:
//   arr - Array
//   n   - number or Array
export function arraySubstract(arr, n) {
  if (Array.isArray(n)) {
    return zip(arr, n).map(([a, b]) => a-b)
  } else {
    return arr.map((i) => i - n)
  }
}

export function between(n, min, max) {
  return n >= min && n <= max
}

// Input:
//   buildArray(index, value)
//     index := Integer
//     value := anything
//   buildArray(pairs)
//     pairs := [[index, value], ...]
// Return: Array
// Example:
//   a = buildArray(1, 'abc')   // [undefined x 1, "abc"]
//   a[1]       // "abc"
//   0 in a     // false
export function buildArray(pairsOrIdx, _value) {
  let pairs
  if (Array.isArray(pairsOrIdx))
    pairs = pairsOrIdx
  else
    pairs = [[pairsOrIdx, _value]]
  const ret = []
  pairs.forEach(([index, value]=[]) => {
    index = parseInt(index)
    if (isNaN(index) || index < 0)
      return
    ret[index] = value
  })
  return ret
}

export function indexify(array, key='api_id') {
  return keyBy(array, key)
}

export function copyIfSame(obj, to) {
  // assert(typeof obj === 'object')
  if (obj === to)
    return Array.isArray(obj) ? obj.slice() : {...obj}
  return obj
}

// Remove properties in `state` that no longer exist in `body`.
// Both `state` and `body` are objects, and only keys are compared.
export function pickExisting(state, body) {
  const stateBackup = state
  forEach(state, (v, k) => {
    if (!(k in body)) {
      state = copyIfSame(state, stateBackup)
      delete state[k]
    }
  })
  return state
}

// Similar to lodash.set, but if the value needs updating, each object along
// its path will be shallow-copied instead of modified in-place, therefore
// complying with the regulation of redux.
export function reduxSet(obj, path, val) {
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
  const after = reduxSet(before, restPath, val)
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
export function compareUpdate(prevState, newState, depth=1) {
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

function pad(n) {
  return n < 10 ? `0${n}` : n
}

export function resolveTime(seconds) {
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

export function timeToString(milliseconds) {
  const date = new Date(milliseconds)
  return date.toTimeString().slice(0, 8)  // HH:mm:ss
}


export function trimArray(state, comparator) {
  if (Array.isArray(state) && Array.isArray(comparator) && comparator.length < state.length)
    return state.slice(0, comparator.length)
  return state
}

export const fileUrl = (str = '') => {
  let pathName = path.resolve(str).replace(/\\/g, '/')
  if (pathName[0] !== '/') {
    pathName = '/' + pathName
  }
  return url.format({
    protocol: 'file',
    slashes: true,
    pathname: pathName,
  })
}

export const normalizeURL = (str = '') => {
  const path = str.split('.htm')
  path[0] = path[0].replace('#', '%23').replace('?', '%3F')
  return path.join('.htm')
}

// check if dir is a subdirectory of parent,
// if parent and dir are the same, also returns true
export const isSubdirectory = (parent, dir) => {
  const relative = path.relative(parent, dir)
  return !relative ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
}

// Execute function until dom ready
export const executeUntilReady = func => {
  if (document.readyState === 'complete') {
    func()
  } else {
    document.addEventListener('DOMContentLoaded', func)
  }
}

const ensureString = str => isString(str) ? str : toString(str)
export const escapeI18nKey = str => ensureString(str)
  .replace(/\.\W/g, '')
  .replace(/\.$/, '')
  .replace(/:\s/g, '')
  .replace(/:$/g, '')

export const readI18nResources = (filePath) => {
  try {
    let data = readJsonSync(filePath)
    data = _(data)
      .entries()
      .map(([key, v]) => [escapeI18nKey(key), v])
      .fromPairs()
      .value()
    return data
  } catch (e) {
    return {}
  }
}
