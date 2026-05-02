import type { Dispatch } from 'redux'

import * as remote from '@electron/remote'
import { clipboard } from 'electron'
import { observer, observe } from 'redux-observers'
import { store, getStore, dispatch } from 'views/create-store'
import { config } from 'views/env'
import { dbg } from 'views/env-parts/dbg'
import i18next from 'views/env-parts/i18next'
import { toggleModal } from 'views/env-parts/modal'
import { log, error } from 'views/services/alert'
import { isInGame } from 'views/utils/game-utils'

const gameAPIBroadcaster: GameAPIBroadcaster = remote.require('./lib/game-api-broadcaster')
import './services/update'
import './services/layout'
import './services/welcome'
import './services/modernization-delta'
import './services/marriage-delta'
import './services/development-prophecy'
import './services/sortie-dangerous-check'
import './services/sortie-expedition-resupply-check'
import './services/sortie-free-slot-check'
import './services/sortie-unused-slot-check'
import './services/event-sortie-check'
import './services/google-analytics'
import './services/battle-notify'
import type { GameAPIBroadcaster } from 'lib/game-api-broadcaster'

import { isEqual } from 'lodash-es'

import { gameRefreshPage, gameRefreshPageIgnoringCache, gameReload } from './services/utils'

// Update server info
const setUpdateServer = (dispatch: Dispatch) => {
  gameAPIBroadcaster.addListener('kancolle.server.change', ({ ip, num: id, name }) => {
    if (!isEqual(getStore('info.server'), { ip, id, name })) {
      if (ip) {
        dispatch({
          type: '@@ServerReady',
          serverInfo: { ip, id, name },
        })
      }
    }
  })
}
const serverObserver = observer(
  (state: { info: { server: { ip: string } } }) => state.info.server.ip,
  (dispatch: Dispatch, current: string) => {
    if (!current) {
      setUpdateServer(dispatch)
    }
  },
)
setUpdateServer(dispatch)

observe(store, [serverObserver])

// F5 & Ctrl+F5 & Alt+F5
window.addEventListener('keydown', async (e) => {
  const isingame = await isInGame()
  if (
    (document.activeElement?.tagName === 'WEBVIEW' && !isingame) ||
    document.activeElement?.tagName === 'INPUT'
  ) {
    return
  }
  if (process.platform == 'darwin') {
    if (e.keyCode === 91 || e.keyCode === 93) {
      remote.getCurrentWindow().blurWebView()
    } else if (e.keyCode === 82 && e.metaKey) {
      if (e.shiftKey) {
        gameRefreshPageIgnoringCache()
      } else if (e.altKey) {
        gameReload()
      } else {
        return false
      }
    }
  } else if (e.keyCode === 116) {
    if (e.ctrlKey) {
      gameRefreshPageIgnoringCache()
    } else if (e.altKey) {
      gameReload()
    } else if (!e.metaKey) {
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
window.onbeforeunload = (e: BeforeUnloadEvent) => {
  if (confirmExit || !config.get('poi.confirm.quit', false)) {
    exitPoi()
  } else {
    toggleModal(String(i18next.t('Exit')), String(i18next.t('Confirm?')), [
      {
        name: i18next.t('Confirm'),
        func: exitPoi,
        style: 'warning',
      },
    ])
    e.returnValue = false
  }
}

class GameResponse {
  path: string
  body: unknown
  postBody: unknown

  constructor(path: string, body: unknown, postBody: unknown, time: number) {
    this.path = path
    this.body = body
    this.postBody = postBody
    Object.defineProperty(this, 'time', {
      get: () => String(new Date(time)),
    })
    Object.defineProperty(this, 'ClickToCopy -->', {
      get: () => {
        clipboard.writeText(JSON.stringify({ path, body, postBody }))
        return `Copied: ${this.path}`
      },
    })
  }
}

window.addEventListener('game.request', () => {
  // noop
})
window.addEventListener('game.response', (e) => {
  const { method, body, postBody, time } = e.detail
  const resPath = e.detail.path
  dbg?.extra('gameResponse')?.log(new GameResponse(resPath, body, postBody, time))
  if (config.get('poi.misc.networklog', true)) {
    log(`${i18next.t('Hit')}: ${method} ${resPath}`, { dontReserve: true })
  }
})
window.addEventListener('network.error', () => {
  error(i18next.t('Connection failed'), { dontReserve: true })
})
window.addEventListener('network.invalid.result', (e) => {
  const { code } = e.detail
  error(i18next.t('CatError', { code }), { dontReserve: true })
})

remote
  .getCurrentWebContents()
  .on('devtools-opened', () => window.dispatchEvent(new Event('resize')))

remote.getCurrentWebContents().on('dom-ready', () => {
  if (process.platform === 'darwin') {
    remote.getCurrentWebContents().executeJavaScript(`
      var div = document.createElement("div");
      div.style.position = "absolute";
      div.style.top = 0;
      div.style.height = "40px";
      div.style.width = "100%";
      div.style["-webkit-app-region"] = "drag";
      div.style["pointer-events"] = "none";
      document.body.appendChild(div);
    `)
  }
})

remote.getCurrentWindow().on('show', () => {
  getStore('layout.webview.ref')?.executeJavaScript('align()')
})
