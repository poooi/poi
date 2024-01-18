import * as remote from '@electron/remote'
import type { ConfigInstance } from 'lib/config'
export type { ConfigInstance, Config } from 'lib/config'

export const config: ConfigInstance = remote.require('./lib/config')

// @ts-expect-error backward compatibility
window.config = config
