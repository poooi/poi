// Type declaration for babel.config.js so TypeScript importers
// (build/compile-to-js.ts) get typed options without allowJs.
import type { InputOptions } from '@babel/core'

declare const config: InputOptions
export = config
