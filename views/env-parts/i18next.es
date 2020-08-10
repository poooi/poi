/* global config, ROOT, isMain, dbg */
import path from 'path-extra'
import glob from 'glob'
import { toString, each, debounce } from 'lodash'
import I18next from 'i18next'
import { reactI18nextModule } from 'react-i18next'
import { format } from 'util'
import formatJson from 'json-format'
import { readJSONSync, writeFileSync } from 'fs-extra'

import { readI18nResources, escapeI18nKey, cjkSpacing } from 'views/utils/tools'

const LOCALES = [
  {
    locale: 'zh-CN',
    lng: '简体中文',
  },
  {
    locale: 'zh-TW',
    lng: '正體中文',
  },
  {
    locale: 'ja-JP',
    lng: '日本語',
  },
  {
    locale: 'en-US',
    lng: 'English',
  },
  {
    locale: 'ko-KR',
    lng: '한국어',
  },
]

const textSpacingCJK = window.config.get('poi.appearance.textspacingcjk', true)

const spacing = textSpacingCJK ? cjkSpacing : toString

const i18nFiles = glob.sync(path.join(ROOT, 'i18n', '*'))

const mainPoiNs = i18nFiles.map((i) => path.basename(i))
const mainPoiRes = {}
each(
  LOCALES.map((lng) => lng.locale),
  (locale) => {
    mainPoiRes[locale] = {}
    each(i18nFiles, (i18nFile) => {
      const namespace = path.basename(i18nFile)
      mainPoiRes[locale][namespace] = readI18nResources(path.join(i18nFile, `${locale}.json`))
    })
  },
)

window.LOCALES = LOCALES
window.language = window.config.get('poi.misc.language', navigator.language)
if (!LOCALES.map((lng) => lng.locale).includes(window.language)) {
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

const i18next = I18next.createInstance()

i18next.use(reactI18nextModule).init({
  lng: window.language,
  fallbackLng: false,
  resources: mainPoiRes,
  ns: mainPoiNs,
  defaultNS: 'others',
  interpolation: {
    escapeValue: false,
  },
  returnObjects: true, // allow returning objects
  debug: dbg && dbg.extra('i18next').isEnabled(),
  react: {
    wait: false,
    nsMode: 'fallback',
    usePureComponent: true,
  },
  saveMissing: dbg && dbg.extra('i18next-save-missing').isEnabled(),
  missingKeyHandler: function (lng, ns, key, fallbackValue) {
    if (!ns || ns == '') {
      ns = 'others'
    }
    if (ns !== 'data' && i18nFiles.map((i) => path.basename(i)).includes(ns)) {
      try {
        const p = path.join(ROOT, 'i18n', ns, `${lng}.json`)
        const cnt = readJSONSync(p)
        let val = fallbackValue
        if (val.startsWith(ns)) {
          val = val.split(/:(.+)/)[1]
        }
        cnt[key] = val
        writeFileSync(
          p,
          formatJson(cnt, {
            type: 'space',
            size: 2,
          }) + '\n',
        )
      } catch (e) {
        return
      }
    }
  },
})

// for test
if (window.dbg && window.dbg.isEnabled()) {
  window.i18next = i18next
}

// FIXME: simulating window.i18n with i18next
// to be removed in next major release
window.i18n = {}
const addGlobalI18n = (namespace) => {
  window.i18n[namespace] = {
    fixedT: i18next.getFixedT(window.language, namespace),
  }

  window.i18n[namespace].__ = (str, ...args) =>
    format(window.i18n[namespace].fixedT(escapeI18nKey(str)), ...args)
  window.i18n[namespace].__n = (str, ...args) =>
    format(window.i18n[namespace].fixedT(escapeI18nKey(str)), ...args)
  window.i18n[namespace].setLocale = () => {}
}

if (window.isMain) {
  each(mainPoiNs, (ns) => addGlobalI18n(ns))
}

// export addGlobalI18n for plugin manager usage
i18next.addGlobalI18n = addGlobalI18n

i18next.emitResourceAddedDebounce = debounce(() => {
  // simulate added event
  i18next.store.emit('added', 'zh-CN', 'others', {})
}, 500)

i18next.addResourceBundleDebounce = (...props) => {
  i18next.addResourceBundle(...props, { silent: true })
  i18next.emitResourceAddedDebounce()
}

window.i18n.resources = {
  __: (str) => spacing(str),
  translate: (locale, str) => spacing(str),
  setLocale: (str) => str,
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
