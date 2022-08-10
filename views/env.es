require('@babel/register')(require('../babel-register.config'))
import path from 'path-extra'
import fs from 'fs-extra'
import * as remote from '@electron/remote'
import lodash from 'lodash'
import { init } from '../lib/sentry'
import { setAllowedPath } from '../lib/module-path'

import './polyfills/react-i18next'
import './polyfills/react-fontawesome'
import './polyfills/react-bootstrap'

// Environments
window.remote = remote
window.ROOT = path.join(__dirname, '..')
window.EXROOT = remote.getGlobal('EXROOT')
window.APPDATA_PATH = remote.getGlobal('APPDATA_PATH')
window.PLUGIN_PATH = path.join(window.APPDATA_PATH, 'plugins')
window.PLUGIN_EXTRA_PATH = path.join(window.APPDATA_PATH, 'plugins-extra')
window.POI_VERSION = remote.getGlobal('POI_VERSION')
window.LATEST_COMMIT = remote.getGlobal('LATEST_COMMIT')
window.SERVER_HOSTNAME = remote.getGlobal('SERVER_HOSTNAME')
window.MODULE_PATH = remote.getGlobal('MODULE_PATH')
window.appTray = remote.getGlobal('appTray')
window.isSafeMode = remote.getGlobal('isSafeMode')
window.isDevVersion = remote.getGlobal('isDevVersion')

// Fallback support of remote module
if (!require('electron').remote) {
  require('electron').remote = remote
}

// Add ROOT to `require` search path
setAllowedPath(window.MODULE_PATH, window.ROOT, window.APPDATA_PATH)

if (window.isMain) {
  // Plugins
  fs.ensureDirSync(window.PLUGIN_PATH)
  fs.ensureDirSync(path.join(window.PLUGIN_PATH, 'node_modules'))
  fs.ensureDirSync(window.PLUGIN_EXTRA_PATH)
  fs.ensureDirSync(path.join(window.PLUGIN_EXTRA_PATH, 'node_modules'))

  // Debug
  window.dbg = require(path.join(window.ROOT, 'lib', 'debug'))
  window.dbg.init()

  // Handle New Window

  const { stopNavigateAndHandleNewWindow } = remote.require('./lib/webcontent-utils')
  stopNavigateAndHandleNewWindow(remote.getCurrentWebContents().id)
}

// Disable eval
window.eval = global.eval = function () {
  throw new Error('Sorry, this app does not support window.eval().')
}

// Shortcuts and Components
window._ = lodash // TODO: Backward compatibility
window.$ = (param) => document.querySelector(param)
window.$$ = (param) => document.querySelectorAll(param)

// Polyfills
Object.clone = (obj) => JSON.parse(JSON.stringify(obj))
Object.remoteClone = (obj) => JSON.parse(window.remote.require('./lib/utils').remoteStringify(obj))

// Node modules
const originConfig = remote.require('./lib/config')
window.ipc = remote.require('./lib/ipc')
window.proxy = remote.require('./lib/proxy')
window.CONST = Object.remoteClone(remote.require('./lib/constant'))
window.config = {}
for (const key in originConfig) {
  window.config[key] = originConfig[key]
}

if (process.env.NODE_ENV === 'production' && window.config.get?.('poi.misc.exceptionReporting')) {
  init({
    build: window.LATEST_COMMIT,
    paths: [window.ROOT, window.APPDATA_PATH],
  })
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
