Promise = require 'bluebird'
async = Promise.coroutine
EventEmitter = require 'events'
url = require 'url'
net = require 'net'
http = require 'http'
querystring = require 'querystring'
_ = require 'underscore'
caseNormalizer = require 'header-case-normalizer'
fs = Promise.promisifyAll require 'fs-extra'
request = Promise.promisifyAll require 'request'
requestAsync = Promise.promisify request
shadowsocks = require 'shadowsocks'
mime = require 'mime'
socks = require 'socks5-client'
SocksHttpAgent = require 'socks5-http-client/lib/Agent'

config = require './config'
{log, warn, error, resolveBody, isStaticResource, findHack, findHackExPath, findCache, findCacheExPath} = require './utils'

# Network error retries
retries = config.get 'poi.proxy.retries', 0

resolve = (req) ->
  switch config.get 'proxy.use'
    # HTTP Request via SOCKS5 proxy
    when 'socks5'
      return _.extend req,
        agentClass: SocksHttpAgent
        agentOptions:
          socksHost: config.get 'proxy.socks5.host', '127.0.0.1'
          socksPort: config.get 'proxy.socks5.port', 1080
    # HTTP Request via Shadowsocks
    when 'shadowsocks'
      return _.extend req,
        agentClass: SocksHttpAgent
        agentOptions:
          socksHost: '127.0.0.1'
          socksPort: config.get 'proxy.shadowsocks.local.port', 1080
    # HTTP Request via HTTP proxy
    when 'http'
      host = config.get 'proxy.http.host', '127.0.0.1'
      port = config.get 'proxy.http.port', 8118
      return _.extend req,
        proxy: "http://#{host}:#{port}"
    # Directly
    else
      return req

class Proxy extends EventEmitter
  constructor: ->
    super()
    @startShadowsocks()
    @load()
  # Start Shadowsocks local server
  startShadowsocks: ->
    return unless config.get('proxy.use') == 'shadowsocks'
    host = config.get 'proxy.shadowsocks.server.host', '127.0.0.1'
    port = config.get 'proxy.shadowsocks.server.port', 8388
    local = config.get 'proxy.shadowsocks.local.port', 1080
    password = config.get 'proxy.shadowsocks.password', 'PASSWORD'
    method = config.get 'proxy.shadowsocks.method', 'aes-256-cfb'
    timeout = config.get 'proxy.shadowsocks.timeout', 600000
    @sslocal = shadowsocks.createServer host, port, local, password, method, timeout, '127.0.0.1'
  load: ->
    self = @
    # HTTP Requests
    @server = http.createServer (req, res) ->
      delete req.headers['proxy-connection']
      # Disable HTTP Keep-Alive
      req.headers['connection'] = 'close'
      parsed = url.parse req.url
      isGameApi = parsed.pathname.startsWith '/kcsapi'
      cacheFile = null
      if isStaticResource(parsed.pathname)
        cacheFile = findHack(parsed.pathname) || findHackExPath(parsed.pathname) || findCache(parsed.pathname) || findCacheExPath(parsed.pathname)
      reqBody = new Buffer(0)
      # Get all request body
      req.on 'data', (data) ->
        reqBody = Buffer.concat [reqBody, data]
      req.on 'end', async ->
        try
          options =
            method: req.method
            url: req.url
            headers: req.headers
            encoding: null
            followRedirect: false
          # Add body to request
          if reqBody.length > 0
            options = _.extend options,
              body: reqBody
          # Use cache file
          if cacheFile
            data = yield fs.readFileAsync cacheFile
            res.writeHead 200,
              'Server': 'Apache'
              'Content-Length': data.length
              'Cache-Control': 'max-age=2592000, public'
              'Content-Type': mime.lookup cacheFile
            res.end data
          # Enable retry for game api
          else if isGameApi
            success = false
            for i in [0..retries]
              break if success
              try
                # Emit request event to plugins
                self.emit 'game.on.request', req.method, parsed.pathname, querystring.parse reqBody.toString()
                # Create remote request
                [response, body] = yield requestAsync resolve options
                success = true
                res.writeHead response.statusCode, response.headers
                res.end body
                # Emit response events to plugins
                resolvedBody = yield resolveBody response.headers['content-encoding'], body
                if response.statusCode == 200
                  self.emit 'game.on.response', req.method, parsed.pathname, resolvedBody, querystring.parse reqBody.toString()
                else
                  self.emit 'network.invalid.code', response.statusCode
              catch e
                error "Api failed: #{req.method} #{req.url} #{e.toString()}"
                self.emit 'network.error.retry', i + 1 if i < retries
              # Delay 3s for retry
              yield Promise.delay(3000) unless success
          else
            [response, body] = yield requestAsync resolve options
            res.writeHead response.statusCode, response.headers
            res.end body
          if parsed.pathname in ['/kcs/mainD2.swf', '/kcsapi/api_start2', '/kcsapi/api_get_member/basic']
            self.emit 'game.start'
          else if req.url.startsWith 'http://www.dmm.com/netgame/social/application/-/purchase/=/app_id=854854/payment_id='
            self.emit 'game.payitem'
        catch e
          error "#{req.method} #{req.url} #{e.toString()}"
    # HTTPS Requests
    @server.on 'connect', (req, client, head) ->
      delete req.headers['proxy-connection']
      # Disable HTTP Keep-Alive
      req.headers['connection'] = 'close'
      remoteUrl = url.parse "https://#{req.url}"
      remote = null
      switch config.get 'proxy.use'
        when 'socks5'
          # Write data directly to SOCKS5 proxy
          remote = socks.createConnection
            socksHost: config.get 'proxy.socks5.host', '127.0.0.1'
            socksPort: config.get 'proxy.socks5.port', 1080
            host: remoteUrl.hostname
            port: remoteUrl.port
          remote.on 'connect', ->
            client.write "HTTP/1.1 200 Connection Established\r\nConnection: close\r\n\r\n"
            remote.write head
          client.on 'data', (data) ->
            remote.write data
          remote.on 'data', (data) ->
            client.write data
        # Write data directly to Shadowsocks
        when 'shadowsocks'
          remote = socks.createConnection
            socksHost: config.get '127.0.0.1'
            socksPort: config.get 'proxy.shadowsocks.local.port', 1080
            host: remoteUrl.hostname
            port: remoteUrl.port
          remote.on 'connect', ->
            client.write "HTTP/1.1 200 Connection Established\r\nConnection: close\r\n\r\n"
            remote.write head
          client.on 'data', (data) ->
            remote.write data
          remote.on 'data', (data) ->
            client.write data
        # Write data directly to HTTP proxy
        when 'http'
          host = config.get 'proxy.http.host', '127.0.0.1'
          port = config.get 'proxy.http.port', 8118
          # Write header to http proxy
          msg = "CONNECT #{remoteUrl.hostname}:#{remoteUrl.port} HTTP/#{req.httpVersion}\r\n"
          for k, v of req.headers
            msg += "#{caseNormalizer(k)}: #{v}\r\n"
          msg += "\r\n"
          remote = net.connect port, host, ->
            remote.write msg
            remote.write head
            client.pipe remote
            remote.pipe client
        # Connect to remote directly
        else
          remote = net.connect remoteUrl.port, remoteUrl.hostname, ->
            client.write "HTTP/1.1 200 Connection Established\r\nConnection: close\r\n\r\n"
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
