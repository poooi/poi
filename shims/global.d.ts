import type * as remote from '@electron/remote'
import type { ConfigValue } from 'lib/config'
import type { Constant } from 'lib/constant'
import type lodash from 'lodash'
import type { getStore as GetStore } from 'views/create-store'

declare global {
  interface File {
    path: string
  }

  namespace NodeJS {
    interface Global {
      EXROOT: string
      ROOT: string
      DEFAULT_CACHE_PATH: string
    }
  }
  interface ModalButton {
    name: string
    func: () => void
    style?: string
    intent?: string
  }

  interface IpcManager {
    register: (namespace: string, handlers: Record<string, (...args: unknown[]) => unknown>) => void
    unregisterAll: (namespace: string) => void
    access: (namespace: string) => Record<string, (...args: unknown[]) => unknown>
  }

  interface ObjectConstructor {
    clone: (obj: unknown) => unknown
    remoteClone: (obj: unknown) => unknown
  }

  interface Window {
    POI_VERSION: string
    LATEST_COMMIT: string
    SERVER_HOSTNAME: string
    MODULE_PATH: string
    APPDATA_PATH: string
    CONST: Constant
    isSafeMode: boolean
    isDevVersion: boolean
    remote: typeof remote
    notify: (
      msg: string,
      options?: { type?: keyof ConfigValue<'poi.notify'>; volume?: number; icon?: string },
    ) => void
    success: (msg: string, options?: unknown) => void
    error: (msg: string, options?: unknown) => void
    warn: (msg: string, options?: unknown) => void
    hack: Record<string, unknown>
    listenerStatusFlag: boolean
    dbg?: { isEnabled?: () => boolean }
    _ships: Record<string | number, unknown>
    _slotitems: Record<string | number, unknown>
    $ships: Record<string | number, unknown>
    externalWindow?: Window
    toggleWelcomeDialog?: () => void
    _: typeof lodash
    $: (selector: string) => Element | null
    $$: (selector: string) => NodeListOf<Element>
  }

  namespace JSX {
    interface IntrinsicElements {
      'title-bar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'poi-main': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'poi-nav': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'poi-nav-tabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'poi-info': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      'kan-game': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }

  // let and const do not show up on globalThis
  /* eslint-disable no-var */
  var EXROOT: string
  var ROOT: string
  var DEFAULT_CACHE_PATH: string
  var isMain: boolean | undefined
  var PLUGIN_PATH: string
  var PLUGIN_EXTRA_PATH: string
  var ipc: IpcManager
  var getStore: typeof GetStore
  var ga: (...args: unknown[]) => void
  var log: (msg: string, options?: unknown) => void
  var error: (msg: string, options?: unknown) => void
  var warn: (msg: string, options?: unknown) => void
  var success: (msg: string, options?: unknown) => void
  /* eslint-enable no-var */
}

declare module '*.css'

export {}
