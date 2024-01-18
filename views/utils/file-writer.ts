import { writeFile, ensureDir, WriteFileOptions } from 'fs-extra'
import { dirname } from 'path'

// A stream of async file writing. `write` queues the task which will be executed
// after all tasks before are done.
// Every instance contains an independent queue.
// Usage:
// var fw = new FileWriter();
// var path = '/path/to/a/file';
// for (var i = 0; i < 100; i++) {
//   fw.write(path, (''+i).repeat(10000));
// }
export default class FileWriter {
  private writing: boolean
  private _queue: Array<[string, string, WriteFileOptions | BufferEncoding | string]>

  constructor() {
    this.writing = false
    this._queue = []
  }

  write(path: string, data: string, options: WriteFileOptions | BufferEncoding | string) {
    this._queue.push([path, data, options])
    this._continueWriting()
  }

  private async _continueWriting() {
    if (this.writing) return
    this.writing = true
    while (this._queue.length > 0) {
      const [path, data, options] = this._queue.shift() || ['', '', '']
      await ensureDir(dirname(path))
      await writeFile(path, data, options)
    }
    this.writing = false
  }
}
