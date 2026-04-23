import { type ConfigInstance } from 'lib/config'

interface ToastConfig {
  type: string
  title: string
}

declare global {
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
    style: string
  }

  interface IpcManager {
    register: (namespace: string, handlers: Record<string, (...args: unknown[]) => unknown>) => void
    unregisterAll: (namespace: string) => void
    access: (namespace: string) => Record<string, (...args: unknown[]) => unknown>
  }

  interface Window {
    toast: (message: string, options?: Partial<ToastConfig>) => void
    POI_VERSION: string
    isSafeMode: boolean
    LOCALES: Array<{ locale: string }>
    reloadPlugin: (pkgName: string, verbose?: boolean) => Promise<void>
    gracefulResetPlugin: () => void
    toggleModal: (title: string, message: string, buttons: ModalButton[]) => void
    openSettings?: () => void
  }
  // let and const do not show up on globalThis
  /* eslint-disable no-var */
  var EXROOT: string
  var ROOT: string
  var DEFAULT_CACHE_PATH: string
  var isMain: boolean | undefined
  var config: ConfigInstance
  var getStore: {
    (path?: string): unknown
    lock: boolean
    cache: unknown
  }
  var PLUGIN_PATH: string
  var PLUGIN_EXTRA_PATH: string
  var dispatch: (action: { type: string; [key: string]: unknown }) => void
  var language: string
  var ipc: IpcManager
  var toast: (message: string, options?: Partial<ToastConfig>) => void
  /* eslint-enable no-var */
}

export {}
