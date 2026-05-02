import type { DbgInstance } from 'lib/debug'

import { isMain } from './const'

function loadDbg(): DbgInstance | undefined {
  if (!isMain) return undefined
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod: { default: DbgInstance } = require('../../lib/debug')
  return mod.default
}

export const dbg = loadDbg()

declare global {
  interface Window {
    // @deprecated use `dbg` from `views/env` insteads
    dbg?: DbgInstance
  }
}

window.dbg = dbg
