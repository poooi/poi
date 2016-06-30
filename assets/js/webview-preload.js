var electron = require('electron')
var remote = electron.remote
var Promise = require('bluebird')
require('coffee-script/register')

// webview focus area fix
console.log('This is a workaround for https://bugs.chromium.org/p/chromium/issues/detail?id=600395')
window.onclick = (e) => {
  remote.getCurrentWindow().webContents.executeJavaScript(`
    $('webview').blur()
    $('webview').focus()
  `)
}

// Faster align setting
if (window.location.toString() !== "http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/") {
  return
}

webFrame = electron.webFrame
var ROOT = remote.getGlobal('ROOT')
var config = remote.require(`${ROOT}/lib/config`)

var alertCSS =
`#alert {
  transform: scale(0.8);
  left: 80px !important;
  top: -80px !important;
}
`

var alignCSS = document.createElement('style')

getWebviewWidth = Promise.coroutine(function* () {
  var width = yield new Promise((resolve, reject) => {
    remote.getCurrentWindow().webContents.executeJavaScript("$('webview').getBoundingClientRect().width", (result) => {
      resolve(result)
    })
  })
  return width
})

window.align = Promise.coroutine(function* () {
  var zoom
  zoom = yield getWebviewWidth()
  zoom = zoom / 800
  webFrame.setZoomFactor(zoom)
  window.scrollTo(0, 0)
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
    top: -16px;
    left: 0;
  }
  #spacing_top {
    display: none;
  }
  .naviapp {
    z-index: -1;
  }
  `
})
window.unalign = () => {
  alignCSS.innerHTML = ""
}

window.align()

remote.getCurrentWebContents().insertCSS(alertCSS)
document.addEventListener("DOMContentLoaded", (e) => {
  document.querySelector('body').appendChild(alignCSS)
})
