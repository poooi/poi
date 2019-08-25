import { remote } from 'electron'
import EventEmitter from 'events'

const { session } = remote

export const ResourceNotifier = new (class ResourceNotifier extends EventEmitter {
  constructor() {
    super()
    session.defaultSession.webRequest.onSendHeaders(detail => {
      this.emit('request', detail)
    })
  }
})()
