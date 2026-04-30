import type { ConfigInstance } from 'lib/config'

import * as remote from '@electron/remote'
export type { ConfigInstance, Config, ConfigPath } from 'lib/config'

export const config: ConfigInstance = remote.require('./lib/config')

declare global {
  interface Window {
    /** @deprecated Use `import { config } from 'views/env-parts/config'` instead */
    config: ConfigInstance
  }
  // eslint-disable-next-line no-var
  /** @deprecated Use `import { config } from 'views/env-parts/config'` instead */
  var config: ConfigInstance
}
/** @deprecated Use `import { config } from 'views/env-parts/config'` instead */
window.config = config
