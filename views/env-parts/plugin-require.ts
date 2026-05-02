import * as BluePrintNS from '@blueprintjs/core'
import * as BluePrintDateTimeNS from '@blueprintjs/datetime'
import * as BluePrintPopoverNS from '@blueprintjs/popover2'
import * as BluePrintSelectNS from '@blueprintjs/select'
import * as i18nextModuleNS from 'i18next'
import * as lodash from 'lodash-es'
import { Module, createRequire } from 'module'
import { join, dirname, sep } from 'path'
import React from 'react'
import * as ReactNS from 'react'
import * as ReactBootstrapNS from 'react-bootstrap'
import * as ReactDOMNS from 'react-dom'
import * as ReactDOMClientNS from 'react-dom/client'
import * as ReactFontAwesomeNS from 'react-fontawesome'
import * as ReactI18nextNS from 'react-i18next'
import * as ReactReduxNS from 'react-redux'
import * as ReactJsxRuntimeNS from 'react/jsx-runtime'
import * as ReduxNS from 'redux'
import * as StyledComponentsNS from 'styled-components'
import * as overlayNS from 'views/components/etc/overlay'
import * as createStoreNS from 'views/create-store'
import { ROOT } from 'views/env'
import * as envNS from 'views/env'
// Import poi's initialized i18next instance — the global i18next ESM instance
// (i18nextModuleNS.default) is never init()-ed; plugins must get poi's instance.
import poiI18nInstance, * as poiI18nNS from 'views/env-parts/i18next'
import * as reduxCreateStoreNS from 'views/redux/create-store'
import * as gameUtilsNS from 'views/utils/game-utils'

// .es files are Babel-compiled CJS bundles; register the extension so require() can load them.
// @ts-expect-error HACK the module extension hook
const moduleExts = Module._extensions
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
moduleExts['.es'] ??= moduleExts['.js']

// Use CJS require for plugins so .es extension handling works (ESM loader rejects .es).
// createRequire needs a URL or absolute path as the "requiring file" context.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const pluginRequire = createRequire(join(ROOT, 'package.json'))

// ─── ESM→CJS bridge ──────────────────────────────────────────────────────────
// Plugins load poi source files via CJS require() + @babel/register/pirates.
// Those files are already running inside the ESM bundle; a second CJS load
// re-executes side effects (window assignments, store init, etc.) and crashes.
// Solution: hook Module._extensions['.ts'] for files under ROOT so the hook
// returns the already-running ESM instance instead of re-executing the file.
const esmRegistry = new Map<string, Record<string, unknown>>()

function registerPoiModule(relPath: string, esmExports: object) {
  try {
    const absPath = pluginRequire.resolve(relPath)
    esmRegistry.set(absPath, { ...esmExports, __esModule: true })
  } catch {
    /* ignore if path not resolvable via CJS */
  }
}

function installPoiBridge(ext: string) {
  // @ts-expect-error HACK the module extension hook
  const orig = Module._extensions[ext]
  if (!orig) return
  // @ts-expect-error HACK the module extension hook
  Module._extensions[ext] = (mod: { exports: unknown }, filename: string) => {
    if (filename.startsWith(ROOT + sep)) {
      const bridged = esmRegistry.get(filename)
      if (bridged !== undefined) {
        mod.exports = bridged
        return
      }
    }
    orig(mod, filename)
  }
}
installPoiBridge('.ts')
installPoiBridge('.tsx')

// Register poi modules with window-level side effects or singleton exports.
// Each registered module is returned as-is to CJS callers, preventing its
// transitive deps (getter.ts, i18next.ts, etc.) from being re-executed.
// Add more entries here as plugins reveal further double-load issues.
registerPoiModule('./views/env-parts/i18next', poiI18nNS)
registerPoiModule('./views/env', envNS)
registerPoiModule('./views/create-store', createStoreNS)
registerPoiModule('./views/redux/create-store', reduxCreateStoreNS)
registerPoiModule('./views/components/etc/overlay', overlayNS)
registerPoiModule('./views/utils/game-utils', gameUtilsNS)

