import { join } from 'path-extra'

export const avatarWorker = new SharedWorker(join(__dirname, 'workers', 'avatar-worker.js'))
avatarWorker.initialize = () => {
  avatarWorker.port.start()
  avatarWorker.port.postMessage([ 'Initialize', false, window.APPDATA_PATH ])
  window.addEventListener('unload', (e) => {
    avatarWorker.port.postMessage(['Disconnect'])
  })
}

export const ioWorker = new SharedWorker(join(__dirname, 'workers', 'io-worker.js'))
ioWorker.initialize = () => {
  ioWorker.port.start()
  window.addEventListener('unload', (e) => {
    ioWorker.port.postMessage(['Disconnect'])
  })
}
