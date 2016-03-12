path = require 'path-extra'

checkLayout = (layout) ->
  if layout isnt 'horizontal' and layout isnt 'vertical' and layout isnt 'L'
    layout = 'horizontal'
    config.set 'poi.layout', layout
  layout

language = navigator.language
if !(language in ['zh-CN', 'zh-TW', 'ja-JP', 'en-US'])
  switch language.substr(0,1).toLowerCase()
    when 'zh'
      language = 'zh-TW'
    when 'ja'
      language = 'ja-JP'
    else
      language = 'en-US'
window.layout = checkLayout(config.get 'poi.layout', 'horizontal')
window.doubleTabbed = config.get 'poi.tabarea.double', false
window.webviewWidth = config.get 'poi.webview.width', -1
window.webviewFactor = 1
window.language = config.get 'poi.language', language
window.zoomLevel = config.get 'poi.zoomLevel', 1
window.useSVGIcon = config.get 'poi.useSVGIcon', false
d = if process.platform == 'darwin' then path.join(path.homedir(), 'Pictures', 'Poi') else path.join(global.APPDATA_PATH, 'screenshots')
window.screenshotPath = config.get 'poi.screenshotPath', d
window.notify.morale = config.get 'poi.notify.morale.value', 49
window.notify.expedition = config.get 'poi.notify.expedition.value', 60
