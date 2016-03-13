path = require 'path-extra'
glob = require 'glob'

window.i18n = {}
i18nFiles = glob.sync(path.join(ROOT, 'i18n', '*'))
for i18nFile in i18nFiles
  namespace = path.basename i18nFile
  window.i18n[namespace] = new (require 'i18n-2')
    locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
    defaultLocale: 'zh-CN',
    directory: i18nFile,
    updateFiles: false,
    indent: "\t",
    extension: '.json'
    devMode: false
  window.i18n[namespace].setLocale(window.language)
window.i18n.resources = {}
window.i18n.resources.__ = (str) -> return str
window.i18n.resources.translate = (locale, str) -> return str
window.i18n.resources.setLocale = (str) -> return
