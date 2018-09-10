const { remote, webFrame } = require('electron')
const config = remote.require('./lib/config')

window.ipc = remote.require('./lib/ipc')

if (config.get('poi.content.muted', false)) {
  remote.getCurrentWebContents().setAudioMuted(true)
}

document.addEventListener('DOMContentLoaded', (e) => {
  if (config.get('poi.misc.dmmcookie', false)) {
    document.cookie = "cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/"
    document.cookie = "cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame/"
    document.cookie = "cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame_s/"
    document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=osapi.dmm.com;path=/"
    document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=203.104.209.7;path=/"
    document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=www.dmm.com;path=/netgame/"
    document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=log-netgame.dmm.com;path=/"
    document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/"
    document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame/"
    document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame_s/"
    const ua = remote.getCurrentWebContents().session.getUserAgent()
    remote.getCurrentWebContents().session.setUserAgent(ua, 'ja-JP')
  }
  if (config.get('poi.misc.disablenetworkalert', false) && window.DMM) {
    window.DMM.netgame.reloadDialog=function(){}
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

function handleSpacingTop(show) {
  const status = show ? 'block' : 'none'
  if (document.querySelector('#spacing_top')) {
    document.querySelector('#spacing_top').style.display = status
  }
  if (!document.querySelector('#game_frame')) {
    return
  }
  function t(count) {
    try {
      if (count > 20) {
        return
      }
      document.querySelector('#game_frame').contentWindow.document.querySelector('#spacing_top').style.display = status
    } catch (e) {
      setTimeout(() => t(count + 1), 1000)
    }
  }
  t(0)
}

window.align = function () {
  if (!location.pathname.includes('854854')) {
    return
  }
  document.body.appendChild(alignCSS)
  handleSpacingTop(false)
  window.scrollTo(0, 0)
  remote.getCurrentWindow().webContents.executeJavaScript(
    "document.querySelector('webview').getBoundingClientRect().width",
    width => {
      const zoom = Math.round(width * config.get('poi.appearance.zoom', 1)) / 1200
      if (Number.isNaN(zoom)) {
        setTimeout(window.align, 1000)
        return
      }
      webFrame.setZoomFactor(zoom)
      const zl = webFrame.getZoomLevel()
      webFrame.setLayoutZoomLevelLimits(zl, zl)
    }
  )
}

window.unalign = () => {
  if (!location.pathname.includes('854854')) {
    return
  }
  document.body.removeChild(alignCSS)
  if (document.querySelector('#spacing_top')) {
    document.querySelector('#spacing_top').style.display = 'block'
  }
  handleSpacingTop(true)
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

if (window.location.toString().includes("http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/")) {
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
