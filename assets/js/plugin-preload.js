const { remote } = require('electron')
const ROOT = remote.getGlobal('ROOT')
const MODULE_PATH = remote.getGlobal('MODULE_PATH')
const config = remote.require('./lib/config')

require('module').globalPaths.push(MODULE_PATH)
require('babel-register')(require(`${ROOT}/babel.config`))
require('coffee-react/register')

const onZoomChange = (value) => {
  document.body.style.zoom = value
}

config.on('config.set', (path, value) => {
  if (path === 'poi.zoomLevel') {
    onZoomChange(value)
  }
})

document.addEventListener('DOMContentLoaded', () => onZoomChange(config.get('poi.zoomLevel', 1)))
