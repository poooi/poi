import { writeFile } from 'fs-extra'

/*
 * ioWorker is deprecated. this is a dummy worker for backward compatibility
 */

export const ioWorker = {
  initialize: () => null,
  port: {
    postMessage: ([type, path, data]) => {
      writeFile(path, JSON.stringify(data))
    },
  },
}
