/*
 * This file contains utility functions that is unrelated to the game mechanism.
 */

import { zip, unzip, sum } from 'lodash'

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

export function trimArray(state, comparator) {
  if (Array.isArray(state) && Array.isArray(comparator) && comparator.length > state.length)
    return state.slice(0, comparator.length)
  return state
}
