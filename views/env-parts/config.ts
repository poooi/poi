import type { ConfigInstance } from 'lib/config'

import * as remote from '@electron/remote'
export type { ConfigInstance, Config, ConfigPath } from 'lib/config'

export const config: ConfigInstance = remote.require('./lib/config')

declare global {
  interface Window {
    config: ConfigInstance
  }
  // eslint-disable-next-line no-var
  var config: ConfigInstance
}
window.config = config
