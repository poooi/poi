//
// ipc: Inter-Plugins Call
//
import { EventEmitter } from 'events'
import { mapValues } from 'lodash'

type IPCFunction = (...args: never[]) => unknown

class IPC extends EventEmitter {
  data: Record<string, Record<string, IPCFunction>> = {}

  // scope:  string
  // opts:   key-func Object
  register = (scope: string, opts: Record<string, IPCFunction>) => {
    if (!(scope && opts)) {
      console.error('Invalid scope or opts:', scope, opts)
      return
    }
    if (!this.data[scope]) {
      this.data[scope] = {}
    }
    this.unregister(scope, Object.keys(opts))
    for (const key of Object.keys(opts)) {
      this.data[scope][key] = opts[key]
    }
    this.emit('update', { type: '@@registerIPC', value: { scope, opts } })
    return
  }

  // scope:  string
  // keys:   string / Array of string / key-func Object
  unregister = (scope: string, keys: string | string[] | object) => {
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
      delete this.data[scope][key]
    }
    this.emit('update', { type: '@@unregisterIPC', value: { scope, keys } })
    return
  }

  unregisterAll = (scope: string) => {
    delete this.data[scope]
    this.emit('update', { type: '@@unregisterAllIPC', value: { scope } })
  }

  access = (scope: string) => {
    return this.data[scope]
  }

  list = () => mapValues(this.data, (scope) => mapValues(scope, () => true))

  // key:    string
  // args:   arguments passing to api
  foreachCall = (key: string, ...args: never[]) => {
    for (const scope in this.data) {
      if (Object.prototype.hasOwnProperty.call(this.data[scope], key)) {
        this.data[scope][key].apply(null, args)
      }
    }
  }
}

export default new IPC()
