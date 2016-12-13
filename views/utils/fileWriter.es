import { promisify } from 'bluebird'
import { writeFile, ensureDir } from 'fs-extra'
import { dirname } from 'path-extra'

// A stream of async file writing. `write` queues the task which will be executed
// after all tasks before are done.
// Every instance contains an independent queue.
// Usage:
// var fw = new FileWriter()
// var path = '/path/to/a/file'
// for (var i = 0; i < 100; i++) {
//   fw.write(path, (''+i).repeat(10000))
// }
export default class FileWriter {
  constructor() {
    this.writing = false
    this._queue = []
  }

  write(path, data, options, callback) {
    this._queue.push([path, data, options, callback])
    this._continueWriting()
  }

  async _continueWriting() {
    if (this.writing)
      return
    this.writing = true
    while (this._queue.length) {
      const [path, data, options, callback] = this._queue.shift()
      await promisify(ensureDir)(dirname(path))
      const err = await promisify(writeFile)(path, data, options)
      if (callback)
        callback(err)
    }
    this.writing = false
  }

}
