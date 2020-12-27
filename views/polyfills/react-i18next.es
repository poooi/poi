/**
 * FIXME: remove this polyfill when plugins begin to use react-i18next@>10
 */
/* eslint-disable import/namespace */
import * as ReactI18next from 'react-i18next'

/* eslint-disable no-import-assign */
ReactI18next.translate = ReactI18next.withNamespaces = ReactI18next.withTranslation
ReactI18next.reactI18nextModule = ReactI18next.initReactI18next
ReactI18next.NamespacesConsumer = ReactI18next.Translation
ReactI18next.Interpolate = ReactI18next.Trans
/* eslint-enable no-import-assign */
