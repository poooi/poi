{globalShortcut, BrowserWindow} = require 'electron'
config = require './config'

state = []  # Window state before hide
hidden = false
registerBossKey = ->
  accelerator = config.get('poi.shortcut.bosskey', '')
  if accelerator
    globalShortcut.register accelerator, ->
      windows = BrowserWindow.getAllWindows()
      if !hidden
        # Hide all windows
        for w in windows
          state[w.id] = w.isVisible()
          w.hide()
        hidden = true
      else
        # Restore all windows
        for w in windows
          w.show() if state[w.id]
        hidden = false

registerDevToolShortcut = ->
  globalShortcut.register 'Ctrl+Shift+I', ->
    BrowserWindow.getFocusedWindow()?.openDevTools
      detach: true

module.exports =
  register: ->
    registerBossKey()
    registerDevToolShortcut()
  unregister: ->
    globalShortcut.unregisterAll()
