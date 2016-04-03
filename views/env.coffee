require 'coffee-react/register'
require('babel-register')(require('../babel.config'))
path = require 'path-extra'
fs = require 'fs-extra'

# Environments
window.remote = require('electron').remote
window.ROOT = path.join(__dirname, '..')
window.EXROOT = remote.getGlobal 'EXROOT'
window.APPDATA_PATH = remote.getGlobal 'APPDATA_PATH'
window.PLUGIN_PATH = path.join window.APPDATA_PATH, 'plugins'
window.POI_VERSION = remote.getGlobal 'POI_VERSION'
window.SERVER_HOSTNAME = remote.getGlobal 'SERVER_HOSTNAME'
window.MODULE_PATH = remote.getGlobal 'MODULE_PATH'
window.appIcon = remote.getGlobal 'appIcon'
fs.ensureDirSync window.PLUGIN_PATH
fs.ensureDirSync path.join window.PLUGIN_PATH, 'node_modules'

# Shortcuts and Components
(window.dbg = require path.join(ROOT, 'lib', 'debug')).init()
window._ = require 'underscore'
window.$ = (param) -> document.querySelector(param)
window.$$ = (param) -> document.querySelectorAll(param)
window.jQuery = require 'jquery'
window.React = require 'react'
window.ReactDOM = require 'react-dom'
window.ReactBootstrap = require 'react-bootstrap'
window.FontAwesome = require 'react-fontawesome'

if dbg.isEnabled()
  process.stderr.write = console.log.bind(console)
  process.stdout.write = console.log.bind(console)
else
  process.stderr.write = (e) -> {}
  process.stdout.write = (e) -> {}

# Utils
require './env-parts/utils'

# Node modules
window.config = remote.require './lib/config'
window.ipc = remote.require './lib/ipc'
window.proxy = remote.require './lib/proxy'
window.CONST = Object.remoteClone remote.require './lib/constant'

## window.notify
# msg=null: Sound-only notification.
require './env-parts/notify'

# User configs
require './env-parts/user-config'

# i18n config
require './env-parts/i18n-config'

# Alert helpers.
#   Requires: window.i18n
require './env-parts/alert'

# Custom theme
# You should call window.applyTheme() to apply a theme properly.
require './env-parts/theme'

# Global data resolver
require './env-parts/data-resolver'
