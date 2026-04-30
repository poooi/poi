import type { ConfigInstance } from 'lib/config'

import * as remote from '@electron/remote'
export type { ConfigInstance, Config, ConfigPath, ConfigValue } from 'lib/config'

export const config: ConfigInstance = remote.require('./lib/config')

declare global {
  interface Window {
    /** @deprecated Use `import { config } from 'views/env'` instead */
    config: ConfigInstance
  }
  // eslint-disable-next-line no-var
  /** @deprecated Use `import { config } from 'views/env'` instead */
  var config: ConfigInstance
}
/** @deprecated Use `import { config } from 'views/env'` instead */
window.config = config
