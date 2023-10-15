const remote = require('@electron/remote')
const config = remote.require('./lib/config')

window.ipc = remote.require('./lib/ipc')

const url = require('url')
const gameAPIBroadcaster = remote.require('./lib/game-api-broadcaster')

document.addEventListener('DOMContentLoaded', (e) => {
  if (config.get('poi.misc.dmmcookie', false) && location.hostname.includes('dmm')) {
    const now = new Date()
    now.setFullYear(now.getFullYear() + 1)
    const expires = now.toUTCString()
    document.cookie = `cklg=welcome;expires=${expires};domain=.dmm.com;path=/`
    document.cookie = `cklg=welcome;expires=${expires};domain=.dmm.com;path=/netgame/`
    document.cookie = `cklg=welcome;expires=${expires};domain=.dmm.com;path=/netgame_s/`
    document.cookie = `ckcy=1;expires=${expires};domain=osapi.dmm.com;path=/`
    document.cookie = `ckcy=1;expires=${expires};domain=203.104.209.7;path=/`
    document.cookie = `ckcy=1;expires=${expires};domain=www.dmm.com;path=/netgame/`
    document.cookie = `ckcy=1;expires=${expires};domain=log-netgame.dmm.com;path=/`
    document.cookie = `ckcy=1;expires=${expires};domain=.dmm.com;path=/`
    document.cookie = `ckcy=1;expires=${expires};domain=.dmm.com;path=/netgame/`
    document.cookie = `ckcy=1;expires=${expires};domain=.dmm.com;path=/netgame_s/`
    const ua = remote.getCurrentWebContents().session.getUserAgent()
    remote.getCurrentWebContents().session.setUserAgent(ua, 'ja-JP')

    // Workaround for re-navigate from foreign page on first visit
    if (location.href.includes('/foreign/')) {
      location.href = config.getDefault('poi.misc.homepage')
    }
  }
  if (config.get('poi.misc.disablenetworkalert', false) && window.DMM) {
    window.DMM.netgame.reloadDialog = function () {}
  }
})

// Faster align setting
const alertCSS = `#alert {
  left: 270px !important;
  top: 83px !important;
  border: 0;
}
`

const alignCSS = document.createElement('style')
alignCSS.innerHTML = `html {
  overflow: hidden;
}
#w, #main-ntg {
  position: absolute !important;
  top: 0;
  left: 0;
  z-index: 100;
  margin-left: 0 !important;
  margin-top: 0 !important;
}
#game_frame {
  width: 1200px !important;
  position: absolute;
  top: 0px;
  left: 0;
}
.naviapp {
  z-index: -1;
}
#ntg-recommend {
  display: none !important;
}
`

const disableTab = (e) => {
  if (e.key === 'Tab') {
    e.preventDefault()
  }
}

let tick = 0

function handleSpacingTop(show, count = 0) {
  const status = show ? 'block' : 'none'
  const action = show ? 'removeEventListener' : 'addEventListener'
  if (document.querySelector('#spacing_top')) {
    document.querySelector('#spacing_top').style.display = status
  }
  document[action]('keydown', disableTab)
  if (count > 20 || !document.querySelector('#game_frame')) {
    return
  }
  try {
    const frameDocument = document.querySelector('#game_frame').contentDocument
    frameDocument.querySelector('#spacing_top').style.display = status
    frameDocument.querySelector('#htmlWrap').contentDocument[action]('keydown', disableTab)
    frameDocument[action]('keydown', disableTab)
  } catch (e) {
    clearTimeout(tick)
    tick = setTimeout(() => handleSpacingTop(show, count + 1), 200)
  }
}

window.align = function () {
  if (location.pathname.includes('854854') || location.hostname === 'osapi.dmm.com') {
    document.body.appendChild(alignCSS)
    handleSpacingTop(false)
    window.scrollTo(0, 0)
  } else if (location.pathname.includes('kcs')) {
    document.body.appendChild(alignCSS)
  }
}

window.unalign = () => {
  if (location.pathname.includes('854854') || location.pathname.includes('kcs')) {
    if (document.body.contains(alignCSS)) {
      document.body.removeChild(alignCSS)
    }
    if (document.querySelector('#spacing_top')) {
      document.querySelector('#spacing_top').style.display = 'block'
    }
    handleSpacingTop(true)
  }
}

window.capture = async function () {
  try {
    const canvas = document.querySelector('#game_frame')
      ? document
          .querySelector('#game_frame')
          .contentDocument.querySelector('#htmlWrap')
          .contentDocument.querySelector('canvas')
      : document.querySelector('#htmlWrap')
      ? document.querySelector('#htmlWrap').contentDocument.querySelector('canvas')
      : document.querySelector('canvas')
      ? document.querySelector('canvas')
      : null
    if (!canvas || !ImageCapture) return undefined
    const imageCapture = new ImageCapture(canvas.captureStream(0).getVideoTracks()[0])
    const imageBitmap = await imageCapture.grabFrame()
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = imageBitmap.width
    tempCanvas.height = imageBitmap.height
    tempCanvas.getContext('2d').drawImage(imageBitmap, 0, 0)
    return tempCanvas.toDataURL()
  } catch (e) {
    console.error(e)
    return undefined
  }
}

// ref for item purchase css insertion
const webContent = remote.getCurrentWebContents()

const handleDocumentReady = () => {
  if (!document.body) {
    setTimeout(handleDocumentReady, 1000)
    return
  }
  window.align()
  webContent.insertCSS(alertCSS)
}

handleDocumentReady()

const hackXHR = () => {
  const OriginalXMLHttpRequest = XMLHttpRequest
  window.XMLHttpRequest = function () {
    let method, reqUrl, reqBody
    const req = new OriginalXMLHttpRequest()

    // Hack open method
    req.originOpen = req.open
    req.open = (...params) => {
      method = params[0]
      reqUrl = params[1]
      return req.originOpen(...params)
    }

    // Hack send method
    req.originSend = req.send
    req.send = (body) => {
      reqBody = body
      return req.originSend(body)
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
}

hackXHR()

if (
  window.location
    .toString()
    .includes('http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/')
) {
  const _documentWrite = document.write
  document.write = function () {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      console.warn(
        `Block document.write since document is at state "${document.readyState}". Blocked call:`,
        arguments,
      )
    } else {
      _documentWrite.apply(this, arguments)
    }
  }
}
