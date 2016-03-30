# Process Command Line Arguments
{warn} = require './utils'
Debug = require './debug'

# At this stage we only support a few flags,
# so it's OK to process them one by one like this
# If one day we need to process more command line arguments,
# it's better to find a 3rd party command line library to do this job.

# Pre-process Arguments
ignore2ndArg = false
reElectron = /electron(.exe)?$/i
preprocessArg = (arg, idx) ->
  switch
    when idx is 0
      ignore2ndArg = true if reElectron.test arg
      return true
    when idx is 1
      return ignore2ndArg
    else
      return false
  false

# Print Version Info to Console and Exit
printVersionAndExit = ->
  {app} = require('electron')
  console.log "#{app.getName()} v#{app.getVersion()}".bold.blue,
    "(electron v#{process.versions.electron}, \
      node v#{process.versions.node}, \
      chrome v#{process.versions.chrome}, \
      react v#{require('react').version})".cyan
  app.exit 0
reVersion = /^-(-version|v)$/i
checkShowVersion = (arg) ->
  return false if not reVersion.test arg
  printVersionAndExit()

# Parse Debug Options
reDebug = /^-(?:-debug(?:=(true|false))?|d)$/i
ex = "[A-Za-z_]\\w*"
reDebugEx = new RegExp "^--debug-extra=#{ex}(,#{ex})*$", 'i'
reDebugExD = new RegExp "^--debug-extra-d=#{ex}(,#{ex})*$", 'i'
reExtra = new RegExp "#{ex}(?=,|$)", 'gi'
reDebugBrk = /^--debug-brk$/ # CLI for node. You'll need node debugger to continue.
parseDebugOptions = (arg) ->
  switch
    when reDebug.test arg then Debug.setEnabled(reDebug.exec(arg)[1] isnt 'false')
    when reDebugEx.test arg then Debug.enableExtra opt for opt in arg.match reExtra
    when reDebugExD.test arg then Debug.disableExtra opt for opt in arg.match reExtra
    when reDebugBrk.test arg then Debug.enableExtra 'brk'
    else return false
  true

# Process Command Line Arguments one by one
process.argv.forEach (arg, idx) ->
  switch
    when preprocessArg(arg, idx) then return
    when checkShowVersion(arg) then return
    when parseDebugOptions(arg) then return
    # when parseWhateverOtherOptions(arg) then return
    # else - unrecognized argument, just ignore.

# Finish initialization of debug environment
Debug.init()
global.dbg = Debug
