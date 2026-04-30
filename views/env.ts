require('@babel/register')(require('../babel-register.config'))

import * as remote from '@electron/remote'
import fs from 'fs-extra'
import lodash from 'lodash'
import { join } from 'path'

import { setAllowedPath } from '../lib/module-path'
import { init } from '../lib/sentry'
import { config } from './env-parts/config'
import {
  APPDATA_PATH,
  isMain,
  LATEST_COMMIT,
  MODULE_PATH,
  PLUGIN_EXTRA_PATH,
  PLUGIN_PATH,
  ROOT,
} from './env-parts/const'

// Add ROOT to `require` search path
setAllowedPath(MODULE_PATH, ROOT)

// Re-exports
export {
  config,
  type ConfigInstance,
  type Config,
  type ConfigValue,
  type ConfigPath,
} from './env-parts/config'
export * from './env-parts/const'

// Fallback support of remote module
if (!require('electron').remote) {
  require('electron').remote = remote
}

if (isMain) {
  fs.ensureDirSync(PLUGIN_PATH)
  fs.ensureDirSync(join(PLUGIN_PATH, 'node_modules'))
  fs.ensureDirSync(PLUGIN_EXTRA_PATH)
  fs.ensureDirSync(join(PLUGIN_EXTRA_PATH, 'node_modules'))

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
  JSON.parse(remote.require('./lib/utils').remoteStringify(obj))

// Node modules
require('./env-parts/config')
window.ipc = remote.require('./lib/ipc')

if (process.env.NODE_ENV === 'production' && config.get?.('poi.misc.exceptionReporting')) {
  init({
    build: LATEST_COMMIT,
    paths: [ROOT, APPDATA_PATH],
  })
}

// Polyfill for old plugins
require('./polyfills/react-bootstrap')
require('./polyfills/react-fontawesome')
require('./polyfills/react-i18next')

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
if (isMain) {
  require('./env-parts/devtool-message')
}
