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
    console.log "[WARN] #{str}".yellow
  error: (str) ->
    str = stringify str
    console.log "[ERROR] #{str}".bold.red
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
  findHackExecPath: (pathname) ->
    loc = path.join(global.EXECROOT, 'cache', pathname)
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
  findCacheExecPath: (pathname) ->
    loc = path.join(global.EXECROOT, 'cache', pathname)
    try
      fs.accessSync loc, fs.R_OK
      return loc
    catch
      return null
  setBounds: (options) ->
    global.mainWindow.setBounds options
  getBounds: ->
    global.mainWindow.getBounds()
