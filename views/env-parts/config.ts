import type { ConfigInstance } from 'lib/config'

import * as remote from '@electron/remote'
export type { ConfigInstance, Config, ConfigPath, ConfigValue } from 'lib/config'

export const config: ConfigInstance = remote.require('./lib/config')

/** @deprecated Use `import { config } from 'views/env'` instead */
window.config = config
