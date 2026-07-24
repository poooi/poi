import type { Display, BrowserWindowConstructorOptions, Menu, WebContents } from 'electron'

import * as electronRemote from '@electron/remote/main'
import { app, BrowserWindow, screen, webContents } from 'electron'
import path from 'path'

const windows: typeof global.windows = (global.windows = [])
const windowsIndex: typeof global.windowsIndex = (global.windowsIndex = {})

let forceClose = false
let pluginUnload = false
const windowVisibilityState = new Map<number, boolean>()
const backgroundThrottlingState = new Map<
  number,
  { webContents: WebContents; backgroundThrottling: boolean }
>()
const throttleHiddenWindows = process.platform === 'win32'
let hidden = false

function throttleWebContentsWhileHidden(contents: WebContents): void {
  if (
    !throttleHiddenWindows ||
    contents.isDestroyed() ||
    backgroundThrottlingState.has(contents.id)
  ) {
    return
  }

  // On Windows, tray hiding must opt back into Electron's background throttling
  // so hidden windows stop submitting compositor frames. Normal minimization
  // deliberately keeps each WebContents' configured behavior unchanged.
  backgroundThrottlingState.set(contents.id, {
    webContents: contents,
    backgroundThrottling: contents.getBackgroundThrottling(),
  })
  contents.setBackgroundThrottling(true)
}

app.on('web-contents-created', (_event, contents) => {
  if (hidden) {
    throttleWebContentsWhileHidden(contents)
  }
})

app.on('browser-window-created', (_event, window) => {
  window.on('show', () => {
    if (hidden) {
      window.hide()
    }
  })

  if (hidden) {
    windowVisibilityState.set(window.id, false)
    window.hide()
  }
})

function hideAllWindowsToTray(): void {
  if (hidden) {
    return
  }

  windowVisibilityState.clear()
  backgroundThrottlingState.clear()
  hidden = true

  for (const contents of webContents.getAllWebContents()) {
    throttleWebContentsWhileHidden(contents)
  }

  for (const window of BrowserWindow.getAllWindows()) {
    windowVisibilityState.set(window.id, window.isVisible())
    window.hide()
  }
}

function restoreAllWindowsFromTray(): void {
  if (!hidden) {
    if (global.mainWindow?.isMinimized()) {
      global.mainWindow.restore()
    } else {
      global.mainWindow?.show()
    }
    return
  }

  hidden = false

  for (const window of BrowserWindow.getAllWindows()) {
    if (windowVisibilityState.get(window.id)) {
      window.show()
    }
  }

  for (const {
    webContents: contents,
    backgroundThrottling,
  } of backgroundThrottlingState.values()) {
    if (!contents.isDestroyed()) {
      // Different WebContents may have different foreground policies, so restore
      // the captured value instead of assuming every one was unthrottled.
      contents.setBackgroundThrottling(backgroundThrottling)
    }
  }

  windowVisibilityState.clear()
  backgroundThrottlingState.clear()
}

export interface PoiWindowOptions extends BrowserWindowConstructorOptions {
  indexName?: string
  forceMinimize?: boolean
  realClose?: boolean
  navigatable?: boolean
  menu?: Menu
}

const inRange = (n: number | undefined, min: number, range: number): boolean =>
  n != null && n >= min && n < min + range

const withinDisplay = (display: Display, x: number | undefined, y: number | undefined) => {
  const wa = display.workArea
  return inRange(x, wa.x, wa.width) && inRange(y, wa.y, wa.height)
}

const normalizePosition = (options: PoiWindowOptions) => {
  // user's workArea may change during game
  const { workArea } = screen.getPrimaryDisplay()
  let { x, y } = options
  if (!screen.getAllDisplays().some((display) => withinDisplay(display, x, y))) {
    x = workArea.x
    y = workArea.y
  }

  return Object.assign(options, {
    x,
    y,
  })
}

export default {
  createWindow: (options: PoiWindowOptions) => {
    options = Object.assign(
      {
        show: false,
        icon: path.join(global.ROOT, 'assets', 'icons', 'poi.ico'),
      },
      normalizePosition(options),
    )
    const current = new BrowserWindow(options)
    if (options.indexName) {
      windowsIndex[options.indexName] = current
    }
    electronRemote.enable(current.webContents)
    current.setMenu(options.menu || null)
    const show = current.show
    current.show = () => {
      if (current.isMinimized()) {
        current.restore()
      } else {
        show.call(current)
      }
    }
    // Disable OSX zoom
    current.webContents.on('dom-ready', () => {
      current.webContents.executeJavaScript(
        "require('electron').webFrame.setVisualZoomLevelLimits(1, 1)",
      )
    })
    // Close window really
    if (options.realClose) {
      current.on('closed', () => {
        if (options.indexName) {
          delete windowsIndex[options.indexName]
        }
        const idx = windows.indexOf(current)
        windows.splice(idx, 1)
      })
    } else if (options.forceMinimize) {
      current.on('close', (e) => {
        current.minimize()
        if (!forceClose && !pluginUnload) {
          e.preventDefault()
        }
      })
      current.on('closed', () => {
        pluginUnload = false
        if (options.indexName) {
          delete windowsIndex[options.indexName]
        }
        const idx = windows.indexOf(current)
        windows.splice(idx, 1)
      })
    } else {
      current.on('close', (e) => {
        if (current.isFullScreen()) {
          current.once('leave-full-screen', current.hide)
          current.setFullScreen(false)
        } else {
          current.hide()
        }
        if (!forceClose && !pluginUnload) {
          e.preventDefault()
        }
      })
      current.on('closed', () => {
        pluginUnload = false
        if (options.indexName) {
          delete windowsIndex[options.indexName]
        }
        const idx = windows.indexOf(current)
        windows.splice(idx, 1)
      })
    }
    // Draggable
    if (!options.navigatable) {
      current.webContents.on('will-navigate', (e) => {
        e.preventDefault()
      })
    }
    windows.push(current)
    return current
  },
  // Warning: Don't call this method manually
  // It will be called before mainWindow closed
  closeWindows: () => {
    forceClose = true
    for (let i = 0; i < windows.length; i++) {
      if (windows[i] == null) {
        continue
      }
      windows[i]?.close?.()
      windows[i] = null
    }
  },
  closeWindow: (win: BrowserWindow) => {
    pluginUnload = true
    win.close()
  },
  rememberMain: () => {
    const win = global.mainWindow
    const isFullScreen = win.isFullScreen()
    if (win.isFullScreen()) {
      win.setFullScreen(false)
    }
    const isMaximized = win.isMaximized()
    if (win.isMaximized()) {
      win.unmaximize()
    }
    const b = win.getBounds()
    require('./config').set('poi.window', {
      ...b,
      isFullScreen,
      isMaximized,
    })
  },
  hideAllWindowsToTray,
  restoreAllWindowsFromTray,
  toggleAllWindowsVisibility: () => {
    if (hidden) {
      restoreAllWindowsFromTray()
    } else {
      hideAllWindowsToTray()
    }
  },
  openFocusedWindowDevTools: () => {
    webContents.getFocusedWebContents()?.openDevTools?.({
      mode: 'detach',
    })
  },
  getWindowsIndex: () => {
    return global.windowsIndex
  },
  getWindow: (name: string) => {
    return global.windowsIndex[name]
  },
  getMainWindow: () => {
    return global.mainWindow
  },
  getAllWindows: () => {
    return BrowserWindow.getAllWindows()
  },
}
