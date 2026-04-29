import { writeFile } from 'fs-extra'

/*
 * ioWorker is deprecated. this is a dummy worker for backward compatibility
 */

export const ioWorker = {
  initialize: () => null,
  port: {
    postMessage: ([_type, path, data]: [unknown, string, unknown]) => {
      writeFile(path, JSON.stringify(data))
    },
  },
}
