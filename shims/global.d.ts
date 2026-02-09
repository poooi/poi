import type { BrowserWindow, Tray } from 'electron'
import type { ConfigInstance } from 'lib/config'
import type Debug from 'lib/debug'
import type { DbgInstance } from 'lib/debug'

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
    config: ConfigInstance
    dbg?: DbgInstance
  }
  // let and const do not show up on globalThis
  /* eslint-disable no-var */
  var EXROOT: string
  var ROOT: string
  var DEFAULT_CACHE_PATH: string
  var isMain: boolean | undefined
  var LATEST_COMMIT: string
  var isSafeMode: boolean
  var isDevVersion: boolean
  var dbg: typeof Debug
  var config: ConfigInstance
  var mainWindow: BrowserWindow
  var windows: Array<BrowserWindow | null>
  var windowsIndex: Record<string, BrowserWindow | null>
  var appTray: Tray
  /* eslint-enable no-var */
}

export {}
