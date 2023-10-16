import { webContents, shell, BrowserWindowConstructorOptions, webFrameMain } from 'electron'
import * as electronRemote from '@electron/remote/main'
import os from 'os'
import _ from 'lodash'
import config from './config'
import { warn } from './utils'

const isModernDarwin = process.platform === 'darwin' && Number(os.release().split('.')[0]) >= 17

export function stopFileNavigate(id: number) {
  webContents.fromId(id)?.addListener('will-navigate', (e, url) => {
    if (url.startsWith('file')) {
      e.preventDefault()
    }
  })
}

// workaround for preload script failed to execute in some iframes (especially nested ones)
export function handleWebviewPreloadHack(id: number) {
  const webContent = webContents.fromId(id)

  if (!webContent) {
    return
  }

  webContent.addListener('did-attach-webview', (event, wc) => {
    wc.addListener(
      'did-frame-navigate',
      async (
        event,
        url,
        httpResponseCode,
        httpStatusText,
        isMainFrame,
        frameProcessId,
        frameRoutingId,
      ) => {
        const frame = webFrameMain.fromId(frameProcessId, frameRoutingId)
        if (
          frame &&
          url !== 'about:blank' &&
          !(await frame.executeJavaScript('window.xhrHacked || false'))
        ) {
          warn('iframe failed to load preload script, loading xhr hack from parent', url)
          await frame.executeJavaScript(`
            let cur = window.parent
            while (true) {
              if (cur.hackXhr) {
                cur.hackXhr(window)
                break
              } else if (cur.parent !== cur) {
                cur = cur.parent
              } else {
                break
              }
            }
          `)
        }
      },
    )
  })
}

export function stopNavigateAndHandleNewWindow(id: number) {
  const webContent = webContents.fromId(id)

  if (!webContent) {
    return
  }

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
          webPreferences: {
            webviewTag: true,
          },
        },
      }
    } else if (frameName.startsWith('plugin')) {
      const options: BrowserWindowConstructorOptions = {
        resizable: true,
        frame: false,
        minWidth: 200,
        minHeight: 200,
        titleBarStyle: isModernDarwin ? 'hidden' : undefined,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          plugins: true,
          sandbox: false,
          webviewTag: true,
        },
        transparent: true,
      }
      if (frameName.startsWith('plugin[kangame]')) {
        options.useContentSize = true
        _.set(options, ['webPreferences', 'webSecurity'], false)
        _.set(options, ['webPreferences', 'backgroundThrottling '], false)
        _.set(options, ['webPreferences', 'nodeIntegration'], false)
        _.set(options, ['webPreferences', 'nodeIntegrationInSubFrames'], true)
        _.set(options, ['webPreferences', 'contextIsolation'], false)
        _.set(options, ['webPreferences', 'zoomFactor'], config.get('poi.appearance.zoom'))
      }
      return {
        action: 'allow',
        overrideBrowserWindowOptions: options,
      }
    }
    return { action: 'deny' }
  })

  webContent.addListener('did-create-window', (win, { frameName }) => {
    if (frameName.startsWith('plugin') && !frameName.startsWith('plugin[gpuinfo]')) {
      electronRemote.enable(win.webContents)
      win.webContents.addListener('did-attach-webview', (e, webContent) => {
        electronRemote.enable(webContent)
      })
    }
  })
}
