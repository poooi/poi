const { remote, webFrame } = require('electron')
const config = remote.require('./lib/config')

if (config.get('poi.content.muted', false)) {
  remote.getCurrentWebContents().setAudioMuted(true)
}

document.addEventListener('DOMContentLoaded', (e) => {
  if (config.get('poi.enableDMMcookie', false)) {
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
  if (config.get('poi.disableNetworkAlert', false)) {
    // eslint-disable-next-line no-undef
    DMM.netgame.reloadDialog=function(){}
  }
})

// Faster align setting
const alertCSS =
`#alert {
  transform: scale(0.8);
  left: 80px !important;
  top: -80px !important;
}
`

const alignCSS = document.createElement('style')
const alignInnerCSS = document.createElement('style')

window.align = async function () {
  const zoom = await remote.getCurrentWindow().webContents.executeJavaScript("document.querySelector('webview').getBoundingClientRect().width") / 1200
  // use trick from https://github.com/electron/electron/issues/6958#issuecomment-271179700
  // TODO: check if can be removed after https://github.com/electron/electron/pull/8537 is merged
  webFrame.setLayoutZoomLevelLimits(-999999, 999999)
  webFrame.setZoomFactor(zoom)
  const zl = webFrame.getZoomLevel()
  webFrame.setLayoutZoomLevelLimits(zl, zl)
  window.scrollTo(0, 0)
  if (!window.location.toString().includes("http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/")) {
    return
  }
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
  alignInnerCSS.innerHTML = `
#spacing_top {
  display: none;
}
`
}

window.unalign = () => {
  alignCSS.innerHTML = ""
  alignInnerCSS.innerHTML = ""
}

window.align()

// ref for item purchase css insertion
const webContent = remote.getCurrentWebContents()

const handleDOMContentLoaded = () => {
  window.align()
  document.querySelector('body').appendChild(alignCSS)
  webContent.insertCSS(alertCSS)
  let count = -1
  const t = setInterval(() => {
    try {
      count++
      if (count > 1245) clearInterval(t)
      const iframeDoc = document.querySelector('#game_frame') ? document.querySelector('#game_frame').contentWindow.document : document
      iframeDoc.querySelector('body').appendChild(alignInnerCSS)
      clearInterval(t)
      console.warn('Successed.', new Date(), `retry count: ${count}`)
    } catch (e) {
      console.warn('Failed. Will retry in 1000ms.')
    }
  }, 1000)
  document.removeEventListener("DOMContentLoaded", handleDOMContentLoaded)
}

document.addEventListener("DOMContentLoaded", handleDOMContentLoaded)


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

remote.getCurrentWindow().webContents.executeJavaScript('window.dispatchEvent(new Event(\'webview-loaded\'))')
