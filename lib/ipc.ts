//
// ipc: Inter-Plugins Call
//
import { EventEmitter } from 'events'
import { mapValues } from 'lodash'

type IPCFunction = (...args: unknown[]) => unknown

type IPCStore = Record<string, unknown> & {
  WebView?: {
    width?: number
  }
  MainWindow?: {
    ipcFocusPlugin?: (id: string) => void
  }
}

type Scope = keyof IPCStore

type IPCUpdateEventType = '@@registerIPC' | '@@unregisterIPC' | '@@unregisterAllIPC'
type IPCUpdateEventPayload = {
  scope: Scope
  opts?: Record<string, unknown>
  keys?: string[]
}
type IPCUpdateEvent = {
  type: IPCUpdateEventType
  payload: IPCUpdateEventPayload
}

interface IPCEventMap {
  update: [IPCUpdateEvent]
}

class IPC extends EventEmitter<IPCEventMap> {
  data: IPCStore = {}

  // scope:  string
  // opts:   key-func Object
  register = (scope: Scope, opts: Record<string, unknown>) => {
    if (!(scope && opts)) {
      console.error('Invalid scope or opts:', scope, opts)
      return
    }
    if (!this.data[scope]) {
      this.data[scope] = {}
    }
    this.unregister(scope, Object.keys(opts))
    let key: keyof typeof opts
    for (key of Object.keys(opts)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      ;(this.data[scope] as { [key: string]: unknown })[key] = opts[key]
    }
    this.emit('update', { type: '@@registerIPC', payload: { scope, opts } })
    return
  }

  // scope:  string
  // keys:   string / Array of string / key-func Object
  unregister = (scope: Scope, keys: string | string[] | object) => {
    if (!(scope && keys)) {
      console.error('Invalid scope or keys:', scope, keys)
      return
    }
    if (!this.data[scope]) {
      return
    }
    let keysToRemove: string[]
    if (typeof keys === 'string') {
      keysToRemove = [keys]
    } else if (Array.isArray(keys)) {
      keysToRemove = keys
    } else {
      keysToRemove = Object.keys(keys)
    }
    for (const key of keysToRemove) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      delete (this.data[scope] as { [key: string]: unknown })[key]
    }
    this.emit('update', { type: '@@unregisterIPC', payload: { scope, keys: keysToRemove } })
    return
  }

  unregisterAll = (scope: Scope) => {
    delete this.data[scope]
    this.emit('update', { type: '@@unregisterAllIPC', payload: { scope } })
  }

  access = <S extends Scope>(scope: S): IPCStore[S] => {
    return this.data[scope]
  }

  list = () =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    mapValues(this.data, (scope) => mapValues(scope as { [key: string]: unknown }, () => true))

  // key:    string
  // args:   arguments passing to api
  foreachCall = (key: string, ...args: never[]) => {
    for (const scope in this.data) {
      if (Object.prototype.hasOwnProperty.call(this.data[scope], key)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        ;(this.data[scope] as { [key: string]: IPCFunction })[key].apply(null, args)
      }
    }
  }
}

export default new IPC()
export { type IPC }
