import EventEmitter from 'events'
import url from 'url'
import http, { Agent } from 'http'
import path from 'path'
import querystring from 'querystring'
import mime from 'mime'
import PacProxyAgent from 'pac-proxy-agent'
import HttpProxyAgent from 'http-proxy-agent'
import { app, session } from 'electron'
import util from 'util'
import { gunzip, inflate } from 'zlib'
import fs from 'fs-extra'

import SocksHttpAgent from './socks-http-agent'
import config from './config'
import { log, error } from './utils'

const { ROOT } = global

const gunzipAsync = util.promisify(gunzip)
const inflateAsync = util.promisify(inflate)

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

const isKancolleGameApi = pathname => pathname.startsWith('/kcsapi')

const resolveProxyUrl = () => {
  switch (config.get('proxy.use')) {
    case 'socks5': {
      const host = config.get('proxy.socks5.host', '127.0.0.1')
      const port = config.get('proxy.socks5.port', 1080)
      return `socks5://${host}:${port}`
    }
    case 'http': {
      const host = config.get('proxy.http.host', '127.0.0.1')
      const port = config.get('proxy.http.port', 8118)
      const requirePassword = config.get('proxy.http.requirePassword', false)
      const username = config.get('proxy.http.username', '')
      const password = config.get('proxy.http.password', '')
      const useAuth = requirePassword && username !== '' && password !== ''
      const strAuth = `${username}:${password}@`
      return `http://${useAuth ? strAuth : ''}${host}:${port}`
    }
    default:
      return 'direct://'
  }
}

class Proxy extends EventEmitter {
  pacAgents = {}
  socksAgents = {}
  httpAgents = {}
  serverInfo = {}
  serverList = fs.readJsonSync(path.join(ROOT, 'assets', 'data', 'server.json'))

  getServerInfo = () => this.serverInfo

  load = () => {
    // Handles http request only, https request will be passed to upstream proxy directly.
    this.server = http.createServer(this.createServer)
    this.server.on('error', error)
    const listenPort = config.get('proxy.port', 0)
    this.server.listen(
      listenPort,
      config.get('proxy.allowLAN', false) ? '0.0.0.0' : '127.0.0.1',
      () => {
        this.port = this.server.address().port
        this.setProxy()
        config.on('config.set', path => {
          if (path.startsWith('proxy')) {
            this.setProxy()
          }
        })
        app.commandLine.appendSwitch('ignore-certificate-errors')
        app.commandLine.appendSwitch('ssl-version-fallback-min', 'tls1')
      },
    )
  }

  setProxy = () => {
    const httpsProxy = resolveProxyUrl()
    const httpProxy = `http://127.0.0.1:${this.port}`
    session.defaultSession.setProxy(
      {
        proxyRules: `http=${httpProxy},direct://;https=${httpsProxy},direct://`,
        proxyBypassRules: '<local>;*.google-analytics.com;*.doubleclick.net',
      },
      () => log(`Proxy listening on ${this.port}, upstream proxy ${httpsProxy}`),
    )
  }

  updateServerInfo = urlPattern => {
    if (isKancolleGameApi(urlPattern.pathname) && this.serverInfo.ip !== urlPattern.hostname) {
      if (this.serverList[urlPattern.hostname]) {
        this.serverInfo = {
          ...this.serverList[urlPattern.hostname],
          ip: urlPattern.hostname,
        }
      } else {
        this.serverInfo = {
          num: -1,
          name: '__UNKNOWN',
          ip: urlPattern.hostname,
        }
      }
    }
  }

  createServer = async (req, res) => {
    const urlPattern = url.parse(req.url)

    // Prepare request headers
    if (req.headers['proxy-connection'] && !req.headers['connection']) {
      req.headers['connection'] = req.headers['proxy-connection']
      delete req.headers['proxy-connection']
    } else if (!req.headers['connection']) {
      req.headers['connection'] = 'close'
    }
    const keepAlive = req.headers['connection'] === 'keep-alive'

    // Update kancolle server info
    this.updateServerInfo(urlPattern)

    // Find cachefile for static resource
    const cacheFile = isStaticResource(urlPattern.pathname, urlPattern.hostname)
      ? findHack(urlPattern.pathname) || findCache(urlPattern.pathname, urlPattern.hostname)
      : false

    // Prepare request options
    const rawReqBody = await this.fetchRequest(req)
    const reqBody = JSON.stringify(querystring.parse(rawReqBody.toString()))
    const reqOption = this.getRequestOption(urlPattern, req, keepAlive)
    const requestInfo = [req.headers.origin, urlPattern.pathname, req.url]

    // Emit request event
    this.emit('network.on.request', req.method, requestInfo, reqBody, Date.now())

    try {
      if (cacheFile) {
        // Use cache file
        this.useCache(req, res, cacheFile)
      } else {
        // Retry for kancolle api
        let count = 0
        const retryConfig = config.get('proxy.retries', 0)
        const retries = retryConfig < 0 ? 0 : retryConfig
        while (count <= retries) {
          const { statusCode, data, error } = await this.fetchResponse(reqOption, rawReqBody, res)
          if (error) {
            if (count === retries || !isKancolleGameApi(urlPattern.pathname)) {
              res.end()
              throw error
            }
            count++
            this.emit('network.error.retry', requestInfo, count)
            await delay(3000)
          } else {
            res.end()
            if (statusCode == 200 && data != null) {
              this.emit('network.on.response', req.method, requestInfo, data, reqBody, Date.now())
            } else if (statusCode != 200) {
              this.emit('network.error', requestInfo, statusCode)
            }
            break
          }
        }
      }
    } catch (e) {
      error(`${req.method} ${req.url} ${e.toString()}`)
      this.emit('network.error', requestInfo)
    }
  }

