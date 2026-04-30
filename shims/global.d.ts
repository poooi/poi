declare global {
  interface File {
    path: string
  }

  namespace NodeJS {
    interface Global {
      EXROOT: string
      ROOT: string
      DEFAULT_CACHE_PATH: string
      PLUGIN_PATH: string
      PLUGIN_EXTRA_PATH: string
    }
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
    externalWindow?: Window
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
  var PLUGIN_PATH: string
  var PLUGIN_EXTRA_PATH: string
  var ipc: IpcManager
  /* eslint-enable no-var */
}

declare module '*.css'

export {}
