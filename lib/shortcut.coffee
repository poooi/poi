{globalShortcut} = require 'electron'
config = require './config'
Window = require './window'

registerShortcut = (acc, desc, func) ->
  dbg.log "Registering shortcut: #{acc}\t=> #{desc}"
  try
    globalShortcut.register acc, func
    true
  catch err
    console.error "Failed to register shortcut[#{acc}]: #{err}"
    false

registerBossKey = ->
  accelerator = config.get 'poi.shortcut.bosskey', ''
  if accelerator
    if !registerShortcut accelerator, 'Boss Key', Window.toggleAllWindowsVisibility
      config.set 'poi.shortcut.bosskey', ''

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
