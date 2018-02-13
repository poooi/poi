import { spacing as _spacing } from 'pangu'
import { isString, toString, each } from 'lodash'
import i18next from './i18next'
import { format } from 'util'

const { isMain, config } = window

const textSpacingCJK = config.get('poi.textSpacingCJK', true)

const spacing = textSpacingCJK ? (str => isString(str) ? _spacing(str) : toString(str)) : toString

window.i18n = {}

if (window.isMain) {
  each(i18next.options.ns, (ns) => {
    window.i18n[ns] = {
      fixedT: i18next.getFixedT(window.language, ns),
    }

    window.i18n[ns].__ = (str, ...args) => format(window.i18n[ns].fixedT(str), ...args)
    window.i18n[ns].__n = (str, ...args) => format(window.i18n[ns].fixedT(str), ...args)
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
