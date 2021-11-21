import EventEmitter from 'events'
import url from 'url'
import http from 'http'
import path from 'path'
import querystring from 'querystring'
import mime from 'mime'
import createPacProxyAgent from 'pac-proxy-agent'
import createHttpProxyAgent from 'http-proxy-agent'
import createSocksProxyAgent from 'socks-proxy-agent'
import { app, session } from 'electron'
import util from 'util'
import { gunzip, inflate } from 'zlib'
import fs from 'fs-extra'
import caseNormalizer from 'header-case-normalizer'
import socks from 'socks5-client'
import net from 'net'
import stream from 'stream'

import config from './config'
import { log, error } from './utils'

const { ROOT } = global

type PoiRequestOptions = http.RequestOptions

interface PoiResponseData {
  statusCode?: number
  error?: Error
  data?: any
}

interface KancolleServer {
  num?: number
  name?: string
  ip?: string
}

interface KancolleServerInfo {
  [ip: string]: KancolleServer
}

const gunzipAsync = util.promisify(gunzip)
const inflateAsync = util.promisify(inflate)

const delay = (time) => new Promise((res) => setTimeout(res, time))

const isStaticResource = (pathname: string, hostname: string): boolean => {
  if (pathname.startsWith('/kcs2/')) {
    return true
  }
  if (pathname.startsWith('/kcs/')) {
    return true
  }
  if (pathname.startsWith('/gadget/')) {
    return true
  }
  if (pathname.startsWith('/gadget_html5/')) {
    return true
  }
  if (pathname.startsWith('/kcscontents/')) {
    return true
  }
  if (pathname.startsWith('/html/')) {
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

const getCachePath = (pathname: string): string => {
  const dir = config.get('poi.misc.cache.path', global.DEFAULT_CACHE_PATH)
  return path.join(dir, pathname)
}

const findHack = (pathname: string): string | null => {
  let loc = getCachePath(path.join('KanColle', pathname))
  const sp = loc.split('.')
  const ext = sp.pop()
  sp.push('hack')
  sp.push(ext)
  loc = sp.join('.')
  try {
    fs.accessSync(loc, fs.constants.R_OK)
    return loc
  } catch (e) {
    if (e.code !== 'ENOENT') console.error(`error while loading hack file ${loc}`, e)
    return null
  }
}

const findCache = (pathname: string, hostname: string): string | null => {
  let loc: string
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
    fs.accessSync(loc, fs.constants.R_OK)
    return loc
  } catch (error) {
    return null
  }
}

const isKancolleGameApi = (pathname: string): boolean => pathname.startsWith('/kcsapi')

const resolveProxyUrl = (): string => {
  switch (config.get('proxy.use')) {
    case 'socks5': {
      const host: string = config.get('proxy.socks5.host', '127.0.0.1')
      const port: string = config.get('proxy.socks5.port', 1080)
      return `socks5://${host}:${port},direct://`
    }
    case 'http': {
      const host = config.get('proxy.http.host', '127.0.0.1')
      const port = config.get('proxy.http.port', 8118)
      const requirePassword = config.get('proxy.http.requirePassword', false)
      const username = config.get('proxy.http.username', '')
      const password = config.get('proxy.http.password', '')
      const useAuth = requirePassword && username !== '' && password !== ''
      const strAuth = `${username}:${password}@`
      return `http://${useAuth ? strAuth : ''}${host}:${port},direct://`
    }
    default:
      return 'direct://'
  }
}

class Proxy extends EventEmitter {
  pacAgents = {}
  socksAgents = {}
  httpAgents = {}
  serverInfo: KancolleServer = {}
  serverList: KancolleServerInfo = fs.readJsonSync(path.join(ROOT, 'assets', 'data', 'server.json'))

  getServerInfo = () => this.serverInfo

  server: http.Server
  port: number

  load = () => {
    // Handles http request only, https request will be passed to upstream proxy directly.
    this.server = http.createServer(this.createServer)
    this.server.on('error', error)
    this.server.on('connect', this.onConnect)
    const listenPort = config.get('proxy.port', 0)
    this.server.listen(
      listenPort,
      config.get('proxy.allowLAN', false) ? '0.0.0.0' : '127.0.0.1',
      () => {
        this.port = (this.server.address() as net.AddressInfo).port
        this.setProxy()
        config.on('config.set', (path) => {
          if (path.startsWith('proxy')) {
            this.setProxy()
          }
        })
      },
    )
  }

  setProxy = async () => {
    const httpsProxy = resolveProxyUrl()
    const httpProxy = `http://127.0.0.1:${this.port},direct://`
    await session.defaultSession.setProxy({
      proxyRules: `http=${httpProxy};https=${httpsProxy}`,
      proxyBypassRules: '<local>;*.google-analytics.com;*.doubleclick.net',
    })
    log(`Proxy listening on ${this.port}, upstream proxy ${httpsProxy}`)
  }

  updateServerInfo = (urlPattern: url.UrlWithStringQuery) => {
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

  createServer = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const urlPattern = url.parse(req.url)

    // Prepare request headers
    delete req.headers['proxy-connection']
    req.headers['connection'] = 'close'

    // Update kancolle server info
    this.updateServerInfo(urlPattern)

    // Find cachefile for static resource
    const cacheFile =
      urlPattern.hostname && isStaticResource(urlPattern.pathname, urlPattern.hostname)
        ? findHack(urlPattern.pathname) || findCache(urlPattern.pathname, urlPattern.hostname)
        : false

    // Prepare request options
    const rawReqBody = await this.fetchRequest(req)
    const reqBody = JSON.stringify(querystring.parse(rawReqBody.toString()))
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
          const reqOption = this.getRequestOptions(urlPattern, req)
          const { statusCode, data, error } = await this.fetchResponse(reqOption, rawReqBody, res)
          if (error) {
            if (count >= retries || !isKancolleGameApi(urlPattern.pathname)) {
              res.end()
              throw error
            }
            count++
            this.emit('network.error.retry', requestInfo, count)
            await delay(3000)
          } else {
            res.end()
            if (statusCode === 200 && data != null) {
              this.emit('network.on.response', req.method, requestInfo, data, reqBody, Date.now())
            } else if (statusCode >= 400) {
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

  fetchRequest = (req: http.IncomingMessage): any =>
    new Promise((resolve) => {
      const reqBody = []
      req.on('data', (chunk) => {
        reqBody.push(chunk)
      })
      req.on('end', () => {
        resolve(Buffer.concat(reqBody))
      })
    })

  getRequestOptions = (
    urlPattern: url.UrlWithStringQuery,
    req: http.IncomingMessage,
  ): PoiRequestOptions => {
    const options: PoiRequestOptions = {
      hostname: urlPattern.hostname || req.headers.host,
      port: urlPattern.port || 80,
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
          this.socksAgents[uri] = createSocksProxyAgent(`socks://${uri}`)
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
          this.httpAgents[uri] = createHttpProxyAgent(uri)
        }
        options.agent = this.httpAgents[uri]
        break
      }
      // PAC
      case 'pac': {
        const uri = config.get('proxy.pacAddr')
        if (!this.pacAgents[uri]) {
          this.pacAgents[uri] = createPacProxyAgent(uri)
        }
        options.agent = this.pacAgents[uri]
        break
      }
    }
    return options
  }

  parseResponse = async (
    resDataChunks: any[],
    header: http.IncomingHttpHeaders,
  ): Promise<any | null> => {
    const contentType: string = header['content-type'] || (header['Content-Type'] as string) || ''
    if (!contentType.startsWith('text') && !contentType.startsWith('application')) {
      return null
    }

    const resData = Buffer.concat(resDataChunks)
    const contentEncoding = header['content-encoding'] || (header['Content-Encoding'] as string)
    const isGzip = /gzip/i.test(contentEncoding)
    const isDeflat = /deflate/i.test(contentEncoding)
    const unzipped = isGzip
      ? await gunzipAsync(resData).catch(() => {
          return null
        })
      : isDeflat
      ? await inflateAsync(resData).catch(() => {
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

  fetchResponse = (
    options: PoiRequestOptions,
    rawReqBody: any,
    cRes: http.ServerResponse,
  ): Promise<PoiResponseData> =>
    new Promise((resolve) => {
      const proxyRequest = http.request(options, (res) => {
        const { statusCode, headers } = res
        const resDataChunks: any[] = []

        cRes.writeHead(statusCode, headers)
        res.pipe(cRes)

        res.on('data', (chunk) => {
          resDataChunks.push(chunk)
        })

        res.on('end', () => {
          this.parseResponse(resDataChunks, headers)
            .then((data) =>
              resolve({
                data,
                statusCode,
              }),
            )
            .catch(() => resolve({ statusCode }))
        })

        res.on('error', (error) => {
          resolve({ error })
        })
      })

      proxyRequest.on('error', (error) => {
        resolve({ error })
      })

      proxyRequest.write(rawReqBody)
      proxyRequest.end()
    })

  useCache = async (req: http.IncomingMessage, res: http.ServerResponse, cacheFile: string) => {
    const mtime = (await fs.stat(cacheFile)).mtime.toUTCString()
    if (
      req.headers['if-modified-since'] &&
      new Date(req.headers['if-modified-since']) >= new Date(mtime)
    ) {
      // Cache is new
      res.writeHead(304, {
        Server: 'nginx',
        'Last-Modified': mtime,
      })
      res.end()
    } else {
      // Cache is old
      const data = await fs.readFile(cacheFile)
      res.writeHead(200, {
        Server: 'nginx',
        'Content-Length': data.length,
        'Content-Type': mime.getType(cacheFile),
        'Last-Modified': mtime,
        'Cache-Control': 'max-age=0',
      })
      res.end(data)
    }
  }

  onConnect = (req: http.IncomingMessage, client: stream.Duplex, head: Buffer) => {
    delete req.headers['proxy-connection']
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
        msg += '\r\n'
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
        remote = net.connect(Number(remoteUrl.port), remoteUrl.hostname, () => {
          client.write('HTTP/1.1 200 Connection Established\r\nConnection: close\r\n\r\n')
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
  }
}

const poiProxy = new Proxy()
app.on('ready', () => {
  poiProxy.load()
})

export default poiProxy
