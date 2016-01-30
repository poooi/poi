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

# Proxy setting
listenPort = config.get 'poi.port', 12450
app.commandLine.appendSwitch 'proxy-server', "127.0.0.1:#{listenPort}"
app.commandLine.appendSwitch 'ignore-certificate-errors'
app.commandLine.appendSwitch 'ssl-version-fallback-min', "tls1"

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

app.on 'ready', ->
  shortcut.register()
  {screen} = require 'electron'
  screenSize = screen.getPrimaryDisplay().workAreaSize
  global.mainWindow = mainWindow = new BrowserWindow
    x: config.get 'poi.window.x', 0
    y: config.get 'poi.window.y', 0
    width: config.get 'poi.window.width', screenSize.width
    height: config.get 'poi.window.height', screenSize.height
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
