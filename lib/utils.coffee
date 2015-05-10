Promise = require 'bluebird'
async = Promise.coroutine
colors = require 'colors'
zlib = Promise.promisifyAll require 'zlib'

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
