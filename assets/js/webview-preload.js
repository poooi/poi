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

// Faster zoomLevel setting
window.webFrame = electron.webFrame
var ROOT = remote.getGlobal('ROOT')
var config = remote.require(`${ROOT}/lib/config`)
zoom = config.get('poi.webview.width', 800) / 800
webFrame.setZoomFactor(zoom)
