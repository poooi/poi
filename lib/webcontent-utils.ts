import type { BrowserWindowConstructorOptions, WebContents } from 'electron'

import * as electronRemote from '@electron/remote/main'
import { BrowserWindow, webContents, shell, webFrameMain } from 'electron'
import _ from 'lodash'
import os from 'os'

import config from './config'
import { log, warn } from './utils'

const isModernDarwin = process.platform === 'darwin' && Number(os.release().split('.')[0]) >= 17

export function stopFileNavigate(id: number) {
  webContents.fromId(id)?.addListener('will-navigate', (e, url) => {
    if (url.startsWith('file')) {
      e.preventDefault()
    }
  })
}

// Diagnostics for windows the game page opens itself (`window.open`, e.g. the DMM charge
// page). poi has no other visibility into them, so when one dies the only trace is an
// unrelated-looking error from whoever touches the dead frame next — which is exactly how
// the crash below presented. Log the popup's URL and the renderer exit reason.
function watchGuestPopup(win: BrowserWindow, url: string) {
  const { webContents: popupContents } = win
  log('webview popup created', url, 'osPid', popupContents.getOSProcessId())

  popupContents.addListener('render-process-gone', (_event, details) => {
    warn('webview popup renderer gone', popupContents.getURL() || url, details)
  })
  popupContents.addListener(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      warn('webview popup failed to load', validatedURL || url, errorCode, errorDescription)
    },
  )
  popupContents.addListener('unresponsive', () => {
    warn('webview popup unresponsive', popupContents.getURL() || url)
  })
}

const parseWindowFeature = (features: string, key: string) => {
  const matched = new RegExp(`(?:^|,)\\s*${key}\\s*=\\s*(\\d+)`).exec(features)
  return matched ? Number(matched[1]) : undefined
}

// The game webview runs with `disablewebsecurity` (see views/kan-game-wrapper.tsx), which
// the game page's own iframe traversal depends on. A popup opened from that page keeps an
// opener relationship with it and so ends up in the same renderer process; loading an
// ordinary secure page there — the DMM point-charge flow is the one that surfaced this —
// crashes that renderer outright (STATUS_BREAKPOINT, no log output), taking the game down
// with it. Opening the popup ourselves drops the opener link, so the page gets a clean
// process with web security left on.
function openGuestPopupDetached(url: string, features: string) {
  const win = new BrowserWindow({
    width: parseWindowFeature(features, 'width') ?? 800,
    height: parseWindowFeature(features, 'height') ?? 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  })
  watchGuestPopup(win, url)
  win.loadURL(url)
}

function handleGuestPopups(wc: WebContents) {
  wc.setWindowOpenHandler(({ url, features }) => {
    // Only http(s) can be re-opened detached. Anything else (`about:blank` popups the page
    // then scripts, in particular) still needs the opener link, so leave it alone rather
    // than breaking game flows that rely on it.
    if (url.startsWith('http://') || url.startsWith('https://')) {
      openGuestPopupDetached(url, features)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  // Popups still created by Chromium (the non-http case above).
  wc.addListener('did-create-window', (win, { url }) => {
    watchGuestPopup(win, url)
  })
}

// workaround for preload script failed to execute in some iframes (especially nested ones)
export function handleWebviewPreloadHack(id: number) {
  const webContent = webContents.fromId(id)

  if (!webContent) {
    return
  }

  webContent.addListener('did-attach-webview', (event, wc) => {
    handleGuestPopups(wc)

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
        if (frame && url !== 'about:blank') {
          if (!(await frame.executeJavaScript('window.xhrHacked || false'))) {
            warn('iframe failed to load preload script, loading xhr hack from parent', url)
            await frame.executeJavaScript(`
            (() => {
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
            })()
          `)
          }
          if (!(await frame.executeJavaScript('window.resourceHacked || false'))) {
            warn('iframe failed to load preload script, loading image hack from parent', url)
            await frame.executeJavaScript(`
            (() => {
              let cur = window.parent
              while (true) {
                if (cur.hackResource) {
                  cur.hackResource(window)
                  break
                } else if (cur.parent !== cur) {
                  cur = cur.parent
                } else {
                  break
                }
              }
            })()
          `)
          }
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
      const pluginId = url.split('?').pop()
      const parentWindow = BrowserWindow.fromWebContents(webContent)
      const options: BrowserWindowConstructorOptions = {
        resizable: true,
        frame: false,
        minWidth: 200,
        minHeight: 200,
        titleBarStyle: isModernDarwin ? 'hidden' : undefined,
        titleBarOverlay: isModernDarwin ? {} : undefined,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          plugins: true,
          sandbox: false,
          webviewTag: true,
        },
        transparent: isModernDarwin,
        backgroundMaterial: config.get('poi.appearance.vibrant', 0) ? 'acrylic' : 'none',
        show: false,
      }
      const pinConfig = config.get(`poi.plugin.pin.${pluginId}`, undefined)
      if (pinConfig && parentWindow) {
        const bounds = parentWindow.getBounds()
        options.x = bounds.x + pinConfig.deltaX
        options.y = bounds.y + pinConfig.deltaY
        options.width = pinConfig.width
        options.height = pinConfig.height
        options.parent = parentWindow
        options.resizable = false
        options.movable = false
        options.minimizable = false
        options.maximizable = false
        options.closable = false
      }
      if (frameName.startsWith('plugin[kangame]')) {
        options.useContentSize = true
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
