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

const _react = require('react')
const autoSizer = require('react-virtualized-auto-sizer')

if (!autoSizer.__esModule && autoSizer.AutoSizer && !autoSizer.default) {
  const OriginalAutoSizer = autoSizer.AutoSizer

  // v1 compat: if children is a function, map it to v2's renderProp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AutoSizerCompat = function AutoSizerCompat({ children, ...props }: any) {
    if (typeof children === 'function' && !('renderProp' in props)) {
      return _react.createElement(OriginalAutoSizer, { ...props, renderProp: children })
    }
    return _react.createElement(OriginalAutoSizer, props, children)
  }

  autoSizer.default = AutoSizerCompat
  Object.defineProperty(autoSizer, '__esModule', { value: true })
}
