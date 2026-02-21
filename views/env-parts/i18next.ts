import type { TFunction } from 'i18next'

import { readJSONSync, writeFileSync } from 'fs-extra'
import glob from 'glob'
import { createInstance } from 'i18next'
import { toString, each, debounce } from 'lodash'
/* global ROOT */
import path from 'path'
import { initReactI18next } from 'react-i18next'
import { format } from 'util'
import { readI18nResources, escapeI18nKey, cjkSpacing } from 'views/utils/tools'

import { config } from './config'
import { dbg } from './dbg'

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

type I18nResources = Record<string, Record<string, object>>

const textSpacingCJK = config.get('poi.appearance.textspacingcjk', true)

const spacing = textSpacingCJK ? cjkSpacing : toString

const i18nFiles = glob.sync(path.join(ROOT, 'i18n', '*'))

const mainPoiNs = i18nFiles.map((i) => path.basename(i))
const mainPoiRes: I18nResources = {}
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

// @ts-expect-error backward compatibility
window.LOCALES = LOCALES

const normalizeLanguage = (language: string) => {
  if (!LOCALES.map((lng) => lng.locale).includes(language)) {
    switch (language.slice(0, 2).toLowerCase()) {
      case 'zh':
        return 'zh-TW'
      case 'ja':
        return 'ja-JP'
      case 'ko':
        return 'ko-KR'
      default:
        return 'en-US'
    }
  }
  return language
}

// @ts-expect-error backward compatibility
const language = (window.language = normalizeLanguage(
  config.get('poi.misc.language', navigator.language),
))

const i18next = createInstance()

i18next.use(initReactI18next).init({
  lng: language,
  fallbackLng: false,
  resources: mainPoiRes,
  ns: mainPoiNs,
  defaultNS: 'others',
  interpolation: {
    escapeValue: false,
  },
  nsSeparator: ':',
  returnObjects: true, // allow returning objects
  debug: dbg?.extra('i18next')?.isEnabled(),
  react: {
    useSuspense: true,
    nsMode: 'fallback',
  },
  saveMissing: dbg && dbg?.extra('i18next-save-missing')?.isEnabled(),
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
        writeFileSync(p, JSON.stringify(cnt, undefined, 2) + '\n')
      } catch (_e) {
        return
      }
    }
  },
})

// for test
if (dbg?.isEnabled()) {
  // @ts-expect-error backward compatibility
  window.i18next = i18next
}

export interface FallbackInstance {
  fixedT: TFunction
  __: TFunction
  __n: TFunction
  setLocale: (locale: string) => void
}

// FIXME: simulating window.i18n with i18next
// to be removed in next major release
// @ts-expect-error backward compatibility
const i18nHack = (window.i18n = {} as Record<string, FallbackInstance>)

// export addGlobalI18n for plugin manager usage
export const addGlobalI18n = (namespace: string) => {
  const fixedT = i18next.getFixedT(language, namespace)
  const __: TFunction = (str, ...args) =>
    format(i18nHack[namespace].fixedT(escapeI18nKey(str)), ...args)
  const __n: TFunction = (str, ...args) =>
    format(i18nHack[namespace].fixedT(escapeI18nKey(str)), ...args)
  i18nHack[namespace] = {
    fixedT,
    __,
    __n,
    setLocale: () => undefined,
  }
}

if (window.isMain) {
  each(mainPoiNs, (ns) => addGlobalI18n(ns))
}

export const emitResourceAddedDebounce = debounce(() => {
  // @ts-expect-error simulate added event
  i18next.store.emit('added', 'zh-CN', 'others', {})
}, 500)

export const addResourceBundleDebounce: typeof i18next.addResourceBundle = (...props) => {
  const response = i18next.addResourceBundle(...props)
  emitResourceAddedDebounce()
  return response
}

// @ts-expect-error backward compatibility
window.i18n.resources = {
  __: (str: string) => spacing(str),
  translate: (locale: string, str: string) => spacing(str),
  setLocale: (str: string) => str,
}

// inject translator for English names
if (!isMain && config.get('plugin.poi-plugin-translator.enable', false)) {
  try {
    // TODO: handle type definition
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('poi-plugin-translator').pluginDidLoad()
  } catch (e) {
    console.warn('poi-plugin-translator', e)
  }
}

export default i18next
