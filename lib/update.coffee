Promise = require 'bluebird'
async = Promise.coroutine
path = Promise.promisifyAll require 'path-extra'
fs = Promise.promisifyAll require 'fs-extra'
request = Promise.promisifyAll require 'request'
requestAsync = Promise.promisify request
{spawnSync} = require 'child_process'
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
      dir = path.join(ROOT)
      tempdir = path.join(ROOT, '..', "poi-update-#{version}")
      fs.ensureDirSync tempdir
      yield fs.writeFileAsync tempFile, body
      zip = new AdmZip tempFile
      zip.extractAllTo tempdir, true
      switch process.platform
        when 'win32'
          spawnSync 'move', ['/Y', tempdir, dir]
        when 'linux', 'darwin'
          spawnSync 'mv', [tempdir, dir]
      callback info
    catch e
      error e
      callback 'error'
