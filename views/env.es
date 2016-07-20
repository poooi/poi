require('coffee-react/register')
require('babel-register')(require('../babel.config'))
import path from 'path-extra'
import fs from 'fs-extra'
import { remote } from 'electron'

// Environments
window.remote = remote
window.ROOT = path.join(__dirname, '..')
window.EXROOT = remote.getGlobal('EXROOT')
window.APPDATA_PATH = remote.getGlobal('APPDATA_PATH')
window.PLUGIN_PATH = path.join(window.APPDATA_PATH, 'plugins')
window.POI_VERSION = remote.getGlobal('POI_VERSION')
window.SERVER_HOSTNAME = remote.getGlobal('SERVER_HOSTNAME')
window.MODULE_PATH = remote.getGlobal('MODULE_PATH')
window.appIcon = remote.getGlobal('appIcon')
fs.ensureDirSync(window.PLUGIN_PATH)
fs.ensureDirSync(path.join(window.PLUGIN_PATH, 'node_modules'))

// Shortcuts and Components
window.dbg = require(path.join(window.ROOT, 'lib', 'debug'))
window.dbg.init()
window._ = require('underscore')
window.$ = (param) => document.querySelector(param)
window.$$ = (param) => document.querySelectorAll(param)
window.jQuery = require('jquery')
window.React = require('react')
window.ReactDOM = require('react-dom')
window.ReactBootstrap = require('react-bootstrap')
window.FontAwesome = require('react-fontawesome')

if (window.dbg.isEnabled()) {
  process.stderr.write = console.error.bind(console)
  process.stdout.write = console.warn.bind(console)
}

// Utils
require('./env-parts/utils')

// Node modules
window.config = remote.require('./lib/config')
window.ipc = remote.require('./lib/ipc')
window.proxy = remote.require('./lib/proxy')
window.CONST = Object.remoteClone(remote.require('./lib/constant'))


// i18n config
require('./env-parts/i18n-config')

// window.notify
// msg=null: Sound-only notification.
require('./env-parts/notify')

// Custom theme
// You should call window.applyTheme() to apply a theme properly.
require('./env-parts/theme')

// Global data resolver
require('./env-parts/data-resolver')

// Getter
require('./env-parts/getter')
