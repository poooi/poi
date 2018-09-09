/* global getStore, config, toggleModal, log, error, dbg */
import { remote } from 'electron'
import { isInGame } from 'views/utils/game-utils'
import { observer, observe } from 'redux-observers'
import { store } from 'views/create-store'
import i18next from 'views/env-parts/i18next'

const proxy = remote.require('./lib/proxy')

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
  if (config.get('poi.misc.networklog', true)) {
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

remote.getCurrentWindow().on('show', () => {
  if (getStore('layout.webview.ref')) {
    getStore('layout.webview.ref').executeJavaScript('align()')
  }
})
