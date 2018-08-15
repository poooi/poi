import { remote } from 'electron'
import { isInGame } from 'views/utils/game-utils'
import { observer, observe } from 'redux-observers'
import { store } from 'views/create-store'
import i18next from 'views/env-parts/i18next'
import { debounce } from 'lodash'

const proxy = remote.require('./lib/proxy')
const { config, toggleModal, log, error, dbg } = window

const { stopNavigateAndHandleNewWindow } = remote.require('./lib/utils')

import './services/update'
import './services/layout'
import './services/welcome'
import './services/modernization-delta'
import './services/development-prophecy'
import './services/sortie-dangerous-check'
import './services/sortie-free-slot-check'
import './services/event-sortie-check'
import './services/google-analytics'
import {
  gameRefreshPage,
  gameRefreshPageIgnoringCache,
  gameReloadFlash,
} from './services/utils'

// Update server info
const setUpdateServer = (dispatch) => {
  const t = setInterval(() => {
    const {ip, num: id, name} = proxy.getServerInfo()
    if (window.getStore('info.server.ip') !== ip) {
      if (ip) {
        dispatch({
          type: '@@ServerReady',
          serverInfo: {ip, id, name},
        })
      }
    } else {
      clearInterval(t)
    }
  }, 1000)
}
const serverObserver = observer(
  (state) => state.info.server.ip,
  (dispatch, current, previous) => {
    if (!current) {
      setUpdateServer(dispatch)
    }
  }
)
setUpdateServer(window.dispatch)

observe(store, [serverObserver])

// F5 & Ctrl+F5 & Alt+F5
window.addEventListener('keydown', async (e) => {
  const isingame = await isInGame()
  if ((document.activeElement.tagName === 'WEBVIEW' && !isingame) || document.activeElement.tagName === 'INPUT') {
    return
  }
  if (process.platform == 'darwin') {
    if (e.keyCode === 91 || e.keyCode === 93) {
      // When the game (flash) is on focus, it catches all keypress events
      // Blur the webview when any Cmd key is pressed,
      // so the OS shortcuts will always work
      remote.getCurrentWindow().blurWebView()
    } else if (e.keyCode === 82 && e.metaKey) {
      if (e.shiftKey) { // cmd + shift + r
        gameRefreshPageIgnoringCache()
      } else if (e.altKey) { // cmd + alt + r
        gameReloadFlash()
      } else { // cmd + r
        // Catched by menu
        // $('kan-game webview').reload()
        return false
      }
    }
  } else if (e.keyCode === 116){
    if (e.ctrlKey) { // ctrl + f5
      gameRefreshPageIgnoringCache()
    } else if (e.altKey){ // alt + f5
      gameReloadFlash()
    } else if (!e.metaKey){ // f5
      gameRefreshPage()
    }
  }
})

// Confirm before quit
let confirmExit = false
const exitPoi = () => {
  confirmExit = true
  remote.require('./lib/window').rememberMain()
  remote.require('./lib/window').closeWindows()
  window.onbeforeunload = null
  window.close()
}
window.onbeforeunload = (e) => {
  if (confirmExit || !config.get('poi.confirm.quit', false)) {
    exitPoi()
  } else {
    toggleModal(i18next.t('Exit'), i18next.t('Confirm?'), [{
      name: i18next.t('Confirm'),
      func: exitPoi,
      style: 'warning',
    }])
    e.returnValue = false
  }
}
class GameResponse {
  constructor(path, body, postBody, time) {
    this.path = path
    this.body = body
    this.postBody = postBody
    Object.defineProperty(this, 'time', {
      get: () => String(new Date(time)),
    })
    Object.defineProperty(this, 'ClickToCopy -->', {get: () => {
      require('electron').clipboard.writeText(JSON.stringify({path, body, postBody}))
      return `Copied: ${this.path}`
    }})
  }
}

