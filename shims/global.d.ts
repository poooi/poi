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
    style: string
  }

  interface IpcManager {
    register: (namespace: string, handlers: Record<string, (...args: unknown[]) => unknown>) => void
    unregisterAll: (namespace: string) => void
    access: (namespace: string) => Record<string, (...args: unknown[]) => unknown>
  }

  interface Window {
    POI_VERSION: string
    isSafeMode: boolean
    notify: (options: { title: string; body: string; icon?: string } | null) => void
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
  /* eslint-enable no-var */
}

declare module '*.css'

export {}
