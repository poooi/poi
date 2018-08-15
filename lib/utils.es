import chalk from 'chalk'
import { webContents, shell, BrowserWindow } from 'electron'
import WindowManager from './window'

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

const set = new Set()

export function stopFileNavigateAndHandleNewWindowInApp(id) {
  webContents.fromId(id).addListener('will-navigate', (e, url) => {
    if (url.startsWith('file')) {
      e.preventDefault()
    }
  })
  webContents.fromId(id).addListener('new-window',(e, url, frameName, disposition, options, additionalFeatures) => {
    if (!set.has(url)) {
      const win = WindowManager.createWindow({
        realClose: true,
        navigatable: true,
        nodeIntegration: false,
      })
      win.loadURL(url)
      win.show()
      set.add(url)
      setTimeout(() => {
        set.delete(url)
      }, 1000)
    }
    e.preventDefault()
  })
}

export function stopNavigateAndHandleNewWindow(id) {
  webContents.fromId(id).addListener('will-navigate', (e, url) => {
    e.preventDefault()
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
  })
  webContents.fromId(id).addListener('new-window', (e, url, frameName, disposition, options, additionalFeatures) => {
    e.preventDefault()
    if (url.startsWith('http')) {
      shell.openExternal(url)
    } else if (frameName.startsWith('plugin')) {
      options.resizable = true
      if (frameName.startsWith('plugin[kangame]')) {
        options.useContentSize = true
      }
      options = {
        ...options,
        minWidth: 200,
        minHeight: 200,
        backgroundColor: process.platform === 'darwin' ? '#00000000' : '#E62A2A2A',
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
      }
      e.newGuest = new BrowserWindow(options)
    }
  })
}
