import { webContents, shell, BrowserWindow } from 'electron'
import * as electronRemote from '@electron/remote/main'

const isModernDarwin =
  process.platform === 'darwin' && Number(require('os').release().split('.')[0]) >= 17

export function stopFileNavigate(id) {
  webContents.fromId(id).addListener('will-navigate', (e, url) => {
    if (url.startsWith('file')) {
      e.preventDefault()
    }
  })
}

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
        options.frame = false
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
        electronRemote.enable(win.webContents)
        e.newGuest = win
      }
    })
}
