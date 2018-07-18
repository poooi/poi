import { BrowserWindow, screen } from 'electron'
import path from 'path-extra'
const windows = global.windows = []
const windowsIndex = global.windowsIndex = {}

let forceClose = false
let pluginUnload = false
const state = []  // Window state before hide
let hidden = false

const inRange = (n, min, range) => (n != null && n >= min && n < min + range)

const withinDisplay = (display, x, y) => {
  const wa = display.workArea
  return inRange(x, wa.x, wa.width) && inRange(y, wa.y, wa.height)
}

const normalizePosition = (options) => {
  // user's workArea may change during game
  const { workArea } = screen.getPrimaryDisplay()
  let { x, y } = options
  if (!screen.getAllDisplays().some(display => withinDisplay(display, x, y))) {
    x = workArea.x
    y = workArea.y
  }

  return Object.assign(options, {
    x,
    y,
  })
}

export default {
  createWindow: (options) => {
    options = Object.assign({
      show: false,
      icon: path.join(global.ROOT, 'assets', 'icons', 'poi.ico'),
    }, normalizePosition(options))
    const current = new BrowserWindow(options)
    if (options.indexName) {
      windowsIndex[options.indexName] = current
    }
    current.setMenu(options.menu || null)
    current.reloadArea = null
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
      current.webContents.executeJavaScript('require(\'electron\').webFrame.setVisualZoomLevelLimits(1, 1)')
    })
    // Close window really
    if (options.realClose) {
      current.on('closed', (e) => {
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
      current.on ('closed', (e) => {
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
      current.on( 'closed', (e) => {
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
      windows[i].close()
      windows[i] = null
    }
  },
  closeWindow: (win) => {
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
    if (win.isMaximized()){
      win.unmaximize()
    }
    const b = win.getBounds()
    b.isFullScreen = isFullScreen
    b.isMaximized = isMaximized
    require('./config').set('poi.window', b)
  },
  toggleAllWindowsVisibility: () =>{
    for (const w of BrowserWindow.getAllWindows())
      if (!hidden){
        state[w.id] = w.isVisible()
        w.hide()
      } else {
        if (state[w.id]) {
          w.show()
        }
      }
    hidden = !hidden
  },
  openFocusedWindowDevTools: () =>{
    BrowserWindow.getFocusedWindow().openDevTools({
      mode: 'detach',
    })
  },
  getWindowsIndex: () => {
    return global.windowsIndex
  },
  getWindow: (name) => {
    return global.windowsIndex[name]
  },
  getMainWindow: () => {
    return global.mainWindow
  },
  getAllWindows: () => {
    return BrowserWindow.getAllWindows()
  },
}
