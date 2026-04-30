import type { IPC } from 'lib/ipc'

import * as remote from '@electron/remote'

const ipc: IPC = remote.require('./lib/ipc')

declare global {
  interface Window {
    /** @deprecated use `ipc` from `views/env` instead*/
    ipc: IPC
  }
}

window.ipc = ipc

export { ipc, type IPC }
