import chalk from 'chalk'
import { map, get, mapValues, isPlainObject, isNumber, isArray, isString, isBoolean } from 'lodash'

const stringify = (str) => {
  if (typeof str === 'string') {
    return str
  }
  if (str.toString().startsWith('[object ')) {
    str = JSON.stringify(str)
  } else {
    str = str.toString()
  }
  return str
}

export const remoteStringify = JSON.stringify

export function log(...str) {
  // eslint-disable-next-line no-console
  console.log('[INFO]', ...map(str, stringify))
}

export const info = log

export function warn(...str) {
  console.warn(chalk.yellow('[WARN]', ...map(str, stringify)))
}

export function error(...str) {
  console.error(chalk.red.bold('[ERROR]', ...map(str, stringify)))
}

export function setBounds(options) {
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
export const mergeConfig = (defaults, incoming) => {
  const overwrite = mapValues(defaults, (value, key) => {
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
