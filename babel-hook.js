// Synchronous replacement for @babel/register.
//
// @babel/register@8 compiles in a Node worker thread, but Electron renderer
// processes cannot create Node workers ("The V8 platform used by this instance
// of Node does not support creating Workers"), and poi installs the require
// hook in renderers too (views/env.ts, assets/js/plugin-preload.js). This hook
// does the same job in-process: pirates + @babel/core transformSync, with
// source-map-support wired up for readable stack traces.
//
// Accepts the options object from babel-register.config.js.
const sourceMapSupport = require('@cspotcode/source-map-support')
const { addHook } = require('pirates')

const sourceMaps = new Map()
let installed = false

module.exports = ({ configFile, babelrc, extensions, only }) => {
  if (installed) return
  installed = true

  const { transformSync } = require('@babel/core')

  sourceMapSupport.install({
    handleUncaughtExceptions: false,
    environment: 'node',
    retrieveSourceMap: (source) =>
      sourceMaps.has(source) ? { url: null, map: sourceMaps.get(source) } : null,
  })

  addHook(
    (code, filename) => {
      const result = transformSync(code, {
        filename,
        configFile,
        babelrc,
        sourceMaps: 'both',
        caller: {
          name: 'poi-babel-hook',
          // poi keeps import() native so ESM-only packages stay loadable
          // (see the transform-dynamic-import handling in babel.config.js).
          supportsDynamicImport: true,
          supportsStaticESM: false,
          supportsExportNamespaceFrom: false,
          supportsTopLevelAwait: false,
        },
      })
      if (!result) return code
      if (result.map) sourceMaps.set(filename, result.map)
      return result.code
    },
    {
      exts: extensions,
      // Third-party plugins live in a node_modules directory outside poi's
      // root (ignore: [] in the old @babel/register options), so node_modules
      // must not be excluded here.
      ignoreNodeModules: false,
      matcher: (filename) => only.some((re) => re.test(filename)),
    },
  )
}
