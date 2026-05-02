import './const'
import type { IPC } from 'lib/ipc'

import * as remote from '@electron/remote'

// babel-plugin-add-module-exports skips when it sees the type-only re-export
// alongside the default export, so remote.require returns { default: IPC }
const ipcModule: { default?: IPC } & IPC = remote.require('./lib/ipc')
const ipc: IPC = ipcModule.default ?? ipcModule

declare global {
  interface Window {
    /** @deprecated use `ipc` from `views/env` instead*/
    ipc: IPC
  }
}

window.ipc = ipc

export { ipc, type IPC }
