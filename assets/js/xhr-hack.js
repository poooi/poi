const remote = require('@electron/remote')
const url = require('url')
const gameAPIBroadcaster = remote.require('./lib/game-api-broadcaster')

// Keep hack function in case child iframe failed to load xhr hack
window.hackXhr = (win = window) => {
  if (win.xhrHacked) {
    return false
  }
  const OriginalXMLHttpRequest = win.XMLHttpRequest
  win.XMLHttpRequest = function () {
    let method, reqUrl, reqBody
    const req = new OriginalXMLHttpRequest()

    // Hack open method
    req.originalOpen = req.open
    req.open = (...params) => {
      method = params[0]
      reqUrl = params[1]
      return req.originalOpen(...params)
    }

    // Hack send method
    req.originalSend = req.send
    req.send = (body) => {
      reqBody = body
      return req.originalSend(body)
    }

    // Send event
    req.addEventListener('load', () => {
      const resUrl = req.responseURL || reqUrl
      gameAPIBroadcaster.sendRequest(
        method,
        [undefined, url.parse(resUrl).pathname, resUrl],
        reqBody,
      )
    })
    req.addEventListener('loadend', () => {
      if (!req.responseType || ['json', 'document', 'text'].includes(req.responseType)) {
        gameAPIBroadcaster.sendResponse(
          method,
          [undefined, url.parse(req.responseURL).pathname, req.responseURL],
          reqBody,
          req.response,
          req.responseType,
          req.status,
        )
      }
    })
    req.addEventListener('error', () => {
      const resUrl = req.responseURL || reqUrl
      gameAPIBroadcaster.sendError([undefined, url.parse(resUrl).pathname, resUrl], req.status)
    })

    return req
  }

  win.xhrHacked = true

  return true
}

window.hackXhr()
