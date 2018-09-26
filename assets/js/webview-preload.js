const { remote, webFrame } = require('electron')
const config = remote.require('./lib/config')

window.ipc = remote.require('./lib/ipc')

if (config.get('poi.content.muted', false)) {
  remote.getCurrentWebContents().setAudioMuted(true)
}

document.addEventListener('DOMContentLoaded', (e) => {
  if (config.get('poi.misc.dmmcookie', false)) {
    document.cookie = 'cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/'
    document.cookie = 'cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame/'
    document.cookie = 'cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame_s/'
    document.cookie = 'ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=osapi.dmm.com;path=/'
    document.cookie = 'ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=203.104.209.7;path=/'
    document.cookie = 'ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=www.dmm.com;path=/netgame/'
    document.cookie = 'ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=log-netgame.dmm.com;path=/'
    document.cookie = 'ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/'
    document.cookie = 'ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame/'
    document.cookie = 'ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame_s/'
    const ua = remote.getCurrentWebContents().session.getUserAgent()
    remote.getCurrentWebContents().session.setUserAgent(ua, 'ja-JP')
  }
  if (config.get('poi.misc.disablenetworkalert', false) && window.DMM) {
    window.DMM.netgame.reloadDialog = function(){}
  }
})

// Faster align setting
const alertCSS =
`#alert {
  left: 270px !important;
  top: 83px !important;
  border: 0;
}
`

const alignCSS = document.createElement('style')
alignCSS.innerHTML =
`html {
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

const disableTab = e => {
  if (e.key === 'Tab') {
    e.preventDefault()
  }
}

function handleSpacingTop(show, count=0) {
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
    frameDocument[action]('keydown', disableTab)
    frameDocument.querySelector('#spacing_top').style.display = status
    frameDocument.querySelector('#htmlWrap').contentDocument[action]('keydown', disableTab)
  } catch (e) {
    setTimeout(() => handleSpacingTop(show, count + 1), 1000)
  }
}

function handleZoom(count=0) {
  if (count > 20) {
    return
  }
  const width = window.ipc.access('WebView').width
  const zoom = Math.round(width * config.get('poi.appearance.zoom', 1)) / 1200
  if (Number.isNaN(zoom)) {
    setTimeout(() => handleZoom(count + 1), 1000)
    return
  }
  webFrame.setZoomFactor(zoom)
  const zl = webFrame.getZoomLevel()
  webFrame.setLayoutZoomLevelLimits(zl, zl)
}

window.align = function () {
  if (location.pathname.includes('854854') || location.hostname === 'osapi.dmm.com') {
    document.body.appendChild(alignCSS)
    handleSpacingTop(false)
    window.scrollTo(0, 0)
  } else if (location.pathname.includes('kcs')) {
    document.body.appendChild(alignCSS)
  }
  handleZoom()
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

if (window.location.toString().includes('http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/')) {
  const _documentWrite = document.write
  document.write = function() {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      console.warn(`Block document.write since document is at state "${document.readyState}". Blocked call:`, arguments)
    } else {
      _documentWrite.apply(this, arguments)
    }
  }
}

// A workaround for drop-and-drag navigation
remote.require('./lib/utils').stopFileNavigateAndHandleNewWindowInApp(remote.getCurrentWebContents().id)