window.addEventListener('game.request', (e) => {
  //const {method} = e.detail
  //const resPath = e.detail.path
})
window.addEventListener('game.response', (e) => {
  const {method, body, postBody, time} = e.detail
  const resPath = e.detail.path
  if (dbg.extra('gameResponse').isEnabled()) {
    dbg._getLogFunc()(new GameResponse(resPath, body, postBody, time))
  }
  if (config.get('poi.showNetworkLog', true)) {
    log(`${i18next.t('Hit')}: ${method} ${resPath}`, {dontReserve: true})
  }
})
window.addEventListener ('network.error', () => {
  error(i18next.t('Connection failed.'), {dontReserve: true})
})
window.addEventListener('network.error.retry', (e) => {
  const {counter} = e.detail
  error(i18next.t('ConnectionFailedMsg', { count: counter }), {dontReserve: true})
})
window.addEventListener('network.invalid.result', (e) => {
  const {code} = e.detail
  error(i18next.t('CatError', { code }), {dontReserve: true})
})

remote.getCurrentWebContents().on('devtools-opened', e => window.dispatchEvent(new Event('resize')))
stopNavigateAndHandleNewWindow(remote.getCurrentWebContents().id)

remote.getCurrentWebContents().on('dom-ready', () => {
  if (process.platform === 'darwin') {
    remote.getCurrentWebContents().executeJavaScript(`
      var div = document.createElement("div");
      div.style.position = "absolute";
      div.style.top = 0;
      div.style.height = "23px";
      div.style.width = "100%";
      div.style["-webkit-app-region"] = "drag";
      div.style["pointer-events"] = "none";
      document.body.appendChild(div);
    `)
  }
})

// Workaround for flash freeze
const resetFreeze = debounce(() => {
  if (document.querySelector('kan-game webview')) {
    document.querySelector('kan-game webview').executeJavaScript('document.body.style.display="flex";setTimeout(()=>document.body.style.display=null, 10)')
  }
}, 200)
remote.getCurrentWindow().on('show', resetFreeze)
remote.getCurrentWindow().on('restore', resetFreeze)

// Workaround for touch screen
// List of active touches.
const activeTouches = {}
// Click counter
let numClicks = 0
// Timer for reseting click counter, so it may be cleared.
let clickCountTimer = null
// Reference to the last touch object received at a location;
let lastTouch = null
// Distance away from initial touch that constitutes cancelation, or disqualifies from doubleclick.
const moveThreshold = 10

const webContents = require('electron').remote.getCurrentWebContents()

const handlers = {}

// Handler for touchstart events. Tracks active touches.
handlers.touchstart = function(event) {
  // Store touches for later use.
  const touches = Array.from(event.changedTouches)
  touches.forEach((touch) => {
    touch.defaultPrevented = event.defaultPrevented
    activeTouches[touch.identifier] = touch
  })
}

// Handler for touchend events. Tells main process to generate mouse events.
handlers.touchend = function(event) {
  // Check if somebody tried to prevent touches from becoming clicks.
  let defaultPrevented = event.defaultPrevented
  // Prevent touches from being translated to clicks, do it ourselves
  event.preventDefault()
  // Translate corresponding touches to mouse events.
  const touches = Array.from(event.changedTouches)
  touches.forEach((end) => {
    const start = activeTouches[end.identifier]
    // Check if defualt was prevented in touchstart also.
    defaultPrevented = defaultPrevented || start.defaultPrevented
    delete activeTouches[end.identifier]

    // Don't fire click if the default action was prevented by user
    //   or if the touch was otherwise cancelled (cancel or too much movement)
    if (defaultPrevented !== true && start.cancelled !== true) {
      const x = Math.round(end.clientX),
        y = Math.round(end.clientY)
      // Keep track of the number of clicks within 500ms of eachother closer than the moveThreshold
      // (for double clicks)
      if (numClicks == 0 || dist(lastTouch, end) <= moveThreshold) {
        numClicks++
      } else { // numClicks > 0 && dist > moveThreshold
        clearTimeout(clickCountTimer)
        numClicks = 1
      }
      lastTouch = end
      if (numClicks == 1) {
        clickCountTimer = setTimeout(function() {
          numClicks = 0
          lastTouch = null
          clickCountTimer = null
        }, 500)
      }
      falsifyClick(x, y, numClicks)
    }
  })
}

