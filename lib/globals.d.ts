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
}

export {}
