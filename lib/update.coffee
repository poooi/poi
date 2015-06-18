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
