{globalShortcut} = require 'electron'
config = require './config'
Window = require './window'

log = (acc, usage) ->
  console.log "Registering shortcut: #{acc}\t=> #{usage}" if process.env.DEBUG?

registerBossKey = ->
  accelerator = config.get('poi.shortcut.bosskey', '')
  if accelerator
    log accelerator, 'Boss Key'
    globalShortcut.register accelerator, Window.toggleAllWindowsVisibility

registerDevToolShortcut = ->
  accelerator = 'Ctrl+Shift+I'
  log accelerator, 'Open Focused Window Dev Tools'
  globalShortcut.register accelerator, Window.openFocusedWindowDevTools

module.exports =
  register: ->
    if process.platform != 'darwin'
      registerBossKey()
      registerDevToolShortcut()
  unregister: ->
    globalShortcut.unregisterAll()
