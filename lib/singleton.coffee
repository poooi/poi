{app} = require 'electron'
{log, warn} = require './utils'

multipleInstanceAllowed = false

isValidArg = (arg) ->
  /^-(-multiple-instance|m)$/i.test arg

# This is used to check CLI args of *THIS* instance only
parseCLIArg = (arg) ->
  if isValidArg arg
    multipleInstanceAllowed = true
  else
    false

handleAnotherInstanceStarted = (argv, workingDirectory) ->
  dbg.log argv
  if argv.some isValidArg
    log "Another instance of poi has started from \"#{workingDirectory}\"."
  else
    log "Another instance of poi is trying to start from \"#{workingDirectory}\" and should quit."
    # The documented `app.show()` for OSX does not actually exist (electron v0.36.7)
    # `app.focus()` is not documented, the api may change at any time
    app.focus?()
    if (mainWindow = global.mainWindow)?
      mainWindow.show()
      mainWindow.restore() if mainWindow.isMinimized()
      mainWindow.focus()
  true

makeSingleInstance = ->
  if app.makeSingleInstance handleAnotherInstanceStarted
    if multipleInstanceAllowed
      dbg.log 'Starting multiple instances of poi...'
    else
      warn 'Poi is already running. Will quit this process...'
      require('electron').dialog.showErrorBox('Poi is already running', 'This process will quit now.')
      app.quit()


exports.parseCLIArg = parseCLIArg
exports.makeSingleInstance = makeSingleInstance
