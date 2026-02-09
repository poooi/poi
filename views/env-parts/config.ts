import type { ConfigInstance } from 'lib/config'

import * as remote from '@electron/remote'
export type { ConfigInstance, Config } from 'lib/config'

export const config: ConfigInstance = remote.require('./lib/config')

window.config = config
