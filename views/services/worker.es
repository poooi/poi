import { join } from 'path-extra'

export const ioWorker = new SharedWorker(join(__dirname, 'workers', 'io-worker.js'))
ioWorker.initialize = () => {
  ioWorker.port.start()
  window.addEventListener('unload', (e) => {
    ioWorker.port.postMessage(['Disconnect'])
  })
}
