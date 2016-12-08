import { remote } from 'electron'
import { isInGame } from 'views/utils/game-utils'

const {$, config, toggleModal, log, error, i18n, dbg} = window
const __ = i18n.others.__.bind(i18n.others)
const __n = i18n.others.__n.bind(i18n.others)

const WindowManager = remote.require('./lib/window')

import './services/update'
import './services/layout'
import './services/welcome'
import './services/doyouknow'
import './services/modernization-delta'
import './services/developmentProphecy'
import './services/sortieDangerousCheck'
import './services/sortieFreeSlotCheck'
import './services/print-debug-message'

const refreshFlash = () =>
  $('kan-game webview').executeJavaScript(`
    var doc;
    if (document.getElementById('game_frame')) {
      doc = document.getElementById('game_frame').contentDocument;
    } else {
      doc = document;
    }
    var flash = doc.getElementById('flashWrap');
    if(flash) {
      var flashInnerHTML = flash.innerHTML;
      flash.innerHTML = '';
      flash.innerHTML = flashInnerHTML;
    }
  `)

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
        $('kan-game webview').reloadIgnoringCache()
      } else if (e.altKey) { // cmd + alt + r
        refreshFlash()
      } else { // cmd + r
        // Catched by menu
        // $('kan-game webview').reload()
        return false
      }
    }
  } else if (e.keyCode === 116){
    if (e.ctrlKey) { // ctrl + f5
      $('kan-game webview').reloadIgnoringCache()
    } else if (e.altKey){ // alt + f5
      refreshFlash()
    } else if (!e.metaKey){ // f5
      $('kan-game webview').reload()
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
    toggleModal(__('Exit'), __('Confirm?'), [{
      name: __('Confirm'),
      func: exitPoi,
      style: 'warning',
    }])
    e.returnValue = false
  }
}
class GameResponse {
  constructor(path, body, postBody) {
    this.path = path
    this.body = body
    this.postBody = postBody
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
  const {method, body, postBody} = e.detail
  const resPath = e.detail.path
  if (dbg.extra('gameResponse').isEnabled()) {
    dbg._getLogFunc()(new GameResponse(resPath, body, postBody))
  }
  if (config.get('poi.showNetworkLog', true)) {
    log(`${__('Hit')} ${method} ${resPath}`, {dontReserve: true})
  }
})
window.addEventListener ('network.error', () => {
  error(__('Connection failed.'), {dontReserve: true})
})
window.addEventListener('network.error.retry', (e) => {
  const {counter} = e.detail
  error(__n('Connection failed after %s retry',  counter), {dontReserve: true})
})
window.addEventListener('network.invalid.result', (e) => {
  const {code} = e.detail
  error(__('The server presented you a cat. (Error code: %s)',  code), {dontReserve: true})
})

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
  if (config.get('poi.content.muted', false)) {
    $('kan-game webview').setAudioMuted(true)
  }
  if ($('kan-game').style.display !== 'none')  {
    $('kan-game webview').loadURL(config.get('poi.homepage', 'http://www.dmm.com/netgame/social/application/-/detail/=/app_id=854854/'))
  }
  $('kan-game webview').addEventListener('dom-ready', (e) => {
    if (config.get('poi.enableDMMcookie', false)) {
      $('kan-game webview').executeJavaScript(`
        document.cookie = "cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/";
        document.cookie = "cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame/";
        document.cookie = "cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame_s/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=osapi.dmm.com;path=/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=203.104.209.7;path=/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=www.dmm.com;path=/netgame/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=log-netgame.dmm.com;path=/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame_s/";
      `)
    }
    if (config.get('poi.disableNetworkAlert', false)) {
      $('kan-game webview').executeJavaScript('DMM.netgame.reloadDialog=function(){}')
    }
  })
  $('kan-game webview').addEventListener('new-window', (e) => {
    const exWindow = WindowManager.createWindow({
      realClose: true,
      navigatable: true,
      nodeIntegration: false,
    })
    exWindow.loadURL(e.url)
    exWindow.show()
    e.preventDefault()
  })
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
