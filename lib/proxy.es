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
import PacProxyAgent from 'pac-proxy-agent'
import { app } from 'electron'
import util from 'util'
import { gunzip, inflate } from 'zlib'
import fs from 'fs-extra'

import SocksHttpAgent from './socks-http-agent'
import config from './config'
import { log, error } from './utils'

const { ROOT } = global

const gunzipAsync = util.promisify(gunzip)
const inflateAsync = util.promisify(inflate)

const resolveBody = async (encoding, body) => {
  let decoded = null
  switch (encoding) {
    case 'gzip':
      decoded = await gunzipAsync(body)
      break
    case 'deflate':
      decoded = await inflateAsync(body)
      break
    default:
      decoded = body
  }
  decoded = decoded.toString()
  if (decoded.indexOf('svdata=') === 0) {
    decoded = decoded.substring(7)
  }
  decoded = JSON.parse(decoded)
  return decoded
}

const delay = time => new Promise(res => setTimeout(res, time))

const isStaticResource = (pathname, hostname) => {
  if (pathname.startsWith('/kcs2/')) {
    return true
  }
  if (pathname.startsWith('/kcs/')) {
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

const getCachePath = pathname => {
  const dir = config.get('poi.misc.cache.path', global.DEFAULT_CACHE_PATH)
  return path.join(dir, pathname)
}

const findHack = pathname => {
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
    if (e.code !== 'ENOENT') console.error(`error while loading hack file ${loc}`, e)
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
const resolveProxy = req => {
  switch (config.get('proxy.use')) {
    // HTTP Request via SOCKS5 proxy
    case 'socks5':
      return {
        ...req,
        agentClass: SocksHttpAgent,
        agentOptions: {
          socksHost: config.get('proxy.socks5.host', '127.0.0.1'),
          socksPort: config.get('proxy.socks5.port', 1080),
        },
      }
    // HTTP Request via HTTP proxy
    case 'http': {
      const host = config.get('proxy.http.host', '127.0.0.1')
      const port = config.get('proxy.http.port', 8118)
      const requirePassword = config.get('proxy.http.requirePassword', false)
      const username = config.get('proxy.http.username', '')
      const password = config.get('proxy.http.password', '')
      const useAuth = requirePassword && username !== '' && password !== ''
      const strAuth = `${username}:${password}@`
      return {
        ...req,
        proxy: `http://${useAuth ? strAuth : ''}${host}:${port}`,
      }
    }
    // PAC
    case 'pac': {
      const uri = config.get('proxy.pacAddr')
      if (!PacAgents[uri]) {
        PacAgents[uri] = new PacProxyAgent(uri)
      }
      return {
        ...req,
        agent: PacAgents[uri],
      }
    }
    // Directly
    default:
      return req
  }
}

const isKancolleGameApi = pathname => pathname.startsWith('/kcsapi')

class Proxy extends EventEmitter {
  serverInfo = {}

  serverList = fs.readJsonSync(path.join(ROOT, 'assets', 'data', 'server.json'))

  getServerInfo = () => this.serverInfo

  load = () => {
    // HTTP Requests
    this.server = http.createServer(this.createServer)
    // HTTPS Requests
    this.server.on('connect', this.onConnect)
    this.server.on('error', error)
    const listenPort = config.get('proxy.port', 0)
    this.server.listen(
      listenPort,
      config.get('proxy.allowLAN', false) ? '0.0.0.0' : '127.0.0.1',
      () => {
        this.port = this.server.address().port
        app.commandLine.appendSwitch('proxy-server', `127.0.0.1:${this.port}`)
        app.commandLine.appendSwitch(
          'proxy-bypass-list',
          '<local>;*.google-analytics.com;*.doubleclick.net',
        )
        app.commandLine.appendSwitch('ignore-certificate-errors')
        app.commandLine.appendSwitch('ssl-version-fallback-min', 'tls1')
        log(`Proxy listening on ${this.port}`)
      },
    )
  }

  createServer = (req, res) => {
    // Disable HTTP Keep-Alive
    delete req.headers['proxy-connection']
    req.headers['connection'] = 'close'

    const parsed = url.parse(req.url)

    // Update server status
    if (isKancolleGameApi(parsed.pathname) && this.serverInfo.ip !== parsed.hostname) {
      if (this.serverList[parsed.hostname]) {
        this.serverInfo = {
          ...this.serverList[parsed.hostname],
          ip: parsed.hostname,
        }
      } else {
        this.serverInfo = {
          num: -1,
          name: '__UNKNOWN',
          ip: parsed.hostname,
        }
      }
    }

    // Find cachefile for static resource
    const cacheFile = isStaticResource(parsed.pathname, parsed.hostname)
      ? findHack(parsed.pathname) || findCache(parsed.pathname, parsed.hostname)
      : false

    // Get all request body
    let reqBody = Buffer.alloc(0)
    req.on('data', data => {
      reqBody = Buffer.concat([reqBody, data])
    })

    // Make request
    req.on('end', async () => {
      const domain = req.headers.origin
      const pathname = parsed.pathname
      const requrl = req.url

      const retryConfig = config.get('proxy.retries', 0)
      const retries = retryConfig < 0 ? 0 : retryConfig

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
          options = {
            ...options,
            body: reqBody,
          }
        }

        // Use cache file
        if (cacheFile) {
          this.useCache(req, res, cacheFile)
        } else {
          let count = 0
          while (count <= retries) {
            const { success, retry, error } = await this.sendRequest({
              req,
              res,
              reqBody,
              domain,
              pathname,
              requrl,
              options,
            })
            if (success) {
              res.end()
              break
            } else if (retry && count < retries) {
              count++
              await delay(3000)
            } else {
              res.end()
              throw error
            }
          }
        }
      } catch (e) {
        error(`${req.method} ${req.url} ${e.toString()}`)
        this.emit('network.error', [domain, pathname, requrl])
      }
    })
  }

  useCache = async (req, res, cacheFile) => {
    const stats = await fs.stat(cacheFile)
    // Cache is new
    if (
      req.headers['if-modified-since'] &&
      new Date(req.headers['if-modified-since']) >= stats.mtime
    ) {
      res.writeHead(304, {
        Server: 'nginx',
        'Last-Modified': stats.mtime.toGMTString(),
      })
      res.end()
    } else {
      // Cache is old
      const data = await fs.readFile(cacheFile)
      res.writeHead(200, {
        Server: 'nginx',
        'Content-Length': data.length,
        'Content-Type': mime.getType(cacheFile),
        'Last-Modified': stats.mtime.toGMTString(),
      })
      res.end(data)
    }
  }

  sendRequest = async ({ req, res, reqBody, domain, pathname, requrl, options }) => {
    try {
      // Emit request event to plugins
      reqBody = JSON.stringify(querystring.parse(reqBody.toString()))
      this.emit('network.on.request', req.method, [domain, pathname, requrl], reqBody, Date.now())

      // Create remote request
      const [response, body] = await new Promise((pResolve, pReject) => {
        request(resolveProxy(options), (err, rRes, rBody) => {
          if (!err) {
            pResolve([rRes, rBody])
          } else {
            pReject(err)
          }
        }).pipe(res)
      })

      // Parse response
      const resolvedBody = await resolveBody(response.headers['content-encoding'], body).catch(
        e => null,
      )

      if (response.statusCode == 200 && resolvedBody !== null) {
        this.emit(
          'network.on.response',
          req.method,
          [domain, pathname, requrl],
          JSON.stringify(resolvedBody),
          reqBody,
          Date.now(),
        )
      } else if (response.statusCode != 200) {
        this.emit('network.error', [domain, pathname, requrl], response.statusCode)
      }
      return {
        success: true,
      }
    } catch (e) {
      if (!isKancolleGameApi(pathname)) {
        return {
          success: false,
          retry: false,
          error: e,
        }
      }
      return {
        success: false,
        retry: true,
        error: e,
      }
    }
  }

  onConnect = (req, client, head) => {
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
        remote.on('connect', () => {
          client.write('HTTP/1.1 200 Connection Established\r\nConnection: close\r\n\r\n')
          remote.write(head)
        })
        client.on('data', data => {
          remote.write(data)
        })
        remote.on('data', data => {
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
        msg += '\r\n'
        remote = net.connect(
          port,
          host,
          () => {
            remote.write(msg)
            remote.write(head)
            client.pipe(remote)
            remote.pipe(client)
          },
        )
        break
      }
      default: {
        // Connect to remote directly
        remote = net.connect(
          remoteUrl.port,
          remoteUrl.hostname,
          () => {
            client.write('HTTP/1.1 200 Connection Established\r\nConnection: close\r\n\r\n')
            remote.write(head)
            client.pipe(remote)
            remote.pipe(client)
          },
        )
      }
    }
    client.on('end', () => {
      remote.end()
    })
    remote.on('end', () => {
      client.end()
    })
    client.on('error', e => {
      error(e)
      remote.destroy()
    })
    remote.on('error', e => {
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
  }
}

const poiProxy = new Proxy()
poiProxy.load()

export default poiProxy
