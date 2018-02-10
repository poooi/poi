import path from 'path-extra'
import glob from 'glob'
import { forEach, set } from 'lodash'
import i18next from 'i18next'
import { reactI18nextModule } from 'react-i18next'

const locales = ['zh-CN', 'zh-TW', 'ja-JP', 'en-US', 'ko-KR']
const {ROOT} = window
const i18nResources = {}
const i18nFiles = glob.sync(path.join(ROOT, 'i18n', '*'))

forEach(locales, locale => {
  const translations = {}
  forEach(i18nFiles, i18nFile => {
    const namespace = path.basename(i18nFile)
    set(translations, namespace, require(path.join(i18nFile, `${locale}.json`)))
  })
  set(i18nResources, locale, translations)
})

i18next.use(reactI18nextModule)
  .init({
    fallbackLng: 'en-US',
    resources: i18nResources,
    ns: i18nFiles.map(i => path.basename(i)),
    defaultNS: 'main',
    interpolation: {
      escapeValue: false,
    },
    debug: false,
    react: {
      wait: false,
      nsMode: true,
    },
  })

// for test
window.isDevVersion && (window.i18next = i18next)

export default i18next