// Populate require.cache with the bundled ESM copies of React and friends so
// plugins that call require('react') share the same instance as the bundle.
// Two React instances cause hook dispatcher errors ('Cannot read properties of
// null (reading "useState")'). The .ts/.tsx hook above doesn't cover .js files,
// so we must write directly into the CJS module cache.
function registerNativeModule(packageName: string, esmExports: object) {
  try {
    const absPath = pluginRequire.resolve(packageName)
    // Always overwrite — even if a polyfill already required this package via
    // CJS before this bridge ran, we want subsequent requires from plugins to
    // get the bundled ESM instance.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = new Module(absPath)
    mod.filename = absPath
    mod.exports = { ...esmExports, __esModule: true }
    mod.loaded = true
    pluginRequire.cache[absPath] = mod
  } catch {
    /* package not found or resolve failed */
  }
}

registerNativeModule('react', ReactNS)
registerNativeModule('react-dom', ReactDOMNS)
registerNativeModule('react-dom/client', ReactDOMClientNS)
registerNativeModule('react/jsx-runtime', ReactJsxRuntimeNS)
registerNativeModule('react-redux', ReactReduxNS)
registerNativeModule('redux', ReduxNS)
registerNativeModule('styled-components', StyledComponentsNS)
registerNativeModule('@blueprintjs/core', BluePrintNS)
registerNativeModule('@blueprintjs/datetime', BluePrintDateTimeNS)
registerNativeModule('@blueprintjs/popover2', BluePrintPopoverNS)
registerNativeModule('@blueprintjs/select', BluePrintSelectNS)
registerNativeModule('lodash', lodash)
// Override default with poi's initialized instance so require('i18next').default
// returns the configured instance, not the uninitiated global ESM instance.
// i18next only assigns createInstance to the global singleton (dist/esm ~line 2788),
// not to sub-instances created via createInstance(). Assign it here so plugins
// calling require('i18next').default.createInstance() still work.
poiI18nInstance.createInstance = i18nextModuleNS.createInstance
registerNativeModule('i18next', { ...i18nextModuleNS, default: poiI18nInstance })
registerNativeModule('react-i18next', ReactI18nextNS)
registerNativeModule('react-bootstrap', ReactBootstrapNS)
registerNativeModule('@skagami/react-fontawesome', ReactFontAwesomeNS)

// Patch CJS React's dispatcher to proxy to the bundled React's dispatcher.
// cjs-bootstrap.js loads the react-i18next polyfill BEFORE renderer.mjs, which
// causes react-i18next to load CJS React and close over its `useContext` etc.
// registerNativeModule above replaced react/index.js in the cache, but the
// existing closure in react-i18next still holds a reference to the old CJS
// react.production.min.js exports. Proxying its ReactCurrentDispatcher.current
// ensures those closures route to the bundled renderer's dispatcher at call time.
try {
  const reactPkgDir = dirname(pluginRequire.resolve('react'))
  // Try both builds — esbuild constant-folds process.env.NODE_ENV at bundle time
  // so we cannot use it here. Check whichever file is actually in the require cache.
  const cjsMinFile = pluginRequire.cache[join(reactPkgDir, 'cjs', 'react.production.min.js')]
    ? join(reactPkgDir, 'cjs', 'react.production.min.js')
    : join(reactPkgDir, 'cjs', 'react.development.js')
  const cjsReactMod = pluginRequire.cache[cjsMinFile]
  if (cjsReactMod) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const cjsDisp =
      cjsReactMod.exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const bundledDisp =
      // @ts-expect-error HACK the dispatcher
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher
    if (cjsDisp && bundledDisp && cjsDisp !== bundledDisp) {
      Object.defineProperty(cjsDisp, 'current', {
        get: () => bundledDisp['current'],
        set: (v: unknown) => {
          bundledDisp['current'] = v
        },
        configurable: true,
      })
    }
  }
} catch {
  /* ignore */
}

// // Replace the CJS react-i18next (loaded by cjs-bootstrap polyfill) with the
// // bundled version so plugins get the correct context identity. Also replicate
// // the polyfill's legacy API aliases so old plugins find translate() etc.
try {
  const absPath = pluginRequire.resolve('react-i18next')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = new Module(absPath)
  mod.filename = absPath
  mod.exports = {
    ...(ReactI18nextNS as Record<string, unknown>),
    __esModule: true,
    // Legacy react-i18next v9 API aliases expected by older plugins:
    translate: ReactI18nextNS.withTranslation,
    withNamespaces: ReactI18nextNS.withTranslation,
    reactI18nextModule: ReactI18nextNS.initReactI18next,
    NamespacesConsumer: ReactI18nextNS.Translation,
    Interpolate: ReactI18nextNS.Trans,
  }
  mod.loaded = true
  pluginRequire.cache[absPath] = mod
} catch {
  /* ignore */
}
