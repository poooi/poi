_ = require 'underscore'
{BrowserWindow} = require 'electron'
global.windows = windows = []
forceClose = false
module.exports =
  createWindow: (options) ->
    options = _.extend options,
      show: false
      'web-preferences':
        'web-security': false
        'plugins': true
    current = new BrowserWindow options
    # Default menu in v0.27.3
    if process.versions['electron'] >= '0.27.3'
      current.setMenu options.menu || null
      current.reloadArea = null
    show = current.show
    current.show = ->
      if current.isMinimized()
        current.restore()
      else
        show.bind(current)()
    # Close window really
    if options.realClose
      current.on 'closed', (e) ->
        idx = _.indexOf windows, current
        windows.splice idx, 1
    else if options.forceMinimize
      current.on 'close', (e) ->
        current.minimize()
        e.preventDefault() unless forceClose
    else
      current.on 'close', (e) ->
        if current.isFullScreen()
          current.once 'leave-full-screen', current.hide
          current.setFullScreen(false)
        else
          current.hide()
        e.preventDefault() unless forceClose
    # Draggable
    unless options.navigatable
      current.webContents.on 'will-navigate', (e) ->
        e.preventDefault()
    windows.push current
    return current
  # Warning: Don't call this method manually
  # It will be called before mainWindow closed
  closeWindows: ->
    forceClose = true
    for win, i in windows
      continue unless win?
      win.close()
      windows[i] = null
  rememberMain: ->
    win = global.mainWindow
    isFullScreen = win.isFullScreen()
    win.setFullScreen(false) if isFullScreen
    isMaximized = win.isMaximized() # This must be checked AFTER exiting full screen
    win.unmaximize() if isMaximized
    b = win.getBounds()
    b.isFullScreen = isFullScreen
    b.isMaximized = isMaximized
    require('./config').set 'poi.window', b
