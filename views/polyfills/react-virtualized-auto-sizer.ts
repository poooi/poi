/**
 * react-virtualized-auto-sizer v2 removed the CJS default export and the v1
 * children render-prop API (children fn → renderProp fn). Old plugins that do
 * `import AutoSizer from '...'` and use `<AutoSizer>{({width,height}) => …}</AutoSizer>`
 * break in two ways:
 *   1. No `.default` on the module object → babel interop gives the whole object as default
 *   2. v2 ignores the `children` prop; needs `renderProp` prop instead
 * Patch the cached module to expose a `.default` compat wrapper that bridges both issues.
 */
export {}
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const _react = require('react')
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const autoSizer = require('react-virtualized-auto-sizer')

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (!autoSizer.__esModule && autoSizer.AutoSizer && !autoSizer.default) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const OriginalAutoSizer = autoSizer.AutoSizer

  // v1 compat: if children is a function, map it to v2's renderProp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AutoSizerCompat = function AutoSizerCompat({ children, ...props }: any) {
    if (typeof children === 'function' && !('renderProp' in props)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return _react.createElement(OriginalAutoSizer, { ...props, renderProp: children })
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return _react.createElement(OriginalAutoSizer, props, children)
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  autoSizer.default = AutoSizerCompat
  Object.defineProperty(autoSizer, '__esModule', { value: true })
}
