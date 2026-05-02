import * as remote from '@electron/remote'
import fs from 'fs-extra'
import lodash from 'lodash-es'
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
import './env-parts/i18next'
import './env-parts/notif-center'
import './env-parts/modal'
import './env-parts/theme'
import './env-parts/data-resolver'
import './env-parts/getter'
import './env-parts/devtool-message'
import './polyfills/react-fontawesome'
import './polyfills/react-i18next'
import './env-parts/plugin-require'

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
export * from './env-parts/ipc'
export * from './env-parts/dbg'

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

if (process.env.NODE_ENV === 'production' && config.get?.('poi.misc.exceptionReporting')) {
  init({
    build: LATEST_COMMIT,
    paths: [ROOT, APPDATA_PATH],
  })
}
