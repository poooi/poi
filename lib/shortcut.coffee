BrowserWindow = require 'browser-window'
globalShortcut = require 'global-shortcut'
config = require './config'
# Window state before hide
state = []
hidden = false
module.exports =
  register: ->
    globalShortcut.register config.get('poi.shortcut.bosskey', 'CmdOrCtrl+p+o+i'), ->
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
  unregister: ->
    globalShortcut.unregisterAll()
