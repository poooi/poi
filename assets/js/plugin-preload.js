const remote = require('@electron/remote')
const ROOT = remote.getGlobal('ROOT')
const MODULE_PATH = remote.getGlobal('MODULE_PATH')
const APPDATA_PATH = remote.getGlobal('APPDATA_PATH')
const config = remote.require('./lib/config')
require('@babel/register')(require(`${ROOT}/babel-register.config`))
const { setAllowedPath } = require(`${ROOT}/lib/module-path`)

setAllowedPath(MODULE_PATH, ROOT, APPDATA_PATH)

const onZoomChange = (value) => {
  remote.getCurrentWebContents().zoomFactor = value
}

const handleZoom = (path, value) => {
  if (path === 'poi.appearance.zoom') {
    onZoomChange(value)
  }
}

config.addListener('config.set', handleZoom)

window.addEventListener('unload', (e) => {
  config.removeListener('config.set', handleZoom)
})

document.addEventListener('DOMContentLoaded', () =>
  onZoomChange(config.get('poi.appearance.zoom', 1)),
)
