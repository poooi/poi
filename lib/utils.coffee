colors = require 'colors'

stringify = (str) ->
  return str if typeof str == 'string'
  if str.toString() == '[object Object]'
    str = JSON.stringify str
  else
    str = str.toString()
  return str

module.exports =
  log: (str) ->
    str = stringify str
    console.log "[INFO] #{str}"
  warn: (str) ->
    str = stringify str
    console.log "[WARN] #{str}".yellow
  error: (str) ->
    str = stringify str
    console.log "[ERROR] #{str}".bold.red