// Capture touchstart, touchend events first thing when they happens.
document.addEventListener('touchstart', captureHandler, {
  capture: true,
  passive: false,
})
document.addEventListener('touchend', captureHandler, {
  capture: true,
  passive: false,
})

function captureHandler(event) {
  const stopPropagation = event.stopPropagation
  const stopImmediatePropagation = event.stopImmediatePropagation
  // Ensure that our handler is called for touchstart, even if propagation of the event is stopped.
  //   Keeps everything clean.
  event.stopPropagation = function() {
    stopPropagation.apply(event)
    handlers[event.type](event, true)
  }
  event.stopImmediatePropagation = function() {
    stopImmediatePropagation.apply(event)
    handlers[event.type](event, true)
  }
}

// Listen for bubbling touchstart events on the document.
document.addEventListener('touchstart', handlers.touchstart, {
  capture: false,
  passive: false,
})

// Listen for bubbling touchend events on the document.
document.addEventListener('touchend', handlers.touchend, {
  capture: false,
  passive: false,
})

// Cancel corresponding touches if touch was canceled.
document.addEventListener('touchcancel', function(event) {
  const touches = Array.from(event.changedTouches)
  touches.forEach((touch) => {
    activeTouches[touch.identifier].cancelled = true
  })
},  {
  capture: true,
  passive: true,
})

// Prevent default touchmove actions (scrolling)
document.addEventListener('touchmove', function(event) {event.preventDefault}, {
  capture: true,
  passive: false,
})
// Cancel corresponding touches if touch moved too much.
// Handle scrolling.
document.addEventListener('touchmove', function(event) {
  const touches = Array.from(event.changedTouches)
  touches.forEach((touch) => {
    const start = activeTouches[touch.identifier]
    if (start.scrolling) {
      const target = start.scrollTarget
      target.scrollTop += start.scrollY - touch.clientY
      target.scrollLeft += start.scrollX - touch.clientX
      start.scrollX = touch.clientX
      start.scrollY = touch.clientY
      return
    }
    if (start.cancelled) {
      return
    }

    if (dist(start, touch) > moveThreshold) {
      start.cancelled = true
      start.scrolling = true
      const target = start.scrollTarget = getScrollParent(start.target)
      target.scrollTop += start.clientY - touch.clientY
      target.scrollLeft += start.clientX - touch.clientX
      start.scrollX = touch.clientX
      start.scrollY = touch.clientY
    }
  })
},  {
  capture: true,
  passive: true,
})

function falsifyClick(x, y, numClicks) {
  webContents.sendInputEvent({
    type: 'mouseMove',
    x: x,
    y: y,
  })
  webContents.sendInputEvent({
    type: 'mouseDown',
    x: x,
    y: y,
    button: 'left',
    clickCount: numClicks,
  })
  webContents.sendInputEvent({
    type: 'mouseUp',
    x: x,
    y: y,
    button: 'left',
    clickCount: numClicks,
  })
}

// Calculates the distance between two touches.
function dist(touch1, touch2) {
  return Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY)
}

// https://stackoverflow.com/questions/35939886
function getScrollParent(element, includeHidden) {
  let style = getComputedStyle(element)
  const excludeStaticParent = style.position === "absolute"
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/

  if (style.position === "fixed") return document.body
  for (let parent = element; (parent = parent.parentElement);) {
    style = getComputedStyle(parent)
    if (excludeStaticParent && style.position === "static") {
      continue
    }
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) return parent
  }

  return document.body
}
