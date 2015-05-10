Promise = require 'bluebird'
async = Promise.coroutine
EventEmitter = require 'events'
url = require 'url'
net = require 'net'
http = require 'http'
_ = require 'underscore'
request = Promise.promisifyAll require 'request'
requestAsync = Promise.promisify request
socks = require 'socks5-client'
SocksHttpAgent = require 'socks5-http-client/lib/Agent'
config = require './config'
{log, warn, error} = require './utils'
resolve = (req) ->
  switch config.get 'proxy.use'
    when 'socks5'
      return _.extend req,
        agentClass: SocksHttpAgent
        agentOptions:
          socksHost: config.get 'proxy.socks5.host', '127.0.0.1'
          socksPort: config.get 'proxy.socks5.port', 1080
    when 'http'
      return _.extend req,
        proxy: "http://#{config.get 'proxy.http.host', '127.0.0.1'}:#{config.get 'proxy.http.port', 8118}"
    else
      return req
class Proxy extends EventEmitter
  constructor: ->
    super()
    @load()
  load: ->
    # HTTP Requests
    @server = http.createServer async (req, res) ->
      log "#{req.method} #{req.url}"
      # Patch proxy-connection
      delete req.headers['proxy-connection']
      req.headers['connection'] = 'close'
      # With request body
      if req.method == 'PUT' || req.method == 'POST' || req.method == 'PATCH' || req.method == 'OPTIONS'
        reqBody = new Buffer(0)
        req.on 'data', (data) ->
          reqBody = Buffer.concat [reqBody, data]
        req.on 'end', async ->
          try
            options =
              method: req.method
              url: req.url
              headers: req.headers
              encoding: null
            if reqBody.length > 0
              options = _.extend options,
                body: reqBody
            [response, body] = yield requestAsync resolve options
            res.writeHead response.statusCode, response.headers
            res.end body
          catch e
            error "#{req.method} #{req.url} #{e.toString()}"
      else
        try
          [response, body] = yield requestAsync resolve
            method: req.method
            url: req.url
            headers: req.headers
            encoding: null
            followRedirect: false
          res.writeHead response.statusCode, response.headers
          res.end body
        catch e
          error "#{req.method} #{req.url} #{e.toString()}"
    # HTTPS Requests
    @server.on 'connect', (req, client, head) ->
      log "CONNECT #{req.url}"
      remoteUrl = url.parse "https://#{req.url}"
      remote = null
      switch config.get 'proxy.use'
        when 'socks5'
          remote = socks.createConnection
            socksHost: config.get 'proxy.socks5.host', '127.0.0.1'
            socksPort: config.get 'proxy.socks5.port', 1080
            host: remoteUrl.hostname
            port: remoteUrl.port
          remote.on 'connect', ->
            client.write "HTTP/1.1 200 Connection Established\r\nConnection: close\r\nProxy-Agent: poi\r\n\r\n"
            remote.write head
          client.on 'data', (data) ->
            remote.write data
          remote.on 'data', (data) ->
            client.write data
        else
          remote = net.connect remoteUrl.port, remoteUrl.hostname, ->
            client.write "HTTP/1.1 200 Connection Established\r\nConnection: close\r\nProxy-Agent: poi\r\n\r\n"
            remote.write head
            client.pipe remote
            remote.pipe client
      client.on 'end', ->
        remote.end()
      remote.on 'end', ->
        client.end()
      client.on 'error', (e) ->
        error e
        remote.destroy()
      remote.on 'error', (e) ->
        error e
        client.destroy()
      client.on 'timeout', ->
        client.destroy()
        remote.destroy()
      remote.on 'timeout', ->
        client.destroy()
        remote.destroy()
    listenPort = config.get 'poi.port', 12450
    @server.listen listenPort, ->
      log "Proxy listening on #{listenPort}"
module.exports = new Proxy()
