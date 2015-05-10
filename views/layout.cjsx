{ROOT, jQuery, remote, $, $$, React, ReactBootstrap} = window

# Custom theme
config = remote.require './lib/config'
if theme = config.get 'poi.theme'
  $('#bootstrap-css').setAttribute 'href', "./assets/themes/#{theme}/css/#{theme}.css"
window.addEventListener 'theme.change', (e) ->
  theme = e.detail.theme
  $('#bootstrap-css').setAttribute 'href', "./assets/themes/#{theme}/css/#{theme}.css"

# Layout
adjustSize = ->
  $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{window.innerHeight}px"
  $('kan-game webview').openDevTools
    detach: true
#window.addEventListener 'DOMContentLoaded', (e) ->
#  adjustSize()
window.addEventListener 'resize', (e) ->
  adjustSize()

# Fix font family
$('kan-game webview').addEventListener 'page-title-set', (e) ->
  @insertCSS '* { font-family: Ubuntu, "WenQuanYi Micro Hei", "Microsoft YaHei" !important; }'
  @executeJavaScript 'navigator.plugins["Shockwave Flash"].description = "Shockwave Flash 17.0 r0";'
  adjustSize()
$('kan-game webview').addEventListener 'did-finish-load', (e) ->
  @insertCSS '* { font-family: Ubuntu, "WenQuanYi Micro Hei", "Microsoft YaHei" !important; }'
  @executeJavaScript 'navigator.plugins["Shockwave Flash"].description = "Shockwave Flash 17.0 r0";'
  adjustSize()
