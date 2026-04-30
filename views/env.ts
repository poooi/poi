require('@babel/register')(require('../babel-register.config'))
import type { Tray } from 'electron/main'
import type { Constant } from 'lib/constant'

import * as remote from '@electron/remote'
import fs from 'fs-extra'
import lodash from 'lodash'
import { join } from 'path'
import { config } from 'views/env-parts/config'

import { setAllowedPath } from '../lib/module-path'
import './polyfills/react-i18next'
import './polyfills/react-fontawesome'
import './polyfills/react-bootstrap'
import { init } from '../lib/sentry'

// Environments
declare global {
  interface Window {
    remote: typeof remote
    ROOT: string
    EXROOT: string
    APPDATA_PATH: string
    PLUGIN_PATH: string
    PLUGIN_EXTRA_PATH: string
    POI_VERSION: string
    LATEST_COMMIT: string
    SERVER_HOSTNAME: string
    MODULE_PATH: string
    appTray?: Tray
    isSafeMode: boolean
    isDevVersion: boolean
    CONST: Constant
    /** @deprecated Use `import lodash from 'lodash'` instead */
    _: typeof lodash
    /** @deprecated Use `document.querySelector` instead */
    $: (selector: string) => Element | null
    /** @deprecated Use `document.querySelectorAll` instead */
    $$: (selector: string) => NodeListOf<Element>
  }
}
window.remote = remote
window.ROOT = join(__dirname, '..')
window.EXROOT = remote.getGlobal('EXROOT')
window.APPDATA_PATH = remote.getGlobal('APPDATA_PATH')
window.PLUGIN_PATH = join(window.APPDATA_PATH, 'plugins')
window.PLUGIN_EXTRA_PATH = join(window.APPDATA_PATH, 'plugins-extra')
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
setAllowedPath(window.MODULE_PATH, window.ROOT)

if (window.isMain) {
  fs.ensureDirSync(window.PLUGIN_PATH)
  fs.ensureDirSync(join(window.PLUGIN_PATH, 'node_modules'))
  fs.ensureDirSync(window.PLUGIN_EXTRA_PATH)
  fs.ensureDirSync(join(window.PLUGIN_EXTRA_PATH, 'node_modules'))

  const { stopNavigateAndHandleNewWindow, handleWebviewPreloadHack } =
    remote.require('./lib/webcontent-utils')
  stopNavigateAndHandleNewWindow(remote.getCurrentWebContents().id)
  handleWebviewPreloadHack(remote.getCurrentWebContents().id)
}

require('./env-parts/dbg')

// Disable eval
window.eval = global.eval = function () {
  throw new Error('Sorry, this app does not support window.eval().')
}

// Shortcuts and Components
window._ = lodash // TODO: Backward compatibility
window.$ = (param: string) => document.querySelector(param)
window.$$ = (param: string) => document.querySelectorAll(param)

// Polyfills
Object.clone = (obj: unknown) => JSON.parse(JSON.stringify(obj))
Object.remoteClone = (obj: unknown) =>
  JSON.parse(window.remote.require('./lib/utils').remoteStringify(obj))

// Node modules
require('./env-parts/config')
window.ipc = remote.require('./lib/ipc')
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
window.CONST = Object.remoteClone(remote.require('./lib/constant')) as Constant

if (process.env.NODE_ENV === 'production' && config.get?.('poi.misc.exceptionReporting')) {
  init({
    build: window.LATEST_COMMIT,
    paths: [window.ROOT, window.APPDATA_PATH],
  })
}

// i18n config
require('./env-parts/i18next')

// window.notify
require('./env-parts/notif-center')
require('./env-parts/modal')

// Custom theme
require('./env-parts/theme')

// Global data resolver
require('./env-parts/data-resolver')

// Getter
require('./env-parts/getter')

// Only used by main window
if (window.isMain) {
  require('./env-parts/devtool-message')
}
