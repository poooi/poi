import bluebird from 'bluebird'
import EventEmitter from 'events'
import url from 'url'
import net from 'net'
import http from 'http'
import path from 'path'
import querystring from 'querystring'
import caseNormalizer from 'header-case-normalizer'
import request from 'request'
import mime from 'mime'
import socks from 'socks5-client'
import SocksHttpAgent from 'socks5-http-client/lib/Agent'
import PacProxyAgent from 'pac-proxy-agent'
import { app } from 'electron'
import config from './config'
import { log, error } from './utils'

const {ROOT} = global

const fs = bluebird.promisifyAll(require('fs-extra'))
const zlib = bluebird.promisifyAll(require('zlib'))

const resolveBody = (encoding, body) => {
  return new Promise(async (resolve, reject) => {
    try {
      let decoded = null
      switch (encoding) {
      case 'gzip':
        decoded = await zlib.gunzipAsync(body)
        break
      case 'deflate':
        decoded = await zlib.inflateAsync(body)
        break
      default:
        decoded = body
      }
      decoded = decoded.toString()
      if (decoded.indexOf('svdata=') === 0) {
        decoded = decoded.substring(7)
      }
      decoded = JSON.parse(decoded)
      resolve(decoded)
    } catch (e) {
      reject(e)
    }
  })
}
const isStaticResource = (pathname, hostname) => {
  if (pathname.startsWith('/kcs/') && pathname.indexOf('Core.swf') === -1) {
    return true
  }
  if (pathname.startsWith('/gadget/')) {
    return true
  }
  if (pathname.startsWith('/kcscontents/')) {
    return true
  }
  if (hostname.match('kanpani.jp')) {
    return true
  }
  if (hostname.match('assets.shiropro-re.net')) {
    return true
  }
  if (hostname.match('swordlogic.com')) {
    return true
  }
  if (hostname.match('dugrqaqinbtcq.cloudfront.net')) {
    return true
  }
  if (hostname.match('static.touken-ranbu.jp')) {
    return true
  }
  return false
}
const getCachePath = (pathname) => {
  const dir = config.get('poi.cachePath', global.DEFAULT_CACHE_PATH)
  return path.join(dir, pathname)
}
const findHack = (pathname) => {
  let loc = getCachePath(path.join('KanColle', pathname))
  const sp = loc.split('.')
  const ext = sp.pop()
  sp.push('hack')
  sp.push(ext)
  loc = sp.join('.')
  try {
    fs.accessSync(loc, fs.R_OK)
    return loc
  } catch (e) {
    if (e.code !== 'ENOENT')
      console.error(`error while loading hack file ${loc}`,e)
    return null
  }
}
const findCache = (pathname, hostname) => {
  let loc
  if (hostname.match('kanpani.jp')) {
    loc = getCachePath(path.join('Kanpani', pathname))
  } else if (hostname.match('assets.shiropro-re.net')) {
    loc = getCachePath(path.join('ShiroPro', pathname))
  } else if (hostname.match('swordlogic.com')) {
    loc = getCachePath(path.join('Shinken', pathname.replace(/^\/[0-9]{10}/, '')))
  } else if (hostname.match('dugrqaqinbtcq.cloudfront.net')) {
    loc = getCachePath(path.join('FlowerKnightGirls', pathname))
  } else if (hostname.match('static.touken-ranbu.jp')) {
    loc = getCachePath(path.join('ToukenRanbu', pathname))
  } else {
    loc = getCachePath(path.join('KanColle', pathname))
  }
  try {
    fs.accessSync(loc, fs.R_OK)
    return loc
  } catch (error) {
    return null
  }
}

