import type { Tray } from 'electron/main'
import type { Constant } from 'lib/constant'
import type lodash from 'lodash-es'

import * as remote from '@electron/remote'
import { cloneDeep } from 'lodash-es'
import { join } from 'path'

// Environments
declare global {
  interface Window {
    /** @deprecated Use `import { isMain } from 'views/env'` instead */
    isMain: boolean
    /** @deprecated Use `import * as remote from '@electron/remote'` instead */
    remote: typeof remote
    /** @deprecated Use `import { ROOT } from 'views/env'` instead */
    ROOT: string
    /** @deprecated Use `import { EXROOT } from 'views/env'` instead */
    EXROOT: string
    /** @deprecated Use `import { APPDATA_PATH } from 'views/env'` instead */
    APPDATA_PATH: string
    /** @deprecated Use `import { PLUGIN_PATH } from 'views/env'` instead */
    PLUGIN_PATH: string
    /** @deprecated Use `import { PLUGIN_EXTRA_PATH } from 'views/env'` instead */
    PLUGIN_EXTRA_PATH: string
    /** @deprecated Use `import { POI_VERSION } from 'views/env'` instead */
    POI_VERSION: string
    /** @deprecated Use `import { LATEST_COMMIT } from 'views/env'` instead */
    LATEST_COMMIT: string
    /** @deprecated Use `import { SERVER_HOSTNAME } from 'views/env'` instead */
    SERVER_HOSTNAME: string
    /** @deprecated Use `import { MODULE_PATH } from 'views/env'` instead */
    MODULE_PATH: string
    /** @deprecated Use `import { appTray } from 'views/env'` instead */
    appTray?: Tray
    /** @deprecated Use `import { isSafeMode } from 'views/env'` instead */
    isSafeMode: boolean
    /** @deprecated Use `import { isDevVersion } from 'views/env'` instead */
    isDevVersion: boolean
    /** @deprecated Use `import type { Constant } from 'lib/constant'; remote.require('./lib/constant') as Constant` instead */
    CONST: Constant
    /** @deprecated Use `import lodash from 'lodash-es'` instead */
    _: typeof lodash
    /** @deprecated Use `document.querySelector` instead */
    $: (selector: string) => Element | null
    /** @deprecated Use `document.querySelectorAll` instead */
    $$: (selector: string) => NodeListOf<Element>
  }
}
export const ROOT = String(remote.getGlobal('ROOT'))
export const EXROOT = String(remote.getGlobal('EXROOT'))
export const APPDATA_PATH = String(remote.getGlobal('APPDATA_PATH'))
export const PLUGIN_PATH = join(APPDATA_PATH, 'plugins')
export const PLUGIN_EXTRA_PATH = join(APPDATA_PATH, 'plugins-extra')
export const POI_VERSION = String(remote.getGlobal('POI_VERSION'))
export const LATEST_COMMIT = String(remote.getGlobal('LATEST_COMMIT'))
export const SERVER_HOSTNAME = String(remote.getGlobal('SERVER_HOSTNAME'))
export const MODULE_PATH = String(remote.getGlobal('MODULE_PATH'))
export const isMain: boolean | undefined = window.isMain
export const isSafeMode: boolean = remote.getGlobal('isSafeMode')
export const isDevVersion: boolean = remote.getGlobal('isDevVersion')
export const appTray: Tray = remote.getGlobal('appTray')
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const CONST = cloneDeep(remote.require('./lib/constant')) as Constant

// Backward compatibility
window.remote = remote
window.ROOT = ROOT
window.EXROOT = EXROOT
window.APPDATA_PATH = APPDATA_PATH
window.PLUGIN_PATH = PLUGIN_PATH
window.PLUGIN_EXTRA_PATH = PLUGIN_EXTRA_PATH
window.POI_VERSION = POI_VERSION
window.LATEST_COMMIT = LATEST_COMMIT
window.SERVER_HOSTNAME = SERVER_HOSTNAME
window.MODULE_PATH = MODULE_PATH
window.appTray = appTray
window.isSafeMode = isSafeMode
window.isDevVersion = isDevVersion
window.CONST = CONST
