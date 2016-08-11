const {app, BrowserWindow, ipcMain, Tray, nativeImage, shell} = require('electron')
const path = require('path-extra')

// Environment
global.POI_VERSION = app.getVersion()
global.ROOT = __dirname
global.EXECROOT = path.join(process.execPath, '..')
global.APPDATA_PATH = path.join(app.getPath('appData'), 'poi')
global.EXROOT = global.APPDATA_PATH
global.DEFAULT_CACHE_PATH = path.join(global.EXROOT, 'MyCache')
global.MODULE_PATH = path.join(global.ROOT, "node_modules")

const {ROOT} = global
const poiIconPath = path.join(ROOT, 'assets', 'icons', 'poi.ico')

const config = require('./lib/config')
const proxy = require('./lib/proxy')
const shortcut = require('./lib/shortcut')
const {error} = require('./lib/utils')
const dbg = require('./lib/debug')
proxy.setMaxListeners(30)

// Export garbage collection as global function
app.commandLine.appendSwitch('js-flags', '--optimize_for_size --expose_gc --gc_interval 32 --lazy_sweeping false')
app.commandLine.appendSwitch('disable-renderer-backgrounding')

// Disable HA

if (config.get('poi.disableHA', false)) {
  app.disableHardwareAcceleration()
}

// Add shortcut to start menu when os is windows
app.setAppUserModelId('org.poooi.poi')
if (process.platform === 'win32' && config.get('poi.createShortcut', true)) {
  const shortcutPath = app.getPath('appData') + "\\Microsoft\\Windows\\Start Menu\\Programs\\poi.lnk"
  const targetPath = app.getPath('exe')
  const argPath = app.getAppPath()
  const option = {
    target: targetPath,
    args: argPath,
    appUserModelId: 'org.poooi.poi',
    description: 'poi the KanColle Browser Tool',
  }
  if (!ROOT.includes('.asar')) {
    Object.assign(option, {
      icon: path.join(ROOT, 'assets', 'icons', 'poi.ico'),
      iconIndex: 0,
    })
  }
  shell.writeShortcutLink(shortcutPath, option)
}

if (dbg.isEnabled()) {
  global.SERVER_HOSTNAME = '127.0.0.1:17027'
} else {
  global.SERVER_HOSTNAME = 'poi.0u0.moe'
  process.env.NODE_ENV = 'production'
}

const platform_to_paths = {
  'win32-ia32': 'win-ia32',
  'win32-x64': 'win-x64',
  'darwin-x64': 'mac-x64',
  'linux-x64': 'linux-x64',
}

const flashPath1 = path.join(ROOT, '..', 'PepperFlash', platform_to_paths[`${process.platform}-${process.arch}`])
const flashPath2 = path.join(ROOT, 'PepperFlash', platform_to_paths[`${process.platform}-${process.arch}`])
require('flash-player-loader').debug({
  enable: dbg.isEnabled(),
  log: dbg._log,
  error: error,
}).addSource(flashPath1, '21.0.0.242').addSource(flashPath2, '21.0.0.242').load()

let mainWindow, appIcon
global.mainWindow = mainWindow = null

app.on ('window-all-closed', () => {
  shortcut.unregister()
  app.quit()
})

app.on('ready', () => {
  const {screen} = require('electron')
  shortcut.register()
  const {workArea} = screen.getPrimaryDisplay()
  let {x, y, width, height} = config.get('poi.window', workArea)
  const validate = (n, min, range) => (n != null && n >= min && n < min + range)
  const withinDisplay = (d) => {
    const wa = d.workArea
    return validate(x, wa.x, wa.width) && validate(y, wa.y, wa.height)
  }
  if (!screen.getAllDisplays().some(withinDisplay)) {
    x = workArea.x
    y = workArea.y
  }
  if (width == null) {
    width = workArea.width
  }
  if (height == null) {
    height = workArea.height
  }
  global.mainWindow = mainWindow = new BrowserWindow({
    x: x,
    y: y,
    width: width,
    height: height,
    title: 'poi',
    icon: poiIconPath,
    resizable: config.get('poi.content.resizeable', true),
    alwaysOnTop: config.get('poi.content.alwaysOnTop', false),
    titleBarStyle: 'hidden',
    webPreferences: {
      plugins: true,
      enableLargerThanScreen: true,
    },
  })
  // Default menu
  mainWindow.reloadArea = 'kan-game webview'
  if (process.platform === 'darwin') {
    if (/electron$/i.test(process.argv[0])) {
      const icon = nativeImage.createFromPath(`${ROOT}/assets/icons/poi.png`)
      app.dock.setIcon(icon)
    }
  } else {
    mainWindow.setMenu(null)
  }
  mainWindow.loadURL(`file://${__dirname}/index.html`)
  if (config.get('poi.window.isMaximized', false)) {
    mainWindow.maximize()
  }
  if (config.get('poi.window.isFullScreen', false)) {
    mainWindow.setFullScreen(true)
  }
  if (dbg.isEnabled()) {
    mainWindow.openDevTools({
      detach: true,
    })
  }
  // Never wants navigate
  mainWindow.webContents.on('will-navigate', (e) => {
    e.preventDefault()
  })
  mainWindow.on('closed', () => {
    // Close all sub window
    require('./lib/window').closeWindows()
    mainWindow = null
  })

  // Tray icon
  if (process.platform === 'win32') {
    global.appIcon = appIcon = new Tray(poiIconPath)
    appIcon.on('click', () => {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      } else {
        mainWindow.show()
      }
    })
  }
})

ipcMain.on ('refresh-shortcut', () => {
  shortcut.unregister()
  shortcut.register()
})

// Uncaught error
process.on ('uncaughtException', (e) => {
  error(e.stack)
})
