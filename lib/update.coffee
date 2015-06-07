Promise = require 'bluebird'
async = Promise.coroutine
path = Promise.promisifyAll require 'path-extra'
fs = Promise.promisifyAll require 'fs-extra'
request = Promise.promisifyAll require 'request'
requestAsync = Promise.promisify request
{fork} = require 'child_process'
AdmZip = require 'adm-zip'
app = require 'app'

{SERVER_HOSTNAME, ROOT} = global
{log, warn, error} = require './utils'

module.exports =
  checkUpdate: async (callback) ->
    try
      [response, body] = yield requestAsync "http://#{SERVER_HOSTNAME}/update/latest.json",
        method: 'GET'
        json: true
      if response.statusCode == 200
        callback body
      else
        callback 'error'
    catch e
      error e
      callback 'error'
  update: async (info, callback) ->
    try
      {version, url} = info
      [response, body] = yield requestAsync url,
        method: 'GET'
        encoding: null
        gzip: true
      if response.statusCode != 200
        return callback 'error'
      tempFile = path.join(path.tempdir(), "poi-update.zip")
      yield fs.writeFileAsync tempFile, body
      child = fork(path.join(ROOT, 'lib', 'unzip-update'))
      child.on 'close', (code) ->
        log "Code: #{code}"
        callback info
    catch e
      error e
      callback 'error'
