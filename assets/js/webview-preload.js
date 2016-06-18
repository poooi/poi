var electron = require('electron')
var remote = electron.remote
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

window.align = () => {
  var zoom
  zoom = config.get('poi.webview.width', 800) / 800
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
}
window.unalign = () => {
  alignCSS.innerHTML = ""
}

window.align()

remote.getCurrentWebContents().insertCSS(alertCSS)
document.addEventListener("DOMContentLoaded", (e) => {
  document.querySelector('body').appendChild(alignCSS)
})
