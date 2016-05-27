{app, BrowserWindow, ipcMain, Tray, screen} = require 'electron'
path = require 'path-extra'
fs = require 'fs-extra'

# Environment
global.POI_VERSION = app.getVersion()
global.ROOT = __dirname
global.EXECROOT = path.join(process.execPath, '..')
global.APPDATA_PATH = path.join(app.getPath('appData'), 'poi')
global.EXROOT = global.APPDATA_PATH
global.DEFAULT_CACHE_PATH = path.join(global.EXROOT, 'MyCache')
global.MODULE_PATH = path.join(global.ROOT, "node_modules")

CONST = require './lib/constant'
config = require './lib/config'
proxy = require './lib/proxy'
proxy.setMaxListeners 30
update = require './lib/update'
shortcut = require './lib/shortcut'
{log, warn, error} = require './lib/utils'

poiIconPath = path.join ROOT, 'assets', 'icons', 'poi.ico'

# Add shortcut to start menu when os is windows
app.setAppUserModelId 'org.poi.poi'
if process.platform == 'win32' && config.get 'poi.createShortcut', true
  windowsShortcuts = require 'windows-shortcuts-appid'
  shortcutPath = app.getPath('appData') + "\\Microsoft\\Windows\\Start Menu\\Programs\\poi.lnk"
  targetPath = app.getPath('exe')
  argPath = app.getAppPath()
  try
    fs.accessSync shortcutPath
    windowsShortcuts.edit shortcutPath, {target: targetPath, args: argPath}, ->
      windowsShortcuts.addAppId shortcutPath, 'org.poi.poi'
  catch error
    try
      windowsShortcuts.create shortcutPath, {target: targetPath, args: argPath}, ->
         windowsShortcuts.addAppId shortcutPath, 'org.poi.poi'

if dbg.isEnabled()
  global.SERVER_HOSTNAME = '127.0.0.1:17027'
else
  global.SERVER_HOSTNAME = 'poi.0u0.moe'

global.mainWindow = mainWindow = null

flashPath1 = path.join ROOT, 'PepperFlash', process.platform
flashPath2 = path.join EXECROOT, 'PepperFlash', process.platform
require('flash-player-loader').debug(
  enable: dbg.isEnabled()
  log: dbg._log
  error: error
).addSource(flashPath1).addSource(flashPath2).load()

app.on 'window-all-closed', ->
  shortcut.unregister()
  app.quit()

app.on 'ready', ->
  shortcut.register()
  {workArea} = screen.getPrimaryDisplay()
  {x, y, width, height} = config.get 'poi.window', workArea
  validate = (n, min, range) ->
    n? and n >= min and n < min + range
  withinDisplay = (d) ->
    wa = d.workArea
    validate(x, wa.x, wa.width) and validate(y, wa.y, wa.height)
  if not screen.getAllDisplays().some withinDisplay
    {x, y} = workArea
  width ?= workArea.width
  height ?= workArea.height
  global.mainWindow = mainWindow = new BrowserWindow
    x: x
    y: y
    width: width
    height: height
    icon: poiIconPath
    resizable: config.get 'poi.content.resizeable', true
    alwaysOnTop: config.get 'poi.content.alwaysOnTop', false
    titleBarStyle: 'hidden'
    webPreferences:
      webSecurity: false
      plugins: true
      enableLargerThanScreen: true

  # Default menu
  mainWindow.reloadArea = 'kan-game webview'

  mainWindow.loadURL "file://#{__dirname}/index.html"
  if config.get 'poi.window.isMaximized', false
    mainWindow.maximize()
  if config.get 'poi.window.isFullScreen', false
    mainWindow.setFullScreen(true)
  if dbg.isEnabled()
    mainWindow.openDevTools
      detach: true
  # Never wants navigate
  mainWindow.webContents.on 'will-navigate', (e) ->
    e.preventDefault()
  mainWindow.on 'closed', ->
    # Close all sub window
    require('./lib/window').closeWindows()
    mainWindow = null

  # Tray icon
  if process.platform == 'win32'
    global.appIcon = appIcon = new Tray(poiIconPath)
    appIcon.on 'click', ->
      win = mainWindow
      if win.isMinimized() then win.restore() else win.show()

ipcMain.on 'refresh-shortcut', ->
  shortcut.unregister()
  shortcut.register()

# Uncaught error
process.on 'uncaughtException', (e) ->
  error e
