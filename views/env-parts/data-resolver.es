import { onGameRequest, onGameResponse } from 'views/redux'
import { remote } from 'electron'

const proxy = remote.require('./lib/proxy')

const isGameApi = (pathname) =>
  (pathname.startsWith('/kcsapi'))

const handleProxyGameOnRequest = (method, [domain, path], body, time) => {
  const {dispatch} = window
  if (!isGameApi(path)) {
    return
  }
  // Parse the json object
  try {
    body = JSON.parse(body)
    const details = {
      method: method,
      path: path,
      body: body,
      time: time,
    }
    try{
      dispatch(onGameRequest(details))
    } catch (e) {
      console.error(details, e.stack)
    }
    const event = new CustomEvent('game.request', {
      bubbles: true,
      cancelable: true,
      detail: details,
    })
    window.dispatchEvent(event)
  } catch (e) {
    console.error(e.stack)
  }
}

const responses = []
let locked = false

const parseResponses = () => {
  const {dispatch} = window
  let [method, [domain, path, url], body, postBody, time] = responses.shift()
  if (['/kcs2/js/main.js', '/kcsapi/api_start2/getData'].includes(path)) {
    handleProxyGameStart()
  }
  if (!isGameApi(path)) {
    return
  }

  if (body.api_result !== 1) {
    const event = new CustomEvent('network.invalid.result', {
      bubbles: true,
      cancelable: true,
      detail: {
        code: body.api_result,
      },
    })
    window.dispatchEvent(event)
    return
  }
  if (body.api_data) {
    body = body.api_data
  }

  // Delete api_token
  if ((postBody || {}).api_token) {
    delete postBody.api_token
  }
  // Fix api
  if ((body || {}).api_level != null) {
    body.api_level = parseInt(body.api_level)
  }
  if ((body || {}).api_member_lv != null) {
    body.api_member_lv = parseInt(body.api_member_lv)
  }

  const details = {
    method: method,
    path: path,
    body: body,
    postBody: postBody,
    time: time,
  }

  // Update redux store
  try {
    dispatch(onGameResponse(details))
  } catch (e) {
    console.error(domain, url, details, e.stack)
  }

  // DEBUG use
  const questRecords = window.getStore('info.quests.records')
  if (!questRecords || typeof questRecords !== 'object' || !Object.keys(questRecords)) {
    console.warn('Quest record is cleared! ', details)
  }

  const event = new CustomEvent('game.response', {
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
      console.error(err.stack)
    }
  }
  locked = false
}

const handleProxyGameOnResponse = (method, [domain, path, url], body, postBody, time) => {
  // Parse the json object
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

const handleProxyNetworkErrorRetry = ([domain, path, url], counter) =>{
  if (!isGameApi(path)) {
    return
  }
  const event = new CustomEvent('network.error.retry', {
    bubbles: true,
    cancelable: true,
    detail: {
      counter: counter,
    },
  })
  window.dispatchEvent(event)
}

const handleProxyNetworkError = ([domain, path, url]) => {
  if (url.startsWith('http://www.dmm.com/netgame/') || url.includes('/kcs2/') || url.includes('/kcsapi/')) {
    window.dispatchEvent(new Event('network.error'))
  }
}


const proxyListener = {
  'network.on.request': handleProxyGameOnRequest,
  'network.on.response': handleProxyGameOnResponse,
  'network.error': handleProxyNetworkError,
  'network.error.retry': handleProxyNetworkErrorRetry,
}

window.listenerStatusFlag = false

const addProxyListener = () => {
  if (!window.listenerStatusFlag) {
    window.listenerStatusFlag = true
    for (const eventName in proxyListener) {
      proxy.addListener(eventName, proxyListener[eventName])
    }
  }
}

addProxyListener()

window.addEventListener ('load', () => {
  addProxyListener()
})

window.addEventListener ('unload', () => {
  if (window.listenerStatusFlag){
    window.listenerStatusFlag = false
    for (const eventName in proxyListener) {
      proxy.removeListener(eventName, proxyListener[eventName])
    }
  }
})
