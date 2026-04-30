import type { DbgInstance } from 'lib/debug'

import { isMain } from './const'

export const dbg: DbgInstance = isMain ? require('lib/debug') : undefined

window.dbg = dbg
