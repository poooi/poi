# Process Command Line Arguments
{warn} = require './utils'

# At this stage we only support a few flags,
# so it's OK to process them one by one like this
# If one day we need to process more command line arguments,
# it's better to find a 3rd party command line library to do this job.

# Pre-process Arguments
ignore2ndArg = false
reElectron = /electron$/i
reVersion = /^-(-version|v)$/i
printVersionAndExit = ->
  {app} = require('electron')
  console.log "#{app.getName()} v#{app.getVersion()}".bold.blue,
    "(electron v#{process.versions.electron}, \
      node v#{process.versions.node}, \
      chrome v#{process.versions.chrome}, \
      react v#{require('react').version})".cyan
  app.exit 0
preprocessArg = (arg, idx) ->
  switch
    when idx is 0
      ignore2ndArg = true if reElectron.test arg
      return true
    when idx is 1
      return ignore2ndArg
    when reVersion.test arg
      printVersionAndExit()
      return true
    else
      return false
  false

# Parse Debug Options
reDebug = /^-(-debug|d)$/i
ex = "\\w[\\w-]*"
reDebugEx = new RegExp "^--debug-extra=#{ex}(,#{ex})*$", 'i'
reDebugExD = new RegExp "^--debug-extra-d=#{ex}(,#{ex})*$", 'i'
reExtra = new RegExp "#{ex}(?=,|$)", 'gi'
exOpts = new Set
parseDebugOptions = (arg) ->
  switch
    when reDebug.test arg then process.env.DEBUG = 1
    when reDebugEx.test arg then exOpts.add opt for opt in arg.match reExtra
    when reDebugExD.test arg then exOpts.delete opt for opt in arg.match reExtra
    else return false
  true


process.argv.forEach (arg, idx) ->
  switch
    when preprocessArg(arg, idx) then return
    when parseDebugOptions(arg) then return
    # when parseWhateverOtherOptions(arg) then return
    else warn "Invalid argument (ignored): #{arg}"


if process.env.DEBUG?
  console.log "[DEBUG] Debug Mode Enabled".cyan
if exOpts.size > 0
  process.env.DEBUG_EXTRA = Array.from(exOpts).join ','
  console.log "[DEBUG] Extra Options: #{process.env.DEBUG_EXTRA}".cyan
