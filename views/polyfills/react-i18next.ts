/**
 * FIXME: remove this polyfill when plugins begin to use react-i18next@>10
 */
/* eslint-disable import-x/namespace */
import * as ReactI18next from 'react-i18next'

// Mutating the module namespace to polyfill legacy react-i18next APIs for plugins.
// Object.defineProperty bypasses TypeScript's readonly namespace restriction at runtime.
const alias = (key: string, value: unknown) => {
  Object.defineProperty(ReactI18next, key, { value, writable: true, configurable: true })
}
alias('translate', ReactI18next.withTranslation)
alias('withNamespaces', ReactI18next.withTranslation)
alias('reactI18nextModule', ReactI18next.initReactI18next)
alias('NamespacesConsumer', ReactI18next.Translation)
alias('Interpolate', ReactI18next.Trans)
