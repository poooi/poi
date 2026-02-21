import EventEmitter from 'events'
import fs from 'fs-extra'
import path from 'path'
import querystring from 'querystring'
import { URL } from 'url'

type RequestOrigin = string | undefined
type PathName = string
type Url = string
type RequestInfo = [RequestOrigin, PathName, Url]

interface KancolleServer {
  num?: number
  name?: string
  ip?: string
}

interface KancolleServerInfo {
  [ip: string]: KancolleServer
}

class GameAPIBroadcaster extends EventEmitter {
  serverList: KancolleServerInfo = fs.readJsonSync(path.join(ROOT, 'assets', 'data', 'server.json'))

  serverInfo: KancolleServer = {}

  sendRequest = (method: string, requestInfo: RequestInfo, rawReqBody: string) => {
    this.emit(
      'network.on.request',
      method,
      requestInfo,
      JSON.stringify(querystring.parse(rawReqBody || '')),
      Date.now(),
    )
  }

  sendResponse = (
    method: string,
    requestInfo: RequestInfo,
    rawReqBody: string,
    rawResBody: unknown,
    resType: XMLHttpRequestResponseType,
    statusCode?: number,
  ) => {
    this.updateKanColleServer(requestInfo)
    const resBody = this.parseResponseBody(rawResBody, resType)
    if (resBody && statusCode === 200) {
      this.emit(
        'network.on.response',
        method,
        requestInfo,
        resBody,
        JSON.stringify(querystring.parse(rawReqBody || '')),
        Date.now(),
      )
    }
  }

  sendError = (requestInfo: RequestInfo, statusCode?: number) => {
    this.emit('network.error', requestInfo, statusCode)
  }

  private parseResponseBody = (rawResBody: unknown, resType: XMLHttpRequestResponseType) => {
    if (rawResBody == null) {
      return undefined
    }
    switch (resType) {
      case 'arraybuffer':
      case 'blob':
      case 'document': {
        // not parseable
        return undefined
      }
      case 'json': {
        return JSON.stringify(rawResBody)
      }
      case 'text':
      default: {
        try {
          const bodyStr = (rawResBody as string) || undefined
          const parsed = bodyStr?.startsWith('svdata=') ? bodyStr.substring(7) : bodyStr
          JSON.parse(parsed || '')
          return parsed
        } catch (_e) {
          return undefined
        }
      }
    }
  }

  private updateKanColleServer = (requestInfo: RequestInfo) => {
    const [, pathName, reqUrl] = requestInfo
    if (this.isKancolleGameApi(pathName)) {
      const { hostname } = new URL(reqUrl)
      if (hostname) {
        if (this.serverList[hostname]) {
          this.serverInfo = {
            ...this.serverList[hostname],
            ip: hostname,
          }
        } else {
          this.serverInfo = {
            num: -1,
            name: '__UNKNOWN',
            ip: hostname,
          }
        }
        this.emit('kancolle.server.change', this.serverInfo)
      }
    }
  }

  private isKancolleGameApi = (pathname: PathName = ''): boolean => pathname?.startsWith('/kcsapi')
}

export default new GameAPIBroadcaster()
