// Global declarations for the renderer environment set up by env-parts.
// These live in a .d.ts (not in the modules that assign them) because Babel's
// TypeScript scope checking rejects a `declare global` var alongside a
// same-named module-level binding, which tsc accepts.
import type { ConfigInstance } from 'lib/config'

declare global {
  interface Window {
    /** @deprecated Use `import { config } from 'views/env'` instead */
    config: ConfigInstance
    /** @deprecated Use `config.get('poi.misc.language')` instead */
    language?: string
  }

  /** @deprecated Use `import { config } from 'views/env'` instead */
  var config: ConfigInstance
  /** @deprecated Use `config.get('poi.misc.language')` instead */
  var language: string
}

export {}
