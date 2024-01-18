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
  interface Window {
    toast: (message: string, config: ToastConfig) => void
  }
  // let and const do not show up on globalThis
  /* eslint-disable no-var */
  var EXROOT: string
  var ROOT: string
  var DEFAULT_CACHE_PATH: string
  var isMain: boolean | undefined
  /* eslint-enable no-var */
}

export {}