const PacAgents = {}
const resolve = (req) => {
  switch (config.get('proxy.use')) {
  // HTTP Request via SOCKS5 proxy
  case 'socks5':
    return Object.assign(req, {
      agentClass: SocksHttpAgent,
      agentOptions: {
        socksHost: config.get('proxy.socks5.host', '127.0.0.1'),
        socksPort: config.get('proxy.socks5.port', 1080),
      },
    })
  // HTTP Request via HTTP proxy
  case 'http': {
    const host = config.get('proxy.http.host', '127.0.0.1')
    const port = config.get('proxy.http.port', 8118)
    const requirePassword = config.get('proxy.http.requirePassword', false)
    const username = config.get('proxy.http.username', '')
    const password = config.get('proxy.http.password', '')
    const useAuth = (requirePassword && username !== '' && password !== '')
    const strAuth = `${username}:${password}@`
    return Object.assign(req, {
      proxy: `http://${useAuth ? strAuth : ''}${host}:${port}`,
    })
  }
  // PAC
  case 'pac': {
    const uri = config.get('proxy.pacAddr')
    if (!PacAgents[uri]) {
      PacAgents[uri] = new PacProxyAgent(uri)
    }
    return Object.assign(req, {
      agent: PacAgents[uri],
    })
  }
  // Directly
  default:
    return req
  }
}

const isKancolleGameApi = (pathname) => (pathname.startsWith('/kcsapi'))

