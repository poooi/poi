import chalk from 'chalk'
import { webContents, shell, BrowserWindow } from 'electron'
import WindowManager from './window'
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
  webContents
    .fromId(id)
    .addListener('new-window', (e, url, frameName, disposition, options, additionalFeatures) => {
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

const isModernDarwin =
  process.platform === 'darwin' && Number(require('os').release().split('.')[0]) >= 17

export function stopNavigateAndHandleNewWindow(id) {
  webContents.fromId(id).addListener('will-navigate', (e, url) => {
    e.preventDefault()
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
  })
  webContents
    .fromId(id)
    .addListener('new-window', (e, url, frameName, disposition, options, additionalFeatures) => {
      e.preventDefault()
      if (url.startsWith('http')) {
        shell.openExternal(url)
      } else if (frameName.startsWith('plugin')) {
        options.resizable = true
        if (frameName.startsWith('plugin[kangame]')) {
          options.useContentSize = true
          options.webPreferences.webSecurity = false
        }
        if (frameName.startsWith('plugin[gpuinfo]')) {
          options = {}
          options.backgroundColor = '#FFFFFFFF'
        }
        if (url.startsWith('chrome')) {
          options.frame = true
        }

        options = {
          ...options,
          minWidth: 200,
          minHeight: 200,
          titleBarStyle: isModernDarwin ? 'hidden' : null,
          autoHideMenuBar: true,
          webPreferences: {
            ...options.webPreferences,
            nodeIntegration: false,
            nodeIntegrationInWorker: false,
            enableRemoteModule: true,
            plugins: false,
            sandbox: true,
          },
        }
        const win = new BrowserWindow(options)
        if (frameName.startsWith('plugin[gpuinfo]')) {
          win.setBounds({ width: 640, height: 480 })
          win.center()
          win.loadURL('chrome://gpu')
        }
        e.newGuest = win
      }
    })
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
