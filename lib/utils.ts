/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Rectangle } from 'electron'
import type { NoPeriod } from 'shims/utils'

import chalk from 'chalk'
import { map } from 'lodash'

export type PluginID = NoPeriod<string>

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

declare global {
  var mainWindow: Electron.BrowserWindow
}

export function setBounds(options: Partial<Rectangle>) {
  return global.mainWindow.setBounds(options)
}

export function getBounds() {
  return global.mainWindow.getBounds()
}

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
export const mergeConfig = <T>(defaultConfig: T, config: unknown): T => {
  if (typeof defaultConfig !== 'object' || defaultConfig === null) {
    return typeof config === typeof defaultConfig ? (config as T) : defaultConfig
  }
  if (Array.isArray(defaultConfig)) {
    return Array.isArray(config) ? (config as T) : defaultConfig
  }
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    return { ...(defaultConfig as Record<string, unknown>) } as unknown as T
  }
  const defaultRecord = defaultConfig as Record<string, unknown>
  const configRecord = config as Record<string, unknown>
  const result: Record<string, unknown> = { ...configRecord }
  for (const [key, defaultValue] of Object.entries(defaultRecord)) {
    result[key] = key in configRecord ? mergeConfig(defaultValue, configRecord[key]) : defaultValue
  }
  return result as unknown as T
}
/* eslint-enable @typescript-eslint/no-unsafe-type-assertion */
