import path from 'path-extra'
import glob from 'glob'

const {ROOT} = window

window.language = navigator.language
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
const i18nFiles = glob.sync(path.join(ROOT, 'i18n', '*'))
for (const i18nFile of i18nFiles) {
  const namespace = path.basename(i18nFile)
  window.i18n[namespace] = new (require('i18n-2'))({
    locales: ['ko-KR', 'en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
    defaultLocale: 'zh-CN',
    directory: i18nFile,
    updateFiles: false,
    indent: "\t",
    extension: '.json',
    devMode: false,
  })
  window.i18n[namespace].setLocale(window.language)
}
window.i18n.resources = {
  __: (str) => (str),
  translate: (locale, str) => (str),
  setLocale: (str) => (str),
}
