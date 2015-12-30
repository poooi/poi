{globalShortcut} = require 'electron'
config = require './config'
Window = require './window'

registerShortcut = (acc, desc, func) ->
  console.log "Registering shortcut: #{acc}\t=> #{desc}" if process.env.DEBUG?
  try
    globalShortcut.register acc, func
  catch err
    console.error "Failed to register shortcut[#{acc}]: #{err}"

registerBossKey = ->
  accelerator = config.get('poi.shortcut.bosskey', '')
  if accelerator
    registerShortcut accelerator, 'Boss Key', Window.toggleAllWindowsVisibility

registerDevToolShortcut = ->
  accelerator = 'Ctrl+Shift+I'
  registerShortcut accelerator, 'Open Focused Window Dev Tools', Window.openFocusedWindowDevTools

module.exports =
  register: ->
    if process.platform != 'darwin'
      registerBossKey()
      registerDevToolShortcut()
  unregister: ->
    globalShortcut.unregisterAll()
