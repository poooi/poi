app = require 'app'
BrowserWindow = require 'browser-window'
{join} = require 'path-extra'
fs = require 'fs-extra'
Menu = require 'menu'
{openExternal} = require 'shell'

# Environment
global.POI_VERSION = app.getVersion()
global.ROOT = __dirname
global.EXECROOT = join(process.execPath, '..')
global.APPDATA_PATH = join(app.getPath('appData'), 'poi')
if process.platform == 'darwin'
  global.EXROOT = global.APPDATA_PATH
else
  global.EXROOT = global.EXECROOT
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

# Proxy setting
listenPort = config.get 'poi.port', 12450
app.commandLine.appendSwitch 'proxy-server', "127.0.0.1:#{listenPort}"
app.commandLine.appendSwitch 'ignore-certificate-errors'

# Pepper Flash
if process.platform == 'linux'
  try
    fs.accessSync join(EXECROOT, 'PepperFlash', 'linux', 'libpepflashplayer.so')
    app.commandLine.appendSwitch 'ppapi-flash-path', join(EXECROOT, 'PepperFlash', 'linux', 'libpepflashplayer.so')
    app.commandLine.appendSwitch 'ppapi-flash-version', '18.0.0.209'
  catch e
    app.commandLine.appendSwitch 'ppapi-flash-path', join(ROOT, 'PepperFlash', 'linux', 'libpepflashplayer.so')
    app.commandLine.appendSwitch 'ppapi-flash-version', '18.0.0.209'
else if process.platform == 'win32'
  try
    fs.accessSync join(EXECROOT, 'PepperFlash', 'win32', 'pepflashplayer32.dll')
    app.commandLine.appendSwitch 'ppapi-flash-path', join(EXECROOT, 'PepperFlash', 'win32', 'pepflashplayer32.dll')
    app.commandLine.appendSwitch 'ppapi-flash-version', '18.0.0.209'
  catch e
    app.commandLine.appendSwitch 'ppapi-flash-path', join(ROOT, 'PepperFlash', 'win32', 'pepflashplayer32.dll')
    app.commandLine.appendSwitch 'ppapi-flash-version', '18.0.0.209'
else if process.platform == 'darwin'
  try
    fs.accessSync join(EXECROOT, 'PepperFlash', 'darwin', 'PepperFlashPlayer.plugin')
    app.commandLine.appendSwitch 'ppapi-flash-path', join(EXECROOT, 'PepperFlash', 'darwin', 'PepperFlashPlayer.plugin')
    app.commandLine.appendSwitch 'ppapi-flash-version', '18.0.0.209'
  catch e
    app.commandLine.appendSwitch 'ppapi-flash-path', join(ROOT, 'PepperFlash', 'darwin', 'PepperFlashPlayer.plugin')
    app.commandLine.appendSwitch 'ppapi-flash-version', '18.0.0.209'
# Set Menu
template = [
  {
    label: 'Poi'
    submenu: [
      {
        label: '关于 Poi'
        selector: 'orderFrontStandardAboutPanel:'
      }
      { type: 'separator' }
      {
        label: '服务'
        submenu: []
      }
      { type: 'separator' }
      {
        label: '隐藏 Poi'
        accelerator: 'Cmd+H'
        selector: 'hide:'
      }
      {
        label: '隐藏其他'
        accelerator: 'Cmd+Shift+H'
        selector: 'hideOtherApplications:'
      }
      {
        label: '显示全部'
        selector: 'unhideAllApplications:'
      }
      { type: 'separator' }
      {
        label: '退出'
        accelerator: 'Cmd+Q'
        selector: 'terminate:'
      }
    ]
  }
  {
    label: '编辑'
    submenu: [
      {
        label: '撤销'
        accelerator: 'Cmd+Z'
        selector: 'undo:'
      }
      {
        label: '重做'
        accelerator: 'Shift+Cmd+Z'
        selector: 'redo:'
      }
      { type: 'separator' }
      {
        label: '剪切'
        accelerator: 'Cmd+X'
        selector: 'cut:'
      }
      {
        label: '拷贝'
        accelerator: 'Cmd+C'
        selector: 'copy:'
      }
      {
        label: '粘贴'
        accelerator: 'Cmd+V'
        selector: 'paste:'
      }
      {
        label: '全选'
        accelerator: 'Cmd+A'
        selector: 'selectAll:'
      }
    ]
  }
  {
    label: '显示'
    submenu: [
      {
        label: '重新载入页面'
        accelerator: 'Cmd+R'
        click: ->
          webview.reload()
          return

      }
      {
        label: '掉落统计'
        click: ->
          openExternal 'db.kcwiki.moe/drop'
          return
      }
      {
        label: '停止'
        accelerator: 'Cmd+.'
        click: ->
          webview.stop()
          return

      }
      {
        label: '显示开发者工具'
        accelerator: 'Alt+Cmd+I'
        click: ->
          webview.openDevTools()
          return
      }
    ]
  }
  {
    label: '窗口'
    submenu: [
      {
        label: '最小化'
        accelerator: 'Cmd+M'
        selector: 'performMiniaturize:'
      }
      { type: 'separator' }
      {
        label: '前置全部窗口'
        selector: 'arrangeInFront:'
      }
    ]
  }
  {
    label: '帮助'
    submenu: [
      {
        label: 'wiki'
        click: ->
          openExternal 'https://github.com/poooi/poi/wiki'
          return
      }
      {
        label: "问题反馈"
        click: ->
          openExternal 'http://ask.fm/Poi_bot'
          return
      }
    ]
  }
]

app.on 'window-all-closed', ->
  shortcut.unregister()
  app.quit()

app.on 'ready', ->
  shortcut.register()
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
    if process.platform != 'darwin'
      mainWindow.setMenu null
    else
      menu = Menu.buildFromTemplate template
      Menu.setApplicationMenu menu
  mainWindow.loadUrl "file://#{__dirname}/index.html"
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
