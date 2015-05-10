app = require 'app'
BrowserWindow = require 'browser-window'

# Environment
global.ROOT = __dirname

path = require 'path'
config = require './lib/config'
proxy = require './lib/proxy'
{log, warn, error} = require './lib/utils'

mainWindow = null

# Proxy setting
listenPort = config.get 'poi.port', 12450
app.commandLine.appendSwitch 'proxy-server', "127.0.0.1:#{listenPort}"
app.commandLine.appendSwitch 'ignore-certificate-errors'

# Pepper Flash
if process.platform == 'linux'
  app.commandLine.appendSwitch 'ppapi-flash-path', path.join(__dirname, 'PepperFlash', 'libpepflashplayer.so')
  app.commandLine.appendSwitch 'ppapi-flash-version', '17.0.0.169'
else if process.platform == 'win32'
  app.commandLine.appendSwitch 'ppapi-flash-path', path.join(__dirname, 'PepperFlash', 'pepflashplayer.dll')
  app.commandLine.appendSwitch 'ppapi-flash-version', '17.0.0.169'
else if process.platform == 'darwin'
  app.commandLine.appendSwitch 'ppapi-flash-path', path.join(__dirname, 'PepperFlash', 'PepperFlashPlayer.plugin')
  app.commandLine.appendSwitch 'ppapi-flash-version', '17.0.0.169'

app.on 'window-all-closed', ->
  app.quit() unless process.platform == 'darwin'

app.on 'ready', ->
  screen = require 'screen'
  screenSize = screen.getPrimaryDisplay().workAreaSize
  mainWindow = new BrowserWindow
    width: config.get 'window.width', screenSize.width
    height: config.get 'window.height', screenSize.height
    'web-preferences':
      'web-security': false
      'plugins': true
  mainWindow.loadUrl "file://#{__dirname}/index.html"
  mainWindow.openDevTools
    detach: true
  mainWindow.on 'closed', ->
    mainWindow = null

# Uncaught error
process.on 'uncaughtException', (e) ->
  error e
