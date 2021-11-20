/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk'
import { Rectangle } from 'electron'
import { map, get, mapValues, isPlainObject, isNumber, isArray, isString, isBoolean } from 'lodash'

const stringify = (payload: any) => {
  if (typeof payload === 'string') {
    return payload
  }
  if (payload.toString().startsWith('[object ')) {
    payload = JSON.stringify(payload)
  } else {
    payload = payload.toString()
  }
  return payload
}

export const remoteStringify = JSON.stringify

export function log(...str: any[]) {
  // eslint-disable-next-line no-console
  console.log('[INFO]', ...map(str, stringify))
}

export const info = log

export function warn(...str: any[]) {
  console.warn(chalk.yellow('[WARN]', ...map(str, stringify)))
}

export function error(...str: any[]) {
  console.error(chalk.red.bold('[ERROR]', ...map(str, stringify)))
}

export function setBounds(options: Partial<Rectangle>) {
  return global.mainWindow.setBounds(options)
}

export function getBounds() {
  return global.mainWindow.getBounds()
}

/**
 * Merges default values into user poi config
 * to ensure all default values exists if not set by user
 * rules:
 * let A and B respectively values in default and user config
 * - if A is not undefined, and A, B is different in data type, honor A
 * - other cases, honor B
 * @param defaults default config
 * @param incoming loaded config
 */
export const mergeConfig = (defaults: object, incoming: object) => {
  const overwrite: object = mapValues(defaults, (value, key) => {
    if (isPlainObject(value)) {
      return mergeConfig(value, get(incoming, key))
    }

    const incomingValue = get(incoming, key)

    return [isNumber, isArray, isString, isBoolean].some(
      (test) => test(value) !== test(incomingValue),
    )
      ? value
      : incomingValue
  })

  return isPlainObject(incoming) ? { ...incoming, ...overwrite } : overwrite
}
