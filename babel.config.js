// babel-plugin-styled-components has no Babel 8 release yet: it is functionally
// compatible but hard-rejects via api.assertVersion(7). Bypass just the version
// check; its @babel/core peer dependency is aligned through "overrides" in
// package.json. Drop this shim once upstream publishes Babel 8 support:
// https://github.com/styled-components/babel-plugin-styled-components
const styledComponentsBabel8Shim = (api, options, dirname) => {
  const compatApi = Object.create(api, { assertVersion: { value: () => {} } })
  const plugin = require('babel-plugin-styled-components')
  const instance = (plugin.default || plugin)(compatApi, options, dirname)
  // Drop `inherits: syntax-jsx`: it would enable JSX parsing for every file,
  // making TypeScript generic arrows in plain .ts ambiguous. Files that may
  // contain JSX already get the parser plugin from preset-react (see overrides).
  return { ...instance, inherits: undefined }
}

module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          electron: '43',
        },
        // poi loads everything through CommonJS (@babel/register hooks require,
        // the release build ships CJS). Babel 8 stopped defaulting to the
        // CommonJS transform when the caller doesn't declare ESM support
        // (e.g. build/compile-to-js.ts), so request it explicitly.
        modules: 'commonjs',
        exclude: ['transform-dynamic-import'],
      },
    ],
    [
      require.resolve('@babel/preset-typescript'),
      {
        // Restore Babel 7's import elision: Babel 8 keeps a side-effect
        // require() for imports that are only used as types, which breaks
        // third-party plugins importing types from specifiers that only
        // resolve for tsc (e.g. `import { PluginState } from 'reducers'`
        // resolved via the plugin's own tsconfig paths).
        onlyRemoveTypeImports: false,
      },
    ],
  ],
  // Equivalent of preset-env's `loose: true`, which is removed in Babel 8.
  // https://babeljs.io/docs/assumptions#migrating-from-babelpreset-envs-loose-and-spec-modes
  assumptions: {
    arrayLikeIsIterable: true,
    constantReexports: true,
    enumerableModuleMeta: true,
    ignoreFunctionLength: true,
    ignoreToPrimitiveHint: true,
    mutableTemplateObject: true,
    noClassCalls: true,
    noDocumentAll: true,
    objectRestNoSymbols: true,
    privateFieldsAsProperties: true,
    pureGetters: true,
    setClassMethods: true,
    setComputedProperties: true,
    setPublicClassFields: true,
    setSpreadProperties: true,
    skipForOfIteratorClosing: true,
    superIsCallableConstructor: true,
  },
  plugins: [
    styledComponentsBabel8Shim,
    // Babel 8 requires an explicit `version`; `legacy: true` is no longer accepted.
    [require.resolve('@babel/plugin-proposal-decorators'), { version: 'legacy' }],
  ].concat(
    [
      '@babel/plugin-proposal-do-expressions',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-function-bind',
      '@babel/plugin-proposal-function-sent',
      '@babel/plugin-proposal-throw-expressions',
      'babel-plugin-add-module-exports',
    ].map((plugin) => require.resolve(plugin)),
  ),
  overrides: [
    {
      // Keep JSX parsing away from plain .ts files: with it enabled, TypeScript
      // generic arrows like `<T>(x: T) => x` are ambiguous and fail to parse.
      // Babel 7's preset-typescript removed the JSX parser plugin for .ts
      // automatically; Babel 8 no longer does, so scope preset-react instead.
      // The runtime is pinned to 'classic' because Babel 8 flips the default to
      // 'automatic', which needs react/jsx-runtime resolvable from third-party
      // plugin directories (unverified).
      exclude: /\.ts$/,
      presets: [[require.resolve('@babel/preset-react'), { runtime: 'classic' }]],
    },
    {
      // Plugin files live outside poi's root directory. They need import() transformed
      // to require() so bare specifiers resolve through @babel/register's path patches.
      test: (filename) => {
        if (!filename) return false
        const path = require('path')
        const root = __dirname + path.sep
        return !filename.startsWith(root) && filename !== __dirname
      },
      plugins: [require.resolve('@babel/plugin-transform-dynamic-import')],
    },
  ],
  ignore: [],
  // .es stays in the non-Jest matcher: poi's own sources are all .ts/.tsx now,
  // but third-party plugins loaded through babel-hook may still ship .es files.
  only: process.env.JEST_WORKER_ID ? [/\.(js|ts|tsx)$/] : [/\.(es|ts|tsx)$/],
  babelrc: false,
}
