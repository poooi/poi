colors = require 'colors'
fs = require 'fs-extra'
path = require 'path-extra'

stringify = (str) ->
  return str if typeof str == 'string'
  if str.toString() == '[object Object]'
    str = JSON.stringify str
  else
    str = str.toString()
  return str

module.exports =
  remoteStringify: JSON.stringify
  log: (str) ->
    str = stringify str
    console.log "[INFO] #{str}"
  warn: (str) ->
    str = stringify str
    console.warn "[WARN] #{str}".yellow
  error: (str) ->
    str = stringify str
    console.error "[ERROR] #{str}".bold.red
  setBounds: (options) ->
    global.mainWindow.setBounds options
  getBounds: ->
    global.mainWindow.getBounds()
  capturePageInMainWindow: (rect, scpath, callback) ->
    global.mainWindow.capturePage rect, (image) ->
      try
        buf = image.toPng()
        now = new Date()
        date = "#{now.getFullYear()}-#{now.getMonth() + 1}-#{now.getDate()}T#{now.getHours()}.#{now.getMinutes()}.#{now.getSeconds()}"
        fs.ensureDirSync scpath
        filename = path.join scpath, "#{date}.png"
        fs.writeFile filename, buf, (err) ->
          callback err, filename
      catch e
        callback err
