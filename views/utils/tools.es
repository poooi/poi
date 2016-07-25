/*
 * This file contains utility functions that is unrelated to the game mechanism.
 */

import { unzip, sum } from 'lodash'

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

export function arrayAdd(arr, n) {
  return arr.map((i) => i + n)
}
