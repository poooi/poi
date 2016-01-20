# Process Command Line Arguments

# At this stage we only support a few flags,
# so it's OK to process them one by one like this
# If one day we need to process more command line arguments,
# it's better to find a 3rd party command line library to do this job.
patternDebug = /^-(-debug|d)$/i
patternDebugEx = /^--debug-extra=\w[\w-]*(,\w[\w-]*)*$/i
process.argv.forEach (arg) ->
  if patternDebug.test(arg)
    process.env.DEBUG = 1
    console.log "Debug Mode"
  else if patternDebugEx.test(arg)
    name = arg.split("=")[1]
    process.env.DEBUG_EXTRA = name
    console.log "Debugging Extra: #{name}"
