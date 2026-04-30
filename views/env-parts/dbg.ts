import type { DbgInstance } from 'lib/debug'

import { isMain } from './const'

export const dbg: DbgInstance = isMain ? require('../../lib/debug') : undefined

declare global {
  interface Window {
    // @deprecated use `dbg` from `views/env` insteads
    dbg?: DbgInstance
  }
}

window.dbg = dbg
