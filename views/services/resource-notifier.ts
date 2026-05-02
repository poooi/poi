import type * as remote from '@electron/remote'

// session is set via Object.defineProperty in @electron/remote and is not in the ESM namespace;
// use the CJS require to get the live getter.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const remoteBuiltins: typeof remote = require('@electron/remote')
import EventEmitter from 'events'
const { session } = remoteBuiltins

export const ResourceNotifier = new (class ResourceNotifier extends EventEmitter {
  constructor() {
    super()
    session.defaultSession.webRequest.onSendHeaders((detail) => {
      this.emit('request', detail)
    })
  }
})()
