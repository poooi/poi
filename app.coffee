global.POI_VERSION = '2.0.0'

app = require 'app'
BrowserWindow = require 'browser-window'
path = require 'path-extra'
fs = require 'fs-extra'

# Patch fs for current Electron
fs.accessSync = (filePath, mode) ->
  if fs.existsSync(filePath)
    return true
  throw new Error("ENOENT: no such file or directory, access '#{filePath}'")

# Environment
global.ROOT = __dirname
global.EXECROOT = path.join(process.execPath, '..')
global.APPDATA_PATH = path.join(app.getPath('appData'), 'poi')
if process.platform == 'darwin'
  global.EXROOT = global.APPDATA_PATH
else
  global.EXROOT = global.EXECROOT
if process.env.DEBUG?
  global.SERVER_HOSTNAME = '127.0.0.1:17027'
else
  global.SERVER_HOSTNAME = 'poi.0u0.moe'

config = require './lib/config'
proxy = require './lib/proxy'
update = require './lib/update'
{log, warn, error} = require './lib/utils'

global.mainWindow = mainWindow = null

# Proxy setting
listenPort = config.get 'poi.port', 12450
app.commandLine.appendSwitch 'proxy-server', "127.0.0.1:#{listenPort}"
app.commandLine.appendSwitch 'ignore-certificate-errors'

# Pepper Flash
if process.platform == 'linux'
  try
    fs.accessSync path.join(EXECROOT, 'PepperFlash', 'linux', 'libpepflashplayer.so')
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(EXECROOT, 'PepperFlash', 'linux', 'libpepflashplayer.so')
    app.commandLine.appendSwitch 'ppapi-flash-version', '17.0.0.188'
  catch e
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(ROOT, 'PepperFlash', 'linux', 'libpepflashplayer.so')
    app.commandLine.appendSwitch 'ppapi-flash-version', '17.0.0.188'
else if process.platform == 'win32'
  try
    fs.accessSync path.join(EXECROOT, 'PepperFlash', 'win32', 'pepflashplayer32.dll')
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(EXECROOT, 'PepperFlash', 'win32', 'pepflashplayer32.dll')
    app.commandLine.appendSwitch 'ppapi-flash-version', '17.0.0.188'
  catch e
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(ROOT, 'PepperFlash', 'win32', 'pepflashplayer32.dll')
    app.commandLine.appendSwitch 'ppapi-flash-version', '17.0.0.188'
else if process.platform == 'darwin'
  try
    fs.accessSync path.join(EXECROOT, 'PepperFlash', 'darwin', 'PepperFlashPlayer.plugin')
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(EXECROOT, 'PepperFlash', 'darwin', 'PepperFlashPlayer.plugin')
    app.commandLine.appendSwitch 'ppapi-flash-version', '17.0.0.169'
  catch e
    app.commandLine.appendSwitch 'ppapi-flash-path', path.join(ROOT, 'PepperFlash', 'darwin', 'PepperFlashPlayer.plugin')
    app.commandLine.appendSwitch 'ppapi-flash-version', '17.0.0.169'

app.on 'window-all-closed', ->
  app.quit()

app.on 'ready', ->
  screen = require 'screen'
  screenSize = screen.getPrimaryDisplay().workAreaSize
  global.mainWindow = mainWindow = new BrowserWindow
    x: config.get 'poi.window.x', 0
    y: config.get 'poi.window.y', 0
    width: config.get 'poi.window.width', screenSize.width
    height: config.get 'poi.window.height', screenSize.height
    'web-preferences':
      'web-security': false
      'plugins': true
  # Default menu in v0.27.3
  if process.versions['electron'] >= '0.27.3'
    mainWindow.setMenu null
  mainWindow.loadUrl "file://#{__dirname}/index.html"
  if process.env.DEBUG?
    mainWindow.openDevTools
      detach: true
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
