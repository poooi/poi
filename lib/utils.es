import chalk from 'chalk'
import { webContents, shell, BrowserWindow } from 'electron'
import WindowManager from './window'
import { map } from 'lodash'

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
  console.log('[INFO] ', ...map(str, stringify))
}

export const info = log

export function warn(...str) {
  console.warn(chalk.yellow('[WARN] ', ...map(str, stringify)))
}

export function error(...str) {
  console.error(chalk.red.bold('[ERROR] ', ...map(str, stringify)))
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

/**
 * Workaround for cut/copy/paste/close keybindings not working in devtools window on OSX
 * FIXME: https://github.com/electron/electron/issues/11998
 * credits goes to https://github.com/onivim/oni/pull/2390
 * @param current {webContents} webContents to polyfill
 */
export const darwinDevToolPolyfill = webContents => {
  if (process.platform === 'darwin') {
    webContents.on('devtools-opened', () => {
      webContents.devToolsWebContents.executeJavaScript(`
          window.addEventListener('keydown', function (e) {
              if (e.keyCode === 65 && e.metaKey) {
                  document.execCommand('Select All');
              } else if (e.keyCode === 67 && e.metaKey) {
                  document.execCommand('copy');
              } else if (e.keyCode === 86 && e.metaKey) {
                  document.execCommand('paste');
              } else if (e.keyCode === 87 && e.metaKey) {
                  window.close();
              } else if (e.keyCode === 88 && e.metaKey) {
                  document.execCommand('cut');
              }
          });`)
    })
  }
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
      darwinDevToolPolyfill(win.webContents)
      set.add(url)
      setTimeout(() => {
        set.delete(url)
      }, 1000)
    }
    e.preventDefault()
  })
}

const isModernDarwin = process.platform === 'darwin' && Number(require('os').release().split('.')[0]) >= 17

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
      if (frameName.startsWith('plugin[gpuinfo]')) {
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
          plugins: false,
          sandbox: true,
        },
      }
      e.newGuest = new BrowserWindow(options)
      darwinDevToolPolyfill(e.newGuest.webContents)
    }
  })
}
