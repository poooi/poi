Promise = require 'bluebird'
async = Promise.coroutine
zlib = Promise.promisifyAll require 'zlib'
EventEmitter = require 'events'
url = require 'url'
net = require 'net'
http = require 'http'
path = require 'path'
querystring = require 'querystring'
_ = require 'underscore'
caseNormalizer = require 'header-case-normalizer'
fs = Promise.promisifyAll require 'fs-extra'
request = Promise.promisifyAll require 'request'
requestAsync = Promise.promisify request, multiArgs: true
mime = require 'mime'
socks = require 'socks5-client'
SocksHttpAgent = require 'socks5-http-client/lib/Agent'
PacProxyAgent = require 'pac-proxy-agent'
{app} = require 'electron'

config = require './config'
{log, warn, error} = require './utils'

resolveBody = (encoding, body) ->
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
      resolve decoded
    catch e
      reject e
isStaticResource = (pathname, hostname) ->
  # KanColle
  return true if pathname.startsWith('/kcs/') && pathname.indexOf('Core.swf') == -1
  return true if pathname.startsWith('/gadget/')
  return true if pathname.startsWith('/kcscontents/')
  # Kanpani
  return true if hostname?.match('kanpani.jp')?
  # ShiroPro
  return true if hostname?.match('assets.shiropro-re.net')?
  # Shinken
  return true if hostname?.match('swordlogic.com')?
  # FlowerKnightGirl
  return true if hostname?.match('dugrqaqinbtcq.cloudfront.net')?
  # ToukenRanbu
  return true if hostname?.match('static.touken-ranbu.jp')?
  # Not Static Resource
  return false
getCachePath = (pathname) ->
  dir = config.get 'poi.cachePath', global.DEFAULT_CACHE_PATH
  path.join dir, pathname
findHack = (pathname) ->
  loc = getCachePath path.join 'kancolle', pathname
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
findCache = (pathname, hostname) ->
  if hostname?.match('kanpani.jp')?
    # Kanpani
    loc = getCachePath path.join 'kanpani', pathname
  else if hostname?.match('assets.shiropro-re.net')?
    # ShiroPro
    loc = getCachePath path.join 'shiropro', pathname
  else if hostname?.match('swordlogic.com')?
    # Shinken
    loc = getCachePath path.join 'Shinken', pathname.replace(/^\/[0-9]{10}/, '')
  else if hostname?.match('dugrqaqinbtcq.cloudfront.net')?
    # FlowerKnightGirl
    loc = getCachePath path.join 'flowerknight', pathname
  else if hostname?.match('static.touken-ranbu.jp')?
    # ToukenRanbu
    loc = getCachePath path.join 'tokenranbu', pathname
  else
    # KanColle
    loc = getCachePath path.join 'kancolle', pathname
  try
    fs.accessSync loc, fs.R_OK
    return loc
  catch
    return null

# Network error retries
retries = config.get 'poi.proxy.retries', 0

PacAgents = {}
resolve = (req) ->
  switch config.get 'proxy.use'
    # HTTP Request via SOCKS5 proxy
    when 'socks5'
      return _.extend req,
        agentClass: SocksHttpAgent
        agentOptions:
          socksHost: config.get 'proxy.socks5.host', '127.0.0.1'
          socksPort: config.get 'proxy.socks5.port', 1080
    # HTTP Request via HTTP proxy
    when 'http'
      host = config.get 'proxy.http.host', '127.0.0.1'
      port = config.get 'proxy.http.port', 8118
      requirePassword = config.get 'proxy.http.requirePassword', false
      username = config.get 'proxy.http.username', ''
      password = config.get 'proxy.http.password', ''
      useAuth = requirePassword && username isnt '' && password isnt ''
      strAuth = "#{username}:#{password}@"
      return _.extend req,
        proxy: "http://#{if useAuth then strAuth else ''}#{host}:#{port}"
    # PAC
    when 'pac'
      uri = config.get('proxy.pacAddr')
      PacAgents[uri] ?= new PacProxyAgent(uri)
      _.extend req,
        agent: PacAgents[uri]
    # Directly
    else
      return req

isKancolleGameApi = (pathname) ->
  pathname.startsWith '/kcsapi'

class Proxy extends EventEmitter
  constructor: ->
    super()
    @load()
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
      if isStaticResource(parsed.pathname, parsed.hostname)
        cacheFile = findHack(parsed.pathname) || findCache(parsed.pathname, parsed.hostname)
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
            stats = yield fs.statAsync cacheFile
            # Cache is new
            if req.headers['if-modified-since']? && (new Date(req.headers['if-modified-since']) >= stats.mtime)
              res.writeHead 304,
                'Server': 'nginx'
                'Last-Modified': stats.mtime.toGMTString()
              res.end()
            # Cache is old
            else
              data = yield fs.readFileAsync cacheFile
              res.writeHead 200,
                'Server': 'nginx'
                'Content-Length': data.length
                'Content-Type': mime.lookup cacheFile
                'Last-Modified': stats.mtime.toGMTString()
              res.end data
          # Enable retry for game api
          else
            domain = req.headers.origin
            pathname = parsed.pathname
            requrl = req.url
            success = false
            for i in [0..retries]
              break if success
              try
                # Emit request event to plugins
                reqBody = JSON.stringify(querystring.parse reqBody.toString())
                self.emit 'network.on.request', req.method, [domain, pathname, requrl], reqBody
                # Create remote request
                [response, body] = yield requestAsync resolve options
                success = true
                res.writeHead response.statusCode, response.headers
                res.end body
                # Emit response events to plugins
                try
                  resolvedBody = yield resolveBody response.headers['content-encoding'], body
                catch e
                  # Unresolveable binary files are not retried
                  break
                if !resolvedBody?
                  throw new Error('Empty Body')
                if response.statusCode == 200
                  self.emit 'network.on.response', req.method, [domain, pathname, requrl], JSON.stringify(resolvedBody),  reqBody
                else
                  self.emit 'network.error', [domain, pathname, requrl], response.statusCode
              catch e
                error "Api failed: #{req.method} #{req.url} #{e.toString()}"
                self.emit 'network.error.retry', [domain, pathname, requrl], i + 1 if i < retries
              if success || !isKancolleGameApi pathname
                break
              # Delay 3s for retry
              yield Promise.delay(3000)
        catch e
          error "#{req.method} #{req.url} #{e.toString()}"
          self.emit 'network.error', [domain, pathname, requrl]
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
    @server.on 'error', (err) =>
      error err
    listenPort = config.get('proxy.port', 0)
    @server.listen listenPort, '127.0.0.1', =>
      @port = @server.address().port
      app.commandLine.appendSwitch 'proxy-server', "127.0.0.1:#{@port}"
      app.commandLine.appendSwitch 'ignore-certificate-errors'
      app.commandLine.appendSwitch 'ssl-version-fallback-min', "tls1"
      log "Proxy listening on #{@port}"

module.exports = new Proxy()
