{app, BrowserWindow} = require 'electron'
path = require 'path-extra'
fs = require 'fs-extra'
ipcMain = require("electron").ipcMain

# Environment
global.POI_VERSION = app.getVersion()
global.ROOT = __dirname
global.EXECROOT = path.join(process.execPath, '..')
global.APPDATA_PATH = path.join(app.getPath('appData'), 'poi')
global.EXROOT = global.APPDATA_PATH
global.DEFAULT_CACHE_PATH = path.join(global.EXROOT, 'MyCache')
global.MODULE_PATH = path.join(global.ROOT, "node_modules")

# TODO: Remove in the next release
if process.platform == 'win32'
  try
    fs.copySync path.join(global.EXECROOT, 'config.cson'),
      path.join(global.EXROOT, 'config.cson'),
      clobber: false
  catch
    # expected EEXIST

# Add shortcut to start menu when os is windows
app.setAppUserModelId 'org.poi.poi'
if process.platform == 'win32'
  windowsShortcuts = require 'windows-shortcuts-appid'
  shortcutPath = app.getPath('appData') + "\\Microsoft\\Windows\\Start Menu\\Programs\\poi.lnk"
  targetPath = app.getPath('exe')
  argPath = app.getAppPath()
  try
    fs.accessSync shortcutPath
    windowsShortcuts.edit shortcutPath, {target: targetPath, args: argPath}, ->
      windowsShortcuts.addAppId shortcutPath, 'org.poi.poi'
  catch error
    windowsShortcuts.create shortcutPath, {target: targetPath, args: argPath}, ->
       windowsShortcuts.addAppId shortcutPath, 'org.poi.poi'


if process.env.DEBUG?
  global.SERVER_HOSTNAME = '127.0.0.1:17027'
else
  global.SERVER_HOSTNAME = 'poi.0u0.moe'

CONST = require './lib/constant'
config = require './lib/config'
proxy = require './lib/proxy'
proxy.setMaxListeners 30
update = require './lib/update'
shortcut = require './lib/shortcut'
{log, warn, error} = require './lib/utils'

global.mainWindow = mainWindow = null

# Disable HA
disableHA = config.get 'poi.disableHA', false
if disableHA
  app.commandLine.appendSwitch 'disable-gpu'

pepperFlashData =
  linux:
    filename: 'libpepflashplayer.so'
    version: '20.0.0.248'
  win32:
    filename: 'pepflashplayer.dll'
    version: '20.0.0.248'
  darwin:
    filename: 'PepperFlashPlayer.plugin'
    version: '20.0.0.248'

pepperFlashData = pepperFlashData[process.platform]
innerFlashPath = path.join 'PepperFlash', process.platform, pepperFlashData.filename
defaultFlashPath = path.join EXECROOT, innerFlashPath
try
  fs.accessSync defaultFlashPath
  app.commandLine.appendSwitch 'ppapi-flash-path', defaultFlashPath
  app.commandLine.appendSwitch 'ppapi-flash-version', pepperFlashData.version
catch
  app.commandLine.appendSwitch 'ppapi-flash-path', path.join(ROOT, innerFlashPath)
  app.commandLine.appendSwitch 'ppapi-flash-version', pepperFlashData.version

app.on 'window-all-closed', ->
  shortcut.unregister()
  app.quit()

limitWindow = (poiWindow, workArea) ->
  if poiWindow.x + poiWindow.width <= workArea.x ||
      poiWindow.x >= workArea.x + workArea.width
    poiWindow.x = workArea.x
  if poiWindow.y + poiWindow.height <= workArea.y ||
      poiWindow.y >= workArea.y + workArea.height
    poiWindow.y = workArea.y

app.on 'ready', ->
  shortcut.register()
  {screen} = require 'electron'
  screenSize = screen.getPrimaryDisplay().workAreaSize
  poiWindow = config.get 'poi.window', {}
  poiWindow.x ?= 0
  poiWindow.y ?= 0
  poiWindow.width ?= screenSize.width
  poiWindow.height ?= screenSize.height
  limitWindow poiWindow, screen.getPrimaryDisplay().workArea
  global.mainWindow = mainWindow = new BrowserWindow Object.assign poiWindow,
    resizable: config.get 'poi.content.resizeable', true
    alwaysOnTop: config.get 'poi.content.alwaysOnTop', false
    'title-bar-style': 'hidden'
    'web-preferences':
      'web-security': false
      'plugins': true
      'enableLargerThanScreen': true
  # Default menu in v0.27.3
  if process.versions['electron'] >= '0.27.3'
    if process.platform == 'darwin'
      mainWindow.reloadArea = 'kan-game webview'
    else
      mainWindow.setMenu null
  mainWindow.loadURL "file://#{__dirname}/index.html"
  if config.get 'poi.window.isMaximized', false
    mainWindow.maximize()
  if config.get 'poi.window.isFullScreen', false
    mainWindow.setFullScreen(true)
  if process.env.DEBUG?
    mainWindow.openDevTools
      detach: true
  # Never wants navigate
  mainWindow.webContents.on 'will-navigate', (e) ->
    e.preventDefault()
  mainWindow.on 'closed', ->
    # Close all sub window
    require('./lib/window').closeWindows()
    mainWindow = null

ipcMain.on 'refresh-shortcut', ->
  shortcut.unregister()
  shortcut.register()

# Uncaught error
process.on 'uncaughtException', (e) ->
  error e
