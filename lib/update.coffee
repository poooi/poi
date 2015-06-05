Promise = require 'bluebird'
async = Promise.coroutine
path = Promise.promisifyAll require 'path-extra'
fs = Promise.promisifyAll require 'fs-extra'
request = Promise.promisifyAll require 'request'
requestAsync = Promise.promisify request
AdmZip = require 'adm-zip'

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
      if response.statusCode == 200
        callback body
      else
        callback 'error'
      tempFile = path.join(path.tempdir(), "poi-update-#{version}.zip")
      dir = path.join(ROOT, '..')
      yield fs.writeFileAsync tempFile, body
      zip = new AdmZip tempFile
      zip.extractAllTo dir, true
      callback info
    catch e
      error e
      callback 'error'
