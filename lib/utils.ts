/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Rectangle } from 'electron'

import chalk from 'chalk'
import { map } from 'lodash'

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
