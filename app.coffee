{app, BrowserWindow} = require 'electron'
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

# Debug setting
app.commandLine.appendSwitch 'enable-logging'

# Disable HA
disableHA = config.get 'poi.disableHA', false
if disableHA
  app.commandLine.appendSwitch 'disable-gpu'

# Proxy setting
listenPort = config.get 'poi.port', 12450
app.commandLine.appendSwitch 'proxy-server', "127.0.0.1:#{listenPort}"
app.commandLine.appendSwitch 'ignore-certificate-errors'
app.commandLine.appendSwitch 'ssl-version-fallback-min', "tls1"

# Pepper Flash
if process.platform == 'linux'
  try
    fs.accessSync path.join(EXECROOT, 'PepperFlash', 'linux', 'libpepflashplayer.so')
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(EXECROOT, 'PepperFlash', 'linux', 'libpepflashplayer.so')
    app.commandLine.appendSwitch 'ppapi-flash-version', '19.0.0.226'
  catch e
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(ROOT, 'PepperFlash', 'linux', 'libpepflashplayer.so')
    app.commandLine.appendSwitch 'ppapi-flash-version', '19.0.0.226'
else if process.platform == 'win32'
  try
    fs.accessSync path.join(EXECROOT, 'PepperFlash', 'win32', 'pepflashplayer.dll')
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(EXECROOT, 'PepperFlash', 'win32', 'pepflashplayer.dll')
    app.commandLine.appendSwitch 'ppapi-flash-version', '19.0.0.219'
  catch e
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(ROOT, 'PepperFlash', 'win32', 'pepflashplayer.dll')
    app.commandLine.appendSwitch 'ppapi-flash-version', '19.0.0.219'
else if process.platform == 'darwin'
  try
    fs.accessSync path.join(EXECROOT, 'PepperFlash', 'darwin', 'PepperFlashPlayer.plugin')
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(EXECROOT, 'PepperFlash', 'darwin', 'PepperFlashPlayer.plugin')
    app.commandLine.appendSwitch 'ppapi-flash-version', '19.0.0.226'
  catch e
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(ROOT, 'PepperFlash', 'darwin', 'PepperFlashPlayer.plugin')
    app.commandLine.appendSwitch 'ppapi-flash-version', '19.0.0.226'

app.on 'window-all-closed', ->
  shortcut.unregister()
  app.quit()

app.on 'ready', ->
  if process.platform != 'darwin'
    shortcut.register()
  {screen} = require 'electron'
  screenSize = screen.getPrimaryDisplay().workAreaSize
  global.mainWindow = mainWindow = new BrowserWindow
    x: config.get 'poi.window.x', 0
    y: config.get 'poi.window.y', 0
    width: config.get 'poi.window.width', screenSize.width
    height: config.get 'poi.window.height', screenSize.height
    'title-bar-style': 'hidden'
    'web-preferences':
      'web-security': false
      'plugins': true
  # Default menu in v0.27.3
  if process.versions['electron'] >= '0.27.3'
    if process.platform == 'darwin'
      mainWindow.reloadArea = 'kan-game webview'
    else
      mainWindow.setMenu null
  mainWindow.loadURL "file://#{__dirname}/index.html"
  if process.env.DEBUG?
    mainWindow.openDevTools
      detach: true
  # Never wants navigate
  mainWindow.webContents.on 'will-navigate', (e) ->
    e.preventDefault()
  mainWindow.on 'close', ->
    # Save current position and size
    bounds = mainWindow.getBounds()
    config.set 'poi.window', bounds
  mainWindow.on 'closed', ->
    # Close all sub window
    require('./lib/window').closeWindows()
    mainWindow = null

# Uncaught error
process.on 'uncaughtException', (e) ->
  error e
