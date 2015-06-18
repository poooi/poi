Promise = require 'bluebird'
async = Promise.coroutine
colors = require 'colors'
fs = require 'fs-extra'
path = require 'path-extra'
zlib = Promise.promisifyAll require 'zlib'

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
        decoded = decoded.api_data if decoded.api_data?
        resolve decoded
      catch e
        reject e
  isStaticResource: (pathname) ->
    return pathname.startsWith('/kcs/') && pathname.indexOf('Core.swf') == -1 && pathname.indexOf('mainD2.swf') == -1
  findHack: (pathname) ->
    loc = path.join(global.ROOT, 'cache', pathname)
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
  findHackExPath: (pathname) ->
    loc = path.join(global.EXROOT, 'cache', pathname)
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
    loc = path.join(global.ROOT, 'cache', pathname)
    try
      fs.accessSync loc, fs.R_OK
      return loc
    catch
      return null
  findCacheExPath: (pathname) ->
    loc = path.join(global.EXROOT, 'cache', pathname)
    try
      fs.accessSync loc, fs.R_OK
      return loc
    catch
      return null
  setBounds: (options) ->
    global.mainWindow.setBounds options
  getBounds: ->
    global.mainWindow.getBounds()
  capturePageInMainWindow: (rect, callback) ->
    global.mainWindow.capturePage rect, (image) ->
      try
        buf = image.toPng()
        now = new Date()
        date = "#{now.getFullYear()}-#{now.getMonth()}-#{now.getDate()}T#{now.getHours()}.#{now.getMinutes()}.#{now.getSeconds()}"
        if process.platform == 'darwin'
          darwinPath = path.join path.homedir(), 'Pictures'
          fs.ensureDirSync darwinPath
          filename = path.join path.homedir(), 'Pictures', "#{date}.png"
        else
          fs.ensureDirSync path.join global.EXROOT, 'screenshots'
          filename = path.join global.EXROOT, 'screenshots', "#{date}.png"
        fs.writeFile filename, buf, (err) ->
          callback err, filename
      catch e
        callback err
