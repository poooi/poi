/*
 * This file contains utility functions that is unrelated to the game mechanism.
 */

/*
  eslint-disable @typescript-eslint/no-explicit-any
*/

import type { PopoverProps } from '@blueprintjs/core'
import type { Dictionary } from 'lodash'

import { readJsonSync } from 'fs-extra'
import _, {
  isEqual,
  forEach,
  keyBy,
  zip,
  unzip,
  sum,
  isString,
  toString,
  padStart,
  setWith,
  clone,
} from 'lodash'
import pangu from 'pangu'
import path from 'path'
import url from 'url'

/**
 * Sums up each position for each position for a 2-dimension array (matrix)
 * @param arr 2-d array of numbers
 * @returns array of sums
 */
export function arraySum(arr: number[][]): number[] {
  return unzip(arr).map(sum)
}

/**
 * Mutiply an array at each element
 * @param arr 1-d array of numbers
 * @param n factor
 */
export function arrayMultiply(arr: number[], n: number): number[] {
  return arr.map((i) => i * n)
}

/**
 * Adds an array
 * @param arr 1-d array of numbers
 * @param n number or 1-d array of same size
 */
export function arrayAdd(arr: number[], n: number | number[]): number[] {
  if (Array.isArray(n)) {
    return zip(arr, n).map(([a, b]) => a! + b!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  } else {
    return arr.map((i) => i + n)
  }
}

/**
 * Substracts an array
 * @param arr 1-d array of numbers
 * @param n number or 1-d array of same size
 */
export function arraySubstract(arr: number[], n: number): number[]
export function arraySubstract(arr: number[], n: number[]): number[]
export function arraySubstract(arr: number[], n: number | number[]): number[] {
  if (Array.isArray(n)) {
    return zip(arr, n).map(([a, b]) => a! - b!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
  } else {
    return arr.map((i) => i - n)
  }
}

/**
 * Checks a value is between the bounds
 * @param n value to check
 * @param min lower bound (<=)
 * @param max upper bound (<=)
 */
export function between(n: number, min: number, max: number): boolean {
  return n >= min && n <= max
}

/**
 * a non-ambiguous method to build array, should supersed `buildArray`
 * @param idx
 * @param values
 * @returns
 */
export const constructArray = <T = any>(idx: number[], values: T[]) => {
  const ret: T[] = []
  idx.forEach((index, i) => {
    index = Math.floor(index)
    if (isNaN(index) || index < 0) {
      return
    }
    ret[index] = values[i]
  })
  return ret
}

/**
 * @deprecated use constructArray instead
 */
export function buildArray<T = any>(idx: number, value: T): T[]
/**
 * Builds an array with the given position and value info
 * @param pairs array of [position, value]
 * @deprecated use constructArray instead
 */
export function buildArray<T = any>(pairs: [number, T][]): T[]
/**
 * @deprecated use constructArray instead
 */
export function buildArray<T = any>(
  pairsOrIdx: number | [number, T][],
  _value?: T,
): (T | undefined)[] {
  let pairs: [number, T | undefined][]
  if (Array.isArray(pairsOrIdx)) {
    pairs = pairsOrIdx
  } else {
    console.warn(
      'buildArray(idx, value) is pending deprecation, please use buildArray([idx, value]) instead',
    )
    pairs = [[pairsOrIdx, _value]]
  }
  const ret: T[] = []
  pairs.forEach(([index, value]) => {
    index = Math.floor(index)
    if (isNaN(index) || index < 0 || value == null) {
      return
    }
    ret[index] = value
  })
  return ret
}

/**
 * Turns an array into object with given key
 * @param array array to build
 * @param key value to be key
 */
export function indexify<T = any>(array: any[], key = 'api_id'): Dictionary<T> {
  return keyBy(array, key)
}

/**
 * returns a new copy for an object or array
 * @param obj the source
 * @param to another instance to compare
 */
export function copyIfSame<T>(obj: T[], to: any): T[]
export function copyIfSame<T extends object>(obj: T, to: any): T
export function copyIfSame<T>(obj: T, to: any): T {
  // assert(typeof obj === 'object')
  if (obj === to) {
    if (Array.isArray(obj)) {
      return obj.slice()
    }
    return { ...obj }
  }
  return obj
}

/**
 * Mutates the state by remving properties that no longer exist in body, only keys are compared
 * @param state the state object
 * @param body the incoming new state
 */
export function pickExisting<T extends object>(state: T, body: object): T {
  const stateBackup = state
  forEach(state, (_, k) => {
    const key = String(k)
    if (!(key in body)) {
      state = copyIfSame(state, stateBackup)
      const stateRecord: Record<string, unknown> = state
      delete stateRecord[key]
    }
  })
  return state
}

/**
 * Sets a value for a given path with pure operations, for Redux pattern compliance
 * Similar to lodash.set, but if the value needs updating, each object along
 * its path will be shallow-copied instead of modified in-place
 * @param obj object to modify
 * @param path data path
 * @param val the value to update
 */
export function reduxSet<T extends Record<string, unknown>>(
  obj: T,
  path: (string | number)[],
  val: any,
): T {
  return setWith(clone(obj), path, val, clone)
}

/**
 * Updates a state like Object.assign(prevState, newState) until `depth` level, but keeps
 * as many parts from previous State as possible. Neither state is modified in-place.
 * By default `depth` == 1, and every property of the returned value will be the the same
 * previous (in terms of ===) if not mentioned in newState or `isEqual` to the corresponding,
 * or o/w the newProperty as a whole. Therefore,
 * - If you only provide one leaf of a property, its other siblings will be deleted.
 * - If a property is updated, all its children will be new ones, even if they are equal (in terms of isEqual).
 * @param prevState previous state
 * @param newState the expected state to trigger the modification
 * @param depth
 * @returns updated result mixed of previous and new state
 */
export function compareUpdate<T = any>(prevState: T, newState: T, depth = 1): T {
  if (typeof prevState !== typeof newState) {
    return newState
  }
  if (prevState === newState) {
    return prevState
  }
  if (depth == 0 || typeof depth !== 'number' || typeof prevState !== 'object') {
    return isEqual(prevState, newState) ? prevState : newState
  }
  const prevStateBackup = prevState
  // Update existing properties
  const nextDepth = depth - 1
  if (typeof newState !== 'object' || newState === null) {
    return prevState
  }
  const prevStateRecord: Record<string, unknown> = prevState
  forEach(newState as object, (v, k) => {
    const key = String(k)
    const newV = compareUpdate(prevStateRecord[key], v, nextDepth)
    // ATTENTION: Any null properties are ignored
    if (newV != null && prevStateRecord[key] !== newV) {
      prevState = copyIfSame(prevState, prevStateBackup)
      if (newV != null) {
        prevStateRecord[key] = newV
      }
    }
  })
  return prevState
}

/**
 * Pads a number by 0 at start
 * @param n the number to pad
 */
function pad(n: number): string {
  return padStart(n.toString(), 2, '0')
}

/**
 * Renders sconds in HH:mm:ss format
 * @param seconds time
 */
export function resolveTime(seconds: number): string {
  seconds = Math.floor(seconds)
  if (seconds >= 0) {
    const s = seconds % 60
    const m = Math.trunc(seconds / 60) % 60
    const h = Math.trunc(seconds / 3600)
    return `${pad(h)}:${pad(m)}:${pad(s)}`
  } else {
    return ''
  }
}

/**
 * Renders milliseconds in HH:mm:ss format
 * @param milliseconds time
 */
export function timeToString(milliseconds: number): string {
  const date = new Date(milliseconds)
  return date.toTimeString().slice(0, 8) // HH:mm:ss
}

/**
 * Reduces an array to fit the length of another array
 * @param state original array
 * @param comparator the array as reference
 */
export function trimArray<T extends any[]>(state: T, comparator: any[]): T {
  if (Array.isArray(state) && Array.isArray(comparator) && comparator.length < state.length)
    return state.slice(0, comparator.length) satisfies T
  return state
}

/**
 * Generates a valid file url for browser file links
 * @param str file path
 */
export const fileUrl = (str = ''): string => {
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

/**
 * Escapes the a url with encodeURI
 * @param str the url
 */
export const normalizeURL = (str = ''): string => {
  const path = str.split('.htm')
  path[0] = path[0].replace('#', '%23').replace('?', '%3F')
  return path.join('.htm')
}

/**
 * Checks if dir is a subdirectory of parent, if parent and dir are the same, also returns true
 * @param parent
 * @param dir
 */
export const isSubdirectory = (parent: string, dir: string): boolean => {
  const relative = path.relative(parent, dir)
  return !relative || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

/**
 * Executes a function until dom ready
 * @param func
 */
export const executeUntilReady = (func: () => any): void => {
  if (document.readyState === 'complete') {
    func()
  } else {
    document.addEventListener('DOMContentLoaded', func)
  }
}

/**
 * Turns a value to string if it is not
 * @param str the value
 */
const ensureString = (str: any): string => (isString(str) ? str : toString(str))

/**
 * Removes default ns and key separators in a translation key for i18next
 * @param str translation key
 */
export const escapeI18nKey = (str: any): string =>
  ensureString(str).replace(/\.\W/g, '').replace(/\.$/, '').replace(/:\s/g, '').replace(/:$/g, '')

/**
 * Loads the i18n resources
 * @param filePath i18n json file path
 */
export const readI18nResources = (filePath: string): object => {
  try {
    let data = readJsonSync(filePath)
    data = _(data)
      .entries()
      .map(([key, v]) => [escapeI18nKey(key), v])
      .fromPairs()
      .value()
    return data
  } catch (_e) {
    return {}
  }
}

/**
 * Loads an external script by adding <script> tag
 * @param path script path
 * @param document document object
 */
export const loadScript = (path: string, document = window.document): void => {
  const script = document.createElement('script')
  script.setAttribute('src', path)
  document.head.appendChild(script)
}

/**
 * Default blueprint popover(Popper.js) modifiers used in poi
 */
export const POPOVER_MODIFIERS: PopoverProps['modifiers'] = {}

export const cjkSpacing = (str: string) => (isString(str) ? pangu.spacing(str) : toString(str))
