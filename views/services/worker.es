import { join } from 'path-extra'

export const avatarWorker = new Worker(join(__dirname, 'workers', 'avatar-worker.js'))

avatarWorker.postMessage(['Initialize', window.APPDATA_PATH])
