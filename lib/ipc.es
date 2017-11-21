//
// ipc: Inter-Plugins Call
//
import { EventEmitter } from 'events'

class IPC extends EventEmitter {
  constructor() {
    super()
    this.data = new Object()
  }

  // scope:  string
  // opts:   key-func Object
  register = (scope, opts) => {
    if (!(scope && opts)) {
      console.error("Invalid scope or opts:", scope, opts)
      return
    }
    if (!this.data[scope]) {
      this.data[scope]= new Object()
    }
    this.unregister(scope, Object.keys(opts))
    for (const key in opts) {
      this.data[scope][key] = opts[key]
    }
    this.emit('update', {type: '@@registerIPC', value: { scope, opts }})
    return
  }

  // scope:  string
  // keys:   string / Array of string / key-func Object
  unregister = (scope, keys) => {
    if (!(scope && keys)) {
      console.error("Invalid scope or keys:", scope, keys)
      return
    }
    if (!this.data[scope]) {
      return
    }
    if (typeof keys === "string") {
      keys = new Array(keys)
    }
    if (keys instanceof Object && !(keys instanceof Array)) {
      keys = Object.keys(keys)
    }
    for (const key of keys) {
      delete this.data[scope][key]
    }
    this.emit('update', {type: '@@unregisterIPC', value: { scope, keys }})
    return
  }

  unregisterAll = (scope) => {
    delete this.data[scope]
    this.emit('update', {type: '@@unregisterAllIPC', value: { scope }})
  }

  access = (scope) => {
    return this.data[scope]
  }

  // key:    string
  // args:   arguments passing to api
  foreachCall = (key, ...args) => {
    for (const scope in this.data) {
      if (this.data[scope].hasOwnProperty(key)){
        this.data[key].apply(null, args)
      }
    }
  }
}

export default new IPC()
