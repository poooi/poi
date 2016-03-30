Promise = require 'bluebird'
async = Promise.coroutine
request = Promise.promisifyAll require 'request'
requestAsync = Promise.promisify request, multiArgs: true

{POI_VERSION, ROOT} = global
{log, warn, error} = require './utils'

module.exports =
  checkUpdate: async (callback) ->
    try
      [response, body] = yield requestAsync "http://#{global.SERVER_HOSTNAME}/update/latest.json",
        method: 'GET'
        json: true
        headers:
          'User-Agent': "poi v#{POI_VERSION}"
      if response.statusCode == 200
        callback body
      else
        callback 'error'
    catch e
      error e
      callback 'error'
