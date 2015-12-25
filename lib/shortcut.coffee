{globalShortcut, BrowserWindow} = require 'electron'
config = require './config'
# Window state before hide
state = []
hidden = false
module.exports =
  register: ->
    bosskey = config.get('poi.shortcut.bosskey', '')
    if bosskey
      globalShortcut.register bosskey, ->
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
    globalShortcut.register 'Ctrl+Shift+I', ->
      BrowserWindow.getFocusedWindow()?.openDevTools
        detach: true
  unregister: ->
    globalShortcut.unregisterAll()
