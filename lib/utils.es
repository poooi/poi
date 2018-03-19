import chalk from 'chalk'
import { webContents } from 'electron'

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

export function log(str) {
  str = stringify(str)
  // eslint-disable-next-line no-console
  return console.log("[INFO] " + str)
}

export function  warn(str) {
  str = stringify(str)
  return console.warn(chalk.yellow("[WARN] " + str))
}

export function error(str) {
  str = stringify(str)
  return console.error(chalk.red.bold("[ERROR] " + str))
}
export function setBounds(options) {
  return global.mainWindow.setBounds(options)
}
export function getBounds() {
  return global.mainWindow.getBounds()
}
export function stopFileNavigate(id) {
  webContents.fromId(id).addListener('will-navigate', (e, url) => {
    if (url.startsWith('file')) {
      e.preventDefault()
    }
  })
}
export function stopNavigate(id) {
  webContents.fromId(id).addListener('will-navigate', (e, url) => {
    e.preventDefault()
  })
}
