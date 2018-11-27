import EventEmitter from 'events'
import url from 'url'
import http from 'http'
import path from 'path'
import querystring from 'querystring'
import mime from 'mime'
// import PacProxyAgent from 'pac-proxy-agent'
import { app, session } from 'electron'
import util from 'util'
import { gunzip, inflate } from 'zlib'
import fs from 'fs-extra'

// import SocksHttpAgent from './socks-http-agent'
import config from './config'
import { log, error } from './utils'

const { ROOT } = global

const gunzipAsync = util.promisify(gunzip)
const inflateAsync = util.promisify(inflate)

// const resolveBody = async (encoding, body) => {
//   let decoded = null
//   switch (encoding) {
//     case 'gzip':
//       decoded = await gunzipAsync(body)
//       break
//     case 'deflate':
//       decoded = await inflateAsync(body)
//       break
//     default:
//       decoded = body
//   }
//   decoded = decoded.toString()
//   if (decoded.indexOf('svdata=') === 0) {
//     decoded = decoded.substring(7)
//   }
//   decoded = JSON.parse(decoded)
//   return decoded
// }

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

// const PacAgents = {}
// const resolveProxy = req => {
//   switch (config.get('proxy.use')) {
//     // HTTP Request via SOCKS5 proxy
//     case 'socks5':
//       return {
//         ...req,
//         agentClass: SocksHttpAgent,
//         agentOptions: {
//           socksHost: config.get('proxy.socks5.host', '127.0.0.1'),
//           socksPort: config.get('proxy.socks5.port', 1080),
//         },
//       }
//     // HTTP Request via HTTP proxy
//     case 'http': {
//       const host = config.get('proxy.http.host', '127.0.0.1')
//       const port = config.get('proxy.http.port', 8118)
//       const requirePassword = config.get('proxy.http.requirePassword', false)
//       const username = config.get('proxy.http.username', '')
//       const password = config.get('proxy.http.password', '')
//       const useAuth = requirePassword && username !== '' && password !== ''
//       const strAuth = `${username}:${password}@`
//       return {
//         ...req,
//         proxy: `http://${useAuth ? strAuth : ''}${host}:${port}`,
//       }
//     }
//     // PAC
//     case 'pac': {
//       const uri = config.get('proxy.pacAddr')
//       if (!PacAgents[uri]) {
//         PacAgents[uri] = new PacProxyAgent(uri)
//       }
//       return {
//         ...req,
//         agent: PacAgents[uri],
//       }
//     }
//     // Directly
//     default:
//       return req
//   }
// }

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
  serverInfo = {}

  serverList = fs.readJsonSync(path.join(ROOT, 'assets', 'data', 'server.json'))

  getServerInfo = () => this.serverInfo

  load = () => {
    // HTTP Requests
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
        // app.commandLine.appendSwitch('proxy-server', `127.0.0.1:${this.port}`)
        // app.commandLine.appendSwitch(
        //   'proxy-bypass-list',
        //   '<local>;*.google-analytics.com;*.doubleclick.net',
        // )
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
      () => log(`Proxy listening on ${this.port}`),
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

    if (req.headers['proxy-connection'] && !req.headers['connection']) {
      req.headers['connection'] = req.headers['proxy-connection']
      delete req.headers['proxy-connection']
    } else if (!req.headers['connection']) {
      req.headers['connection'] = 'close'
    }
    // const keepAlive = req.headers['connection'] === 'keep-alive'

    this.updateServerInfo(urlPattern)

    // Find cachefile for static resource
    const cacheFile = isStaticResource(urlPattern.pathname, urlPattern.hostname)
      ? findHack(urlPattern.pathname) || findCache(urlPattern.pathname, urlPattern.hostname)
      : false

    // Prepare request
    const rawReqBody = await this.fetchRequest(req)
    const reqBody = JSON.stringify(querystring.parse(rawReqBody.toString()))
    const reqOption = this.getRequestOption(urlPattern, req)
    const requestInfo = [req.headers.origin, urlPattern.pathname, req.url]

    this.emit('network.on.request', req.method, requestInfo, reqBody, Date.now())

    try {
      // Use cache file
      if (cacheFile) {
        this.useCache(req, res, cacheFile)
      } else {
        const count = 0
        const retryConfig = config.get('proxy.retries', 0)
        const retries = retryConfig < 0 ? 0 : retryConfig
        while (count <= retries) {
          const { statusCode, data, error } = await this.fetchResponse(reqOption, rawReqBody, res)
          if (error) {
            if (count === retries) {
              res.end()
              throw error
            }
            await delay(5000)
          } else {
            res.end()
            if (statusCode == 200 && data !== null) {
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

  getRequestOption = (urlPattern, req) => {
    const options = {
      hostname: urlPattern.hostname || req.headers.host,
      port: urlPattern.port || req.port || 80,
      path: urlPattern.path,
      method: req.method,
      headers: req.headers,
    }

    return options
  }

  parseResponse = async (resDataChunks, resHeader) => {
    const serverResData = Buffer.concat(resDataChunks)
    const contentEncoding = resHeader['content-encoding'] || resHeader['Content-Encoding']
    const ifServerGzipped = /gzip/i.test(contentEncoding)
    const isServerDeflated = /deflate/i.test(contentEncoding)

    // only do unzip when there is res data
    const data = (ifServerGzipped
      ? await gunzipAsync(serverResData).catch(e => 'null')
      : isServerDeflated
      ? await inflateAsync(serverResData).catch(e => 'null')
      : serverResData
    ).toString()
    try {
      return data.startsWith('svdata=') ? JSON.parse(data.substring(7)) : JSON.parse(data)
    } catch (e) {
      return null
    }
  }

  fetchResponse = (options, rawReqBody, cRes) =>
    new Promise((resolve, reject) => {
      //send request
      const proxyRequest = http.request(options, res => {
        //deal response header
        const { statusCode, headers } = res
        const resDataChunks = []
        const rawResChunks = []

        cRes.writeHead(statusCode, headers)
        res.pipe(cRes)

        //deal response data
        cRes.on('data', chunk => {
          rawResChunks.push(chunk)
        })

        res.on('end', () => {
          if (isKancolleGameApi(options.path)) {
            this.parseResponse(resDataChunks, headers).then(r =>
              resolve({
                data: r,
                statusCode,
              }),
            )
          } else {
            resolve({ statusCode })
          }
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

  // sendRequest = async ({ req, res, reqBody, domain, pathname, requrl, options }) => {
  //   try {
  //     // Emit request event to plugins
  //     reqBody = JSON.stringify(querystring.parse(reqBody.toString()))
  //     this.emit('network.on.request', req.method, [domain, pathname, requrl], reqBody, Date.now())

  //     // Create remote request
  //     const [response, body] = await new Promise((pResolve, pReject) => {
  //       request(resolveProxy(options), (err, rRes, rBody) => {
  //         if (!err) {
  //           pResolve([rRes, rBody])
  //         } else {
  //           pReject(err)
  //         }
  //       }).pipe(res)
  //     })

  //     // Parse response
  //     const resolvedBody = await resolveBody(response.headers['content-encoding'], body).catch(
  //       e => null,
  //     )

  //     if (response.statusCode == 200 && resolvedBody !== null) {
  //       this.emit(
  //         'network.on.response',
  //         req.method,
  //         [domain, pathname, requrl],
  //         JSON.stringify(resolvedBody),
  //         reqBody,
  //         Date.now(),
  //       )
  //     } else if (response.statusCode != 200) {
  //       this.emit('network.error', [domain, pathname, requrl], response.statusCode)
  //     }
  //     return {
  //       success: true,
  //     }
  //   } catch (e) {
  //     if (!isKancolleGameApi(pathname)) {
  //       return {
  //         success: false,
  //         retry: false,
  //         error: e,
  //       }
  //     }
  //     return {
  //       success: false,
  //       retry: true,
  //       error: e,
  //     }
  //   }
  // }
}

const poiProxy = new Proxy()
app.on('ready', () => {
  poiProxy.load()
})

export default poiProxy
