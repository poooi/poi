// Typed source of truth for the main-process environment (version and paths).
// Import these constants from './env' in main-process code.
//
// The same values are also assigned to `global` for backwards compatibility:
// the renderer bridges them via remote.getGlobal (views/env-parts/const.ts)
// and third-party plugins may read them directly, so the globals must keep
// being set. Their declarations live in globals.d.ts / shims/global.d.ts.
import { app } from 'electron'
import path from 'path'

export const POI_VERSION = app.getVersion()
export const ROOT = path.join(__dirname, '..')
export const EXECROOT = path.join(process.execPath, '..')
export const APPDATA_PATH = path.join(app.getPath('appData'), 'poi')
export const EXROOT = APPDATA_PATH
export const DEFAULT_CACHE_PATH = path.join(EXROOT, 'MyCache')
export const DEFAULT_SCREENSHOT_PATH =
  process.platform === 'darwin'
    ? path.join(app.getPath('home'), 'Pictures', 'Poi')
    : path.join(APPDATA_PATH, 'screenshots')
export const MODULE_PATH = path.join(ROOT, 'node_modules')

global.POI_VERSION = POI_VERSION
global.ROOT = ROOT
global.EXECROOT = EXECROOT
global.APPDATA_PATH = APPDATA_PATH
global.EXROOT = EXROOT
global.DEFAULT_CACHE_PATH = DEFAULT_CACHE_PATH
global.DEFAULT_SCREENSHOT_PATH = DEFAULT_SCREENSHOT_PATH
global.MODULE_PATH = MODULE_PATH
