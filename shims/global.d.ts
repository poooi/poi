// React 19 moved JSX types into the React module (React.JSX).
// Augment React.JSX.IntrinsicElements so custom HTML elements are recognized in TSX files.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'title-bar': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
      'poi-main': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
      'poi-nav': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
      'poi-nav-tabs': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
      'poi-info': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
      'kan-game': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

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

  // let and const do not show up on globalThis
  /* eslint-disable no-var */
  var EXROOT: string
  var ROOT: string
  var DEFAULT_CACHE_PATH: string
  var PLUGIN_PATH: string
  var PLUGIN_EXTRA_PATH: string
  /* eslint-enable no-var */
}

export {}
