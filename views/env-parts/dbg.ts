import type { DbgInstance } from 'lib/debug'

export const dbg: DbgInstance = window.isMain ? require('lib/debug') : undefined

window.dbg = dbg
