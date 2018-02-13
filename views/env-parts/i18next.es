import path from 'path-extra'
import glob from 'glob'
import { forEach, set } from 'lodash'
import i18next from 'i18next'
import { reactI18nextModule } from 'react-i18next'

const locales = ['zh-CN', 'zh-TW', 'ja-JP', 'en-US', 'ko-KR']
const { ROOT } = window
const i18nResources = {}
const i18nFiles = glob.sync(path.join(ROOT, 'i18n', '*'))

// create options.resources in i18next init()
forEach(locales, locale => {
  const translations = {}
  forEach(i18nFiles, i18nFile => {
    const namespace = path.basename(i18nFile)
    set(translations, namespace, require(path.join(i18nFile, `${locale}.json`)))
  })
  set(i18nResources, locale, translations)
})

window.language = window.config.get('poi.language', navigator.language)
if (!locales.includes(window.language)) {
  switch (window.language.substr(0, 2).toLowerCase()) {
  case 'zh':
    window.language = 'zh-TW'
    break
  case 'ja':
    window.language = 'ja-JP'
    break
  case 'ko':
    window.language = 'ko-KR'
    break
  default:
    window.language = 'en-US'
  }
}

i18next.use(reactI18nextModule)
  .init({
    lng: window.language,
    fallbackLng: 'en-US',
    resources: i18nResources,
    ns: i18nFiles.map(i => path.basename(i)),
    defaultNS: 'main',
    interpolation: {
      escapeValue: false,
    },
    nsSeparator: false, // allow using : in key
    returnObjects: true, // allow returning objects
    debug: window.dbg && window.dbg.isEnabled(),
    react: {
      wait: false,
      nsMode: true,
    },
  })

// for test
if (window.dbg && window.dbg.isEnabled()) {
  window.i18next = i18next
}

export default i18next
