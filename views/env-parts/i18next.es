import path from 'path-extra'
import glob from 'glob'
import { readJson } from 'fs-extra'
import _, { isString, toString, each } from 'lodash'
import i18next from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import { spacing as _spacing } from 'pangu'
import { format } from 'util'

const locales = ['zh-CN', 'zh-TW', 'ja-JP', 'en-US', 'ko-KR']
const { ROOT, isMain, config } = window

const i18nFiles = glob.sync(path.join(ROOT, 'i18n', '*'))

const ensureString = str => isString(str) ? str : toString(str)

const escapeDot = str => ensureString(str)
  .replace(/\.\W/g, '')
  .replace(/\.$/, '')

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
    resources: {},
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

i18next.readResources = async (language, namespace, filePath) => {
  try {
    let data = await readJson(filePath)
    data = _(data)
      .entries()
      .map(([key, v]) => [escapeDot(key), v])
      .fromPairs()
      .value()

    i18next.addResources(language, namespace, data)
  } catch (e) {
    console.error('No translation found: ', language, namespace, filePath)
  }
}

each(locales, locale => {
  each(i18nFiles, i18nFile => {
    const namespace = path.basename(i18nFile)
    i18next.readResources(locale, namespace, path.join(i18nFile, `${locale}.json`))
  })
})

// for test
if (window.dbg && window.dbg.isEnabled()) {
  window.i18next = i18next
}

const textSpacingCJK = config.get('poi.textSpacingCJK', true)

const spacing = textSpacingCJK ? (str => isString(str) ? _spacing(str) : toString(str)) : toString

window.i18n = {}

if (window.isMain) {
  each(i18next.options.ns, (ns) => {
    window.i18n[ns] = {
      fixedT: i18next.getFixedT(window.language, ns),
    }

    window.i18n[ns].__ = (str, ...args) => format(window.i18n[ns].fixedT(escapeDot(str)), ...args)
    window.i18n[ns].__n = (str, ...args) => format(window.i18n[ns].fixedT(escapeDot(str)), ...args)
  })
}

window.i18n.resources = {
  __: (str) => spacing(str),
  translate: (locale, str) => spacing(str),
  setLocale: (str) => (str),
}

// inject translator for English names
if (!isMain && config.get('plugin.poi-plugin-translator.enable', false)) {
  try {
    require('poi-plugin-translator').pluginDidLoad()
  } catch (e) {
    console.warn('poi-plugin-translator', e)
  }
}

export default i18next
