const electron = require('electron')
const remote = electron.remote
const Promise = require('bluebird')
const config = remote.require('./lib/config')
require('coffee-script/register')

// webview focus area fix
// This is a workaround for https://bugs.chromium.org/p/chromium/issues/detail?id=600395
window.onclick = (e) => {
  remote.getCurrentWindow().webContents.executeJavaScript(`
    $('webview').blur()
    $('webview').focus()
  `)
}

// Faster align setting
const webFrame = electron.webFrame

const alertCSS =
`#alert {
  transform: scale(0.8);
  left: 80px !important;
  top: -80px !important;
}
`

const alignCSS = document.createElement('style')
const alignInnerCSS = document.createElement('style')

const getWebviewWidth = Promise.coroutine(function* () {
  const width = yield new Promise((resolve, reject) => {
    remote.getCurrentWindow().webContents.executeJavaScript("$('webview').getBoundingClientRect().width", (result) => {
      resolve(result)
    })
  })
  return width
})

function factortolevel(factor) {
  return Math.log(factor) / Math.log(1.2)
}
  
function setZoomHarder(wv,zoomlevel) {
  wv.setLayoutZoomlevelLimits(zoomlevel,zoomlevel);
  wv.setZoomLevel(zoomLevel);
}

window.align = Promise.coroutine(function* () {
  let zoom = yield getWebviewWidth()
  zoom = zoom / 800
  //webFrame.setZoomFactor(zoom)
  setZoomHarder(webFrame,factortolevel(zoom))
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
    width: 800px !important;
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
})

window.unalign = () => {
  alignCSS.innerHTML = ""
  alignInnerCSS.innerHTML = ""
}

window.align()

remote.getCurrentWebContents().insertCSS(alertCSS)

const handleDOMContentLoaded = () => {
  window.align()
  document.querySelector('body').appendChild(alignCSS)
  const flashQuality = config.get('poi.flashQuality', 'high')
  const flashWindowMode = config.get('poi.flashWindowMode', 'window')
  const t = setInterval(() => {
    try {
      const iframeDoc = document.querySelector('#game_frame') ? document.querySelector('#game_frame').contentWindow.document : document
      iframeDoc.querySelector('body').appendChild(alignInnerCSS)
      if (flashQuality !== 'high' || flashWindowMode !== 'window') {
        const flash = iframeDoc.querySelector('#externalswf').cloneNode(true)
        flash.setAttribute('quality', flashQuality)
        flash.setAttribute('wmode', flashWindowMode)
        iframeDoc.querySelector('#externalswf').remove()
        iframeDoc.querySelector('#flashWrap').appendChild(flash)  
        clearInterval(t)
        console.warn('Successed.', new Date())
      }
    } catch (e) {
      console.warn('Failed. Will retry in 100ms.')
    }
  }, 100)
  document.removeEventListener("DOMContentLoaded", handleDOMContentLoaded)
}

document.addEventListener("DOMContentLoaded", handleDOMContentLoaded)
