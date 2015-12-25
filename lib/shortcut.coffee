{globalShortcut, BrowserWindow} = require 'electron'
config = require './config'
Window = require './window'

registerBossKey = ->
  accelerator = config.get('poi.shortcut.bosskey', '')
  console.log accelerator
  if accelerator
    globalShortcut.register accelerator, Window.toggleAllWindowsVisibility

registerDevToolShortcut = ->
  globalShortcut.register 'Ctrl+Shift+I', Window.openFocusedWindowDevTools

module.exports =
  register: ->
    if process.platform != 'darwin'
      registerBossKey()
      registerDevToolShortcut()
  unregister: ->
    globalShortcut.unregisterAll()
