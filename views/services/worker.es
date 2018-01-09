import { join } from 'path-extra'

export const avatarWorker = new SharedWorker(join(__dirname, 'workers', 'avatar-worker.js'))
avatarWorker.port.start()
avatarWorker.port.postMessage([ 'Initialize', window.APPDATA_PATH ])
window.addEventListener('unload', (e) => {
  avatarWorker.port.postMessage(['Disconnect'])
})
