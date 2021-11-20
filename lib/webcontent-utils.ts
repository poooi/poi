import { webContents, shell, BrowserWindow } from 'electron'
import * as electronRemote from '@electron/remote/main'
import os from 'os'
import _ from 'lodash'

const isModernDarwin = process.platform === 'darwin' && Number(os.release().split('.')[0]) >= 17

export function stopFileNavigate(id: number) {
  webContents.fromId(id).addListener('will-navigate', (e, url) => {
    if (url.startsWith('file')) {
      e.preventDefault()
    }
  })
}

export function stopNavigateAndHandleNewWindow(id: number) {
  webContents.fromId(id).addListener('will-navigate', (e, url) => {
    e.preventDefault()
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
  })
  webContents.fromId(id).addListener('new-window', (e, url, frameName, disposition, options) => {
    e.preventDefault()
    if (url.startsWith('http')) {
      shell.openExternal(url)
    } else if (frameName.startsWith('plugin')) {
      options.resizable = true
      options.frame = false
      if (frameName.startsWith('plugin[kangame]')) {
        options.useContentSize = true
        _.set(options, ['webPreferences', 'webSecurity'], false)
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
        titleBarStyle: isModernDarwin ? 'hidden' : undefined,
        autoHideMenuBar: true,
        webPreferences: {
          ...options.webPreferences,
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          plugins: true,
          sandbox: false,
          webviewTag: true,
        },
      }
      const win = new BrowserWindow(options)
      if (frameName.startsWith('plugin[gpuinfo]')) {
        win.setBounds({ width: 640, height: 480 })
        win.center()
        win.loadURL('chrome://gpu')
      }
      electronRemote.enable(win.webContents)
      win.webContents.addListener('did-attach-webview', (e, webContent) => {
        electronRemote.enable(webContent)
      })
      e.newGuest = win
    }
  })
}