class Proxy extends EventEmitter {
  constructor() {
    super()
    this.load()
  }
  load = () => {
    const serverList = fs.readJsonSync(path.join(ROOT, 'assets', 'data', 'server.json'))
    let currentServer = null
    // HTTP Requests
    this.server = http.createServer((req, res) => {
      delete req.headers['proxy-connection']
      // Disable HTTP Keep-Alive
      req.headers['connection'] = 'close'
      const parsed = url.parse(req.url)
      const isGameApi = parsed.pathname.startsWith('/kcsapi')
      if (isGameApi && serverList[parsed.hostname] && currentServer !== serverList[parsed.hostname].num) {
        currentServer = serverList[parsed.hostname].num
        this.emit('network.get.server', Object.assign(serverList[parsed.hostname], {
          ip: parsed.hostname,
        }))
      }
      let cacheFile = null
      if (isStaticResource(parsed.pathname, parsed.hostname)) {
        cacheFile = findHack(parsed.pathname) || findCache(parsed.pathname, parsed.hostname)
      }
      let reqBody = Buffer.alloc(0)
      // Get all request body
      req.on ('data', (data) => {
        reqBody = Buffer.concat([reqBody, data])
      })
      req.on('end', async () => {
        let domain, pathname, requrl
        try {
          let options = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            encoding: null,
            followRedirect: false,
          }
          // Add body to request
          if (reqBody.length > 0) {
            options = Object.assign(options, {
              body: reqBody,
            })
          }
          // Use cache file
          if (cacheFile){
            const stats = await fs.statAsync(cacheFile)
            // Cache is new
            if (req.headers['if-modified-since'] && (new Date(req.headers['if-modified-since']) >= stats.mtime)) {
              res.writeHead(304, {
                'Server': 'nginx',
                'Last-Modified': stats.mtime.toGMTString(),
              })
              res.end()
            } else {
              // Cache is old
              const data = await fs.readFileAsync(cacheFile)
              res.writeHead(200, {
                'Server': 'nginx',
                'Content-Length': data.length,
                'Content-Type': mime.lookup(cacheFile),
                'Last-Modified': stats.mtime.toGMTString(),
              })
              res.end(data)
            }
          } else {
            // Enable retry for game api
            domain = req.headers.origin
            pathname = parsed.pathname
            requrl = req.url
            let success = false
            const retryConfig = config.get('proxy.retries', 0)
            const retries = retryConfig < 0 ? 0 : retryConfig
            for (let i = 0; i <= retries; i++) {
              if (success) {
                break
              }
              // Delay 3s for retry
              if (i) {
                await bluebird.delay(3000)
              }
              try {
                // Emit request event to plugins
                reqBody = JSON.stringify(querystring.parse(reqBody.toString()))
                this.emit('network.on.request', req.method, [domain, pathname, requrl], reqBody, Date.now())
                // Create remote request
                const [response, body] = await new Promise((promise_resolve, promise_reject) => {
                  request(resolve(options), (err, res_response, res_body) => {
                    if (!err) {
                      promise_resolve([res_response, res_body])
                    } else {
                      promise_reject(err)
                    }
                  }).pipe(res)
                })
                success = true
                let resolvedBody = null
                // Emit response events to plugins
                try {
                  resolvedBody = await resolveBody(response.headers['content-encoding'], body)
                } catch (e) {
                  // Unresolveable binary files are not retried
                  break
                }
                if (resolvedBody === null) {
                  throw new Error('Empty Body')
                }
                if (response.statusCode == 200) {
                  this.emit('network.on.response', req.method, [domain, pathname, requrl], JSON.stringify(resolvedBody), reqBody, Date.now())
                } else {
                  this.emit('network.error', [domain, pathname, requrl], response.statusCode)
                }
              } catch (e) {
                success = false
                error(`Connection failed: ${req.method} ${req.url} ${e.toString()}`)
                if (i !== retries) {
                  this.emit('network.error.retry', [domain, pathname, requrl], i + 1)
                }
              }
              if (success || !isKancolleGameApi(pathname)) {
                res.end()
                break
              }
            }
          }
        } catch (e) {
          error(`${req.method} ${req.url} ${e.toString()}`)
          this.emit('network.error', [domain, pathname, requrl])
        }
      })
    })
    // HTTPS Requests
    this.server.on('connect', (req, client, head) => {
      delete req.headers['proxy-connection']
      // Disable HTTP Keep-Alive
      req.headers['connection'] = 'close'
      const remoteUrl = url.parse(`https://${req.url}`)
      let remote = null
      switch (config.get('proxy.use')) {
      case 'socks5': {
        // Write data directly to SOCKS5 proxy
        remote = socks.createConnection({
          socksHost: config.get('proxy.socks5.host', '127.0.0.1'),
          socksPort: config.get('proxy.socks5.port', 1080),
          host: remoteUrl.hostname,
          port: remoteUrl.port,
        })
        remote.on ('connect', () => {
          client.write("HTTP/1.1 200 Connection Established\r\nConnection: close\r\n\r\n")
          remote.write(head)
        })
        client.on('data', (data) => {
          remote.write(data)
        })
        remote.on('data', (data) => {
          client.write(data)
        })
        break
      }
      case 'http': {
        // Write data directly to HTTP proxy
        const host = config.get('proxy.http.host', '127.0.0.1')
        const port = config.get('proxy.http.port', 8118)
        // Write header to http proxy
        let msg = `CONNECT ${remoteUrl.hostname}:${remoteUrl.port} HTTP/${req.httpVersion}\r\n`
        for (const k in req.headers) {
          msg += `${caseNormalizer(k)}: ${req.headers[k]}\r\n`
        }
        msg += "\r\n"
        remote = net.connect(port, host, () => {
          remote.write(msg)
          remote.write(head)
          client.pipe(remote)
          remote.pipe(client)
        })
        break
      }
      default: {
        // Connect to remote directly
        remote = net.connect(remoteUrl.port, remoteUrl.hostname, () => {
          client.write("HTTP/1.1 200 Connection Established\r\nConnection: close\r\n\r\n")
          remote.write(head)
          client.pipe(remote)
          remote.pipe(client)
        })
      }
      }
      client.on('end', () => {
        remote.end()
      })
      remote.on('end', () => {
        client.end()
      })
      client.on('error', (e) => {
        error(e)
        remote.destroy()
      })
      remote.on('error', (e) => {
        error(e)
        client.destroy()
      })
      client.on('timeout', () => {
        client.destroy()
        remote.destroy()
      })
      remote.on('timeout', () => {
        client.destroy()
        remote.destroy()
      })
    })
    this.server.on('error', (err) => {
      error(err)
    })
    const listenPort = config.get('proxy.port', 0)
    this.server.listen(listenPort, '127.0.0.1', () => {
      this.port = this.server.address().port
      app.commandLine.appendSwitch('proxy-server', `127.0.0.1:${this.port}`)
      app.commandLine.appendSwitch('ignore-certificate-errors')
      app.commandLine.appendSwitch('ssl-version-fallback-min', "tls1")
      log(`Proxy listening on ${this.port}`)
    })
  }
}

export default new Proxy()
