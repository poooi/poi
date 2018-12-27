require('coffee-react/register')
require('@babel/register')(require('../babel.config'))
import path from 'path-extra'
import fs from 'fs-extra'
import { remote } from 'electron'
import lodash from 'lodash'
import * as ReactBootstrap from 'react-bootstrap'
import { OverlayTrigger, Modal } from './utils/overlay'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
// polyfill for react-fontawesome
import '@skagami/react-fontawesome/inject'
library.add(fas, far, fab)

// Environments
window.remote = remote
window.ROOT = path.join(__dirname, '..')
window.EXROOT = remote.getGlobal('EXROOT')
window.APPDATA_PATH = remote.getGlobal('APPDATA_PATH')
window.PLUGIN_PATH = path.join(window.APPDATA_PATH, 'plugins')
window.POI_VERSION = remote.getGlobal('POI_VERSION')
window.SERVER_HOSTNAME = remote.getGlobal('SERVER_HOSTNAME')
window.MODULE_PATH = remote.getGlobal('MODULE_PATH')
window.appTray = remote.getGlobal('appTray')
window.isSafeMode = remote.getGlobal('isSafeMode')
window.isDevVersion = remote.getGlobal('isDevVersion')

// Temp: remove package-lock.json of plugin folder
fs.remove(path.join(window.PLUGIN_PATH, 'package-lock.json'))

if (window.isMain) {
  // Plugins
  fs.ensureDirSync(window.PLUGIN_PATH)
  fs.ensureDirSync(path.join(window.PLUGIN_PATH, 'node_modules'))
  // Debug
  window.dbg = require(path.join(window.ROOT, 'lib', 'debug'))
  window.dbg.init()
}

// Add ROOT to `require` search path
require('module').globalPaths.unshift(window.ROOT)

// Disable eval
window.eval = global.eval = function() {
  throw new Error('Sorry, this app does not support window.eval().')
}

// Shortcuts and Components
window._ = lodash // TODO: Backward compatibility
window.$ = param => document.querySelector(param)
window.$$ = param => document.querySelectorAll(param)

// Polyfills
Object.clone = obj => JSON.parse(JSON.stringify(obj))
Object.remoteClone = obj => JSON.parse(window.remote.require('./lib/utils').remoteStringify(obj))

// Node modules
const originConfig = remote.require('./lib/config')
window.ipc = remote.require('./lib/ipc')
window.proxy = remote.require('./lib/proxy')
window.CONST = Object.remoteClone(remote.require('./lib/constant'))
window.config = {}
for (const key in originConfig) {
  window.config[key] = originConfig[key]
}

// i18n config
require('./env-parts/i18next')

// window.notify
// msg=null: Sound-only notification.
require('./env-parts/notif-center')
require('./env-parts/modal')

// Custom theme
// You should call window.applyTheme() to apply a theme properly.
require('./env-parts/theme')

// Global data resolver
require('./env-parts/data-resolver')

// Getter
require('./env-parts/getter')

// Only used by main window
if (window.isMain) {
  // Add devtool debug message print
  require('./env-parts/devtool-message')
}

// polyfill for React-Bootstrap's overlays
/* eslint-disable import/namespace */
if (window.isMain) {
  ReactBootstrap.OverlayTrigger = OverlayTrigger
  ReactBootstrap.Modal = Modal
}
/* eslint-enable import/namespace */
