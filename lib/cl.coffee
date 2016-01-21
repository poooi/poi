# Process Command Line Arguments

# At this stage we only support a few flags,
# so it's OK to process them one by one like this
# If one day we need to process more command line arguments,
# it's better to find a 3rd party command line library to do this job.

# Pre-process Arguments
ignore2ndArg = false
reElectron = /electron$/i
preprocessArg = (arg, idx) ->
  switch idx
    when 0
      ignore2ndArg = true if reElectron.test arg
      return true
    when 1
      return true if ignore2ndArg
    else
      return false
  false

# Parse Debug Options
reDebug = /^-(-debug|d)$/i
reDebugEx = /^--debug-extra=\w[\w-]*(,\w[\w-]*)*$/i
parseDebugOptions = (arg) ->
  if reDebug.test arg
    process.env.DEBUG = 1
    true
  else if reDebugEx.test arg
    if process.env.DEBUG_EXTRA?
      process.env.DEBUG_EXTRA += ','
    else
      process.env.DEBUG_EXTRA = ''
    process.env.DEBUG_EXTRA += arg.split("=")[1]
    true
  else
    false


process.argv.forEach (arg, idx) ->
  switch
    when preprocessArg(arg, idx) then return
    when parseDebugOptions(arg) then return
    else console.warn "Invalid argument (ignored): #{arg}"


if process.env.DEBUG?
  console.log "Debug Mode"
if process.env.DEBUG_EXTRA?
  console.log "Extra Debugging Options: #{process.env.DEBUG_EXTRA}"
