//
// ipc: Inter-Plugins Call
//
import { EventEmitter } from 'events'
import { mapValues } from 'lodash'

class IPC extends EventEmitter {
  data: Record<string, Record<string, (...arg: never[]) => never | never>> = {}

  // scope:  string
  // opts:   key-func Object
  register = (scope: string, opts: object) => {
    if (!(scope && opts)) {
      console.error('Invalid scope or opts:', scope, opts)
      return
    }
    if (!this.data[scope]) {
      this.data[scope] = {}
    }
    this.unregister(scope, Object.keys(opts))
    for (const key in opts) {
      this.data[scope][key] = opts[key as keyof typeof opts]
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
    if (typeof keys === 'string') {
      keys = new Array(keys)
    }
    if (keys instanceof Object && !(keys instanceof Array)) {
      keys = Object.keys(keys)
    }
    for (const key of keys as string[]) {
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
        this.data[scope][key].apply(null as never, args)
      }
    }
  }
}

export default new IPC()
