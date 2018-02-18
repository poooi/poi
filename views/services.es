import { remote, shell } from 'electron'
import { isInGame } from 'views/utils/game-utils'
import { observer, observe } from 'redux-observers'
import { store } from 'views/create-store'
import { Trans } from 'react-i18next'
import React from 'react'

const proxy = remote.require('./lib/proxy')
const { config, toggleModal, log, error, dbg } = window

const { stopNavigateAndNewWindow } = remote.require('./lib/utils')

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
    toggleModal(<Trans>Exit</Trans>, <Trans>Confirm?</Trans>, [{
      name: <Trans>Confirm</Trans>,
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
    log(<span><Trans>Hit</Trans>{method} {resPath}</span>, {dontReserve: true})
  }
})
window.addEventListener ('network.error', () => {
  error(<Trans>Connection failed.</Trans>, {dontReserve: true})
})
window.addEventListener('network.error.retry', (e) => {
  const {counter} = e.detail
  error(<Trans i18nKey='ConnectionFailedMsg'>{{ count: counter }}</Trans>, {dontReserve: true})
})
window.addEventListener('network.invalid.result', (e) => {
  const {code} = e.detail
  error(<Trans i18nKey='CatError'>{{ code }}</Trans>, {dontReserve: true})
})

const handleExternalURL = (e, url) => {
  e.preventDefault()
  if (!url.startsWith('file'))
    shell.openExternal(url)
}

remote.getCurrentWebContents().on('devtools-opened', e => window.dispatchEvent(new Event('resize')))
remote.getCurrentWebContents().on('new-window', handleExternalURL)
remote.getCurrentWebContents().on('will-navigate', handleExternalURL)
stopNavigateAndNewWindow(remote.getCurrentWebContents().id)

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

// Workaround for touch screen
let transformedToMouseEvent = false, isMoved = false
const webContents = remote.getCurrentWebContents()
window.addEventListener('touchend', (e) => {
  transformedToMouseEvent = false
  setTimeout(() => {
    if (!transformedToMouseEvent) {
      console.warn("Blurring focusing element")
      document.activeElement.blur()
      e.target.focus()
      if (!isMoved) {
        const x = Math.round(e.changedTouches[0].clientX),
          y = Math.round(e.changedTouches[0].clientY)
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
          clickCount: 1,
        })
        webContents.sendInputEvent({
          type: 'mouseUp',
          x: x,
          y: y,
          button: 'left',
          clickCount: 1,
        })
      }
    }
  }, 300)
})
window.addEventListener('touchstart', (e) => {
  isMoved = false
})
window.addEventListener('touchmove', (e) => {
  isMoved = true
})
window.addEventListener('mouseup', (e) => {
  transformedToMouseEvent = true
})
