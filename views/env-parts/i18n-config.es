import path from 'path-extra'
import glob from 'glob'
import { spacing } from 'pangu'

const {ROOT, isMain, config} = window

window.language = window.config.get('poi.language', navigator.language)
if (!['zh-CN', 'zh-TW', 'ja-JP', 'en-US', 'ko-KR'].includes(window.language)) {
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

window.i18n = {}

// Add translation file only on main window
if (window.isMain) {
  const i18nFiles = glob.sync(path.join(ROOT, 'i18n', '*'))
  for (const i18nFile of i18nFiles) {
    const namespace = path.basename(i18nFile)
    window.i18n[namespace] = new (require('i18n-2'))({
      locales: ['zh-CN', 'zh-TW', 'ja-JP', 'en-US', 'ko-KR'],
      defaultLocale: 'en-US',
      directory: i18nFile,
      updateFiles: false,
      indent: "\t",
      extension: '.json',
      devMode: false,
    })
    window.i18n[namespace].setLocale(window.language)
  }
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
