import type { GameAPIBroadcaster } from 'lib/game-api-broadcaster'

import * as remote from '@electron/remote'
import { dispatch, getStore } from 'views/create-store'
import { onGameRequest, onGameResponse } from 'views/redux/reducer-factory'

const gameAPIBroadcaster: GameAPIBroadcaster = remote.require('./lib/game-api-broadcaster')

const isGameApi = (pathname: string) => pathname.startsWith('/kcsapi')

export type RequestBody = {
  [key: string]: unknown
}

export type ResponseBody = {
  api_data?: ResponseBody
  [key: string]: unknown
}

export interface GameRequestDetails {
  method: string
  path: string
  body: RequestBody
  time: number
}

export interface GameResponseDetails {
  method: string
  path: string
  body: ResponseBody
  postBody: RequestBody
  time: number
}

export interface GameInvalidResultDetails {
  code: number
}

declare global {
  interface WindowEventMap {
    'game.request': CustomEvent<GameRequestDetails>
    'game.response': CustomEvent<GameResponseDetails>
    'network.error': Event
    'network.invalid.result': CustomEvent<GameInvalidResultDetails>
  }
}

const handleProxyGameOnRequest = (
  method: string,
  [, path]: [string, string, string],
  body: string,
  time: number,
) => {
  if (!isGameApi(path)) {
    return
  }
  try {
    const parsedBody = JSON.parse(body)
    const details = {
      method,
      path,
      body: parsedBody,
      time,
    }
    try {
      dispatch(onGameRequest(details))
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      console.error(details, (e as Error).stack)
    }
    const event = new CustomEvent<GameRequestDetails>('game.request', {
      bubbles: true,
      cancelable: true,
      detail: details,
    })
    window.dispatchEvent(event)
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    console.error((e as Error).stack)
  }
}

const responses: [string, [string, string, string], ResponseBody, RequestBody, number][] = []
let locked = false

const parseResponses = () => {
  const [method, [domain, path, url], body, postBody, time] = responses.shift()!
  if (['/kcs2/js/main.js', '/kcsapi/api_start2/getData'].includes(path)) {
    handleProxyGameStart()
  }
  if (!isGameApi(path)) {
    return
  }

  if (body.api_result !== 1) {
    const event = new CustomEvent<GameInvalidResultDetails>('network.invalid.result', {
      bubbles: true,
      cancelable: true,
      detail: {
        code: Number(body.api_result),
      },
    })
    window.dispatchEvent(event)
    return
  }
  const resolvedBody = body.api_data ?? body
  const resolvedPostBody = postBody

  // Delete api_token
  if (resolvedPostBody?.api_token) {
    delete resolvedPostBody.api_token
  }
  // Fix api
  if (resolvedBody?.api_level != null) {
    resolvedBody.api_level = parseInt(String(resolvedBody.api_level))
  }
  if (resolvedBody?.api_member_lv != null) {
    resolvedBody.api_member_lv = parseInt(String(resolvedBody.api_member_lv))
  }

  const details: GameResponseDetails = {
    method,
    path,
    body: resolvedBody,
    postBody: resolvedPostBody,
    time,
  }

  // Update redux store
  try {
    dispatch(onGameResponse(details))
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    console.error(domain, url, details, (e as Error).stack)
  }

  // DEBUG use
  const questRecords = getStore('info.quests.records')
  if (!questRecords || typeof questRecords !== 'object' || !Object.keys(questRecords)) {
    console.warn('Quest record is cleared! ', details)
  }

  const event = new CustomEvent<GameResponseDetails>('game.response', {
    bubbles: true,
    cancelable: true,
    detail: details,
  })
  window.dispatchEvent(event)
}

const resolveResponses = () => {
  locked = true
  while (responses.length > 0) {
    try {
      parseResponses()
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      console.error((err as Error).stack)
    }
  }
  locked = false
}

const handleProxyGameOnResponse = (
  method: string,
  [domain, path, url]: [string, string, string],
  body: string,
  postBody: string,
  time: number,
) => {
  try {
    responses.push([method, [domain, path, url], JSON.parse(body), JSON.parse(postBody), time])
    if (!locked) {
      resolveResponses()
    }
  } catch (e) {
    console.error(e)
  }
}

const handleProxyGameStart = () => {
  window.dispatchEvent(new Event('game.start'))
}

const handleProxyNetworkError = ([, , url]: [string, string, string]) => {
  if (
    url.startsWith('http://www.dmm.com/netgame/') ||
    url.includes('/kcs2/') ||
    url.includes('/kcsapi/')
  ) {
    window.dispatchEvent(new Event('network.error'))
  }
}

const proxyListener = {
  'network.on.request': handleProxyGameOnRequest,
  'network.on.response': handleProxyGameOnResponse,
  'network.error': handleProxyNetworkError,
} as const

let listenerStatusFlag = false

const addProxyListener = () => {
  if (!listenerStatusFlag) {
    listenerStatusFlag = true
    let eventName: keyof typeof proxyListener
    for (eventName in proxyListener) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      gameAPIBroadcaster.addListener(eventName, proxyListener[eventName] as never)
    }
  }
}

addProxyListener()

window.addEventListener('load', () => {
  addProxyListener()
})

window.addEventListener('unload', () => {
  if (listenerStatusFlag) {
    listenerStatusFlag = false
    let eventName: keyof typeof proxyListener
    for (eventName in proxyListener) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      gameAPIBroadcaster.removeListener(eventName, proxyListener[eventName] as never)
    }
  }
})