  fetchRequest = req =>
    new Promise(resolve => {
      const reqBody = []
      req.on('data', chunk => {
        reqBody.push(chunk)
      })
      req.on('end', () => {
        resolve(Buffer.concat(reqBody))
      })
    })

  getRequestOption = (urlPattern, req, keepAlive = false) => {
    const options = {
      hostname: urlPattern.hostname || req.headers.host,
      port: urlPattern.port || req.port || 80,
      path: urlPattern.path,
      method: req.method,
      headers: req.headers,
    }

    switch (config.get('proxy.use')) {
      // HTTP Request via SOCKS5 proxy
      case 'socks5': {
        const socksHost = config.get('proxy.socks5.host', '127.0.0.1')
        const socksPort = config.get('proxy.socks5.port', 1080)
        const uri = `${socksHost}:${socksPort}`
        if (!this.socksAgents[uri]) {
          this.socksAgents[uri] = new SocksHttpAgent({
            socksHost,
            socksPort,
            keepAlive,
          })
        }
        options.agent = this.socksAgents[uri]
        break
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
        const uri = `http://${useAuth ? strAuth : ''}${host}:${port}`
        if (!this.httpAgents[uri]) {
          this.httpAgents[uri] = new HttpProxyAgent(uri)
        }
        options.agent = this.httpAgents[uri]
        break
      }
      // PAC
      case 'pac': {
        const uri = config.get('proxy.pacAddr')
        if (!this.pacAgents[uri]) {
          this.pacAgents[uri] = new PacProxyAgent(uri)
        }
        options.agent = this.pacAgents[uri]
        break
      }
      default: {
        options.agent = new Agent({
          keepAlive,
        })
      }
    }
    return options
  }

  parseResponse = async (resDataChunks, header) => {
    const contentType = header['content-type'] || header['Content-Type'] || ''
    if (!contentType.startsWith('text') && !contentType.startsWith('application')) {
      return null
    }

    const resData = Buffer.concat(resDataChunks)
    const contentEncoding = header['content-encoding'] || header['Content-Encoding']
    const isGzip = /gzip/i.test(contentEncoding)
    const isDeflat = /deflate/i.test(contentEncoding)
    const unzipped = isGzip
      ? await gunzipAsync(resData).catch(e => {
          return null
        })
      : isDeflat
      ? await inflateAsync(resData).catch(e => {
          return null
        })
      : resData
    try {
      const str = unzipped.toString()
      const parsed = str.startsWith('svdata=') ? str.substring(7) : str
      JSON.parse(parsed)
      return parsed
    } catch (e) {
      return null
    }
  }

  fetchResponse = (options, rawReqBody, cRes) =>
    new Promise((resolve, reject) => {
      const proxyRequest = http.request(options, res => {
        const { statusCode, headers } = res
        const resDataChunks = []

        cRes.writeHead(statusCode, headers)
        res.pipe(cRes)

        res.on('data', chunk => {
          resDataChunks.push(chunk)
        })

        res.on('end', () => {
          this.parseResponse(resDataChunks, headers)
            .then(data =>
              resolve({
                data,
                statusCode,
              }),
            )
            .catch(e => resolve({ statusCode }))
        })

        res.on('error', error => {
          reject({ error })
        })
      })

      proxyRequest.on('error', error => {
        reject({ error })
      })

      proxyRequest.write(rawReqBody)
      proxyRequest.end()
    })

  useCache = async (req, res, cacheFile) => {
    const stats = await fs.stat(cacheFile)
    if (
      req.headers['if-modified-since'] &&
      new Date(req.headers['if-modified-since']) >= stats.mtime
    ) {
      // Cache is new
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
}

const poiProxy = new Proxy()
app.on('ready', () => {
  poiProxy.load()
})

export default poiProxy
