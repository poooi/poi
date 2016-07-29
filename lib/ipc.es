//
// ipc: Inter-Plugins Call
//

class IPC {
  constructor() {
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
    return
  }

  unregisterAll = (scope) => {
    delete this.data[scope]
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
