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

// FIXME: Hack for letting react-bootstrap modal work under 16
const { Modal } = require('react-overlays')
Modal.prototype.componentWillMount = function () {
  this.focus = () => {}
}
