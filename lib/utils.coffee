Promise = require 'bluebird'
async = Promise.coroutine
colors = require 'colors'
fs = require 'fs-extra'
path = require 'path-extra'
zlib = Promise.promisifyAll require 'zlib'

cacheDir = 'MyCache'

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
  resolveBody: (encoding, body) ->
    return new Promise async (resolve, reject) ->
      try
        decoded = null
        switch encoding
          when 'gzip'
            decoded = yield zlib.gunzipAsync body
          when 'deflate'
            decoded = yield zlib.inflateAsync body
          else
            decoded = body
        decoded = decoded.toString()
        decoded = decoded.substring(7) if decoded.indexOf('svdata=') == 0
        decoded = JSON.parse decoded
        resolve decoded
      catch e
        reject e
  isStaticResource: (pathname) ->
    return pathname.startsWith('/kcs/') && pathname.indexOf('Core.swf') == -1
  findHack: (pathname) ->
    loc = path.join(global.EXROOT, cacheDir, pathname)
    sp = loc.split '.'
    ext = sp.pop()
    sp.push 'hack'
    sp.push ext
    loc = sp.join '.'
    try
      fs.accessSync loc, fs.R_OK
      return loc
    catch
      return null
  findCache: (pathname) ->
    loc = path.join(global.EXROOT, cacheDir, pathname)
    try
      fs.accessSync loc, fs.R_OK
      return loc
    catch
      return null
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
