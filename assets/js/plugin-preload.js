const { remote } = require('electron')
const ROOT = remote.getGlobal('ROOT')
const MODULE_PATH = remote.getGlobal('MODULE_PATH')
const APPDATA_PATH = remote.getGlobal('APPDATA_PATH')
const config = remote.require('./lib/config')

require('module').globalPaths.push(MODULE_PATH)
require('babel-register')(require(`${ROOT}/babel.config`))
require('coffee-react/register')
async function setPath() {
  require(`${ROOT}/lib/module-path`).setAllowedPath([ ROOT, APPDATA_PATH, await remote.getCurrentWebContents().executeJavaScript('__dirname') ])
}
setPath()

const onZoomChange = (value) => {
  remote.getCurrentWebContents().setZoomFactor(value)
}

const handleZoom = (path, value) => {
  if (path === 'poi.zoomLevel') {
    onZoomChange(value)
  }
}

config.addListener('config.set', handleZoom)

window.addEventListener('unload', (e) => {
  config.removeListener('config.set', handleZoom)
})

document.addEventListener('DOMContentLoaded', () => onZoomChange(config.get('poi.zoomLevel', 1)))
document.addEventListener('DOMContentLoaded', () => {
  if (config.get('poi.useCustomTitleBar', process.platform === 'win32' || process.platform === 'linux')) {
    const titlebar = document.createElement('div')
    titlebar.id = "electron-titlebar"
    document.body.insertBefore(titlebar, document.body.firstElementChild)
    const ReactDOM = require('react-dom')
    const React = require('react')
    const path = require('path')
    const { TitleBar } = require('electron-react-titlebar')
    ReactDOM.render(React.createElement(
      TitleBar,
      { icon: path.join(window.ROOT, 'assets', 'icons', 'poi_32x32.png'), menu: [] },
      React.createElement('link', { rel: 'stylesheet', type: 'text/css', href: require.resolve('electron-react-titlebar/assets/style.css') })
    ), document.querySelector('#electron-titlebar'))
  }
})
