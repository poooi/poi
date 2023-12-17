import type { DbgInstance } from 'lib/debug'

export const dbg: DbgInstance = window.isMain ? require('lib/debug') : undefined

// @ts-expect-error backward compatibility
window.dbg = dbg
