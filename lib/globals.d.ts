// Global declarations for the main process.
// These live in a .d.ts (not in the modules that assign them) because Babel's
// TypeScript scope checking rejects a `declare global` var alongside a
// same-named module-level binding, which tsc accepts.
import type { BrowserWindow } from 'electron'

declare global {
  var mainWindow: BrowserWindow
  var windows: (BrowserWindow | null)[]
  var windowsIndex: {
    [key: string]: BrowserWindow | null
  }

  // Environment globals kept for the renderer bridge (remote.getGlobal in
  // views/env-parts/const.ts) and third-party plugins. ROOT, EXROOT and
  // DEFAULT_CACHE_PATH are declared in shims/global.d.ts.
  /** @deprecated Use `import { POI_VERSION } from './env'` (lib/env) instead */
  var POI_VERSION: string
  /** @deprecated Use `import { EXECROOT } from './env'` (lib/env) instead */
  var EXECROOT: string
  /** @deprecated Use `import { APPDATA_PATH } from './env'` (lib/env) instead */
  var APPDATA_PATH: string
  /** @deprecated Use `import { DEFAULT_SCREENSHOT_PATH } from './env'` (lib/env) instead */
  var DEFAULT_SCREENSHOT_PATH: string
  /** @deprecated Use `import { MODULE_PATH } from './env'` (lib/env) instead */
  var MODULE_PATH: string
  // Assigned by app.ts once the debug mode is known.
  var SERVER_HOSTNAME: string
}

export {}
