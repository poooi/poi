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

  interface ObjectConstructor {
    clone: <T>(obj: T) => T
    remoteClone: <T>(obj: T) => T
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
  /* eslint-enable no-var */
}

declare module '*.css'

export {}
