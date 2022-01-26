import { webContents, shell, BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
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
  const webContent = webContents.fromId(id)
  webContent.addListener('will-navigate', (e, url) => {
    e.preventDefault()
    if (url.startsWith('http')) {
      shell.openExternal(url)
    }
  })
  webContent.setWindowOpenHandler(({ url, frameName }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
    } else if (frameName.startsWith('plugin[gpuinfo]')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          backgroundColor: '#FFFFFFFF',
          width: 640,
          height: 480,
          center: true,
          autoHideMenuBar: true,
        },
      }
    } else if (frameName.startsWith('plugin')) {
      let options: BrowserWindowConstructorOptions = {
        resizable: true,
        frame: false,
      }
      if (frameName.startsWith('plugin[kangame]')) {
        options.useContentSize = true
        _.set(options, ['webPreferences', 'webSecurity'], false)
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

      return {
        action: 'allow',
        overrideBrowserWindowOptions: options,
      }
    }

    return { action: 'deny' }
  })
  webContent.addListener('did-create-window', (win, { frameName }) => {
    if (frameName.startsWith('plugin')) {
      if (frameName.startsWith('plugin[gpuinfo]')) {
        win.loadURL('chrome://gpu')
      }
      electronRemote.enable(win.webContents)
      win.webContents.addListener('did-attach-webview', (e, webContent) => {
        electronRemote.enable(webContent)
      })
    }
  })
}
