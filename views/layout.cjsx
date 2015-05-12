{$, $$, layout} = window
{config, proxy} = window

# Custom theme
theme = config.get 'poi.theme'
if theme
  $('#bootstrap-css').setAttribute 'href', "./assets/themes/#{theme}/css/#{theme}.css"
window.addEventListener 'theme.change', (e) ->
  theme = e.detail.theme
  $('#bootstrap-css').setAttribute 'href', "./assets/themes/#{theme}/css/#{theme}.css"

# Horizonal or Vertical
if layout != 'horizonal'
  $('#layout-css').setAttribute 'href', "./assets/css/layout.#{layout}.css"
require "./layout.#{layout}"

# Test
proxy.on 'game.request', (method, path, body) ->
  return
  console.log "Request: #{method} #{path} #{JSON.stringify(body)}"
proxy.on 'game.response', (method, path, body) ->
  return
  console.log "Response: #{method} #{path} #{JSON.stringify(body)}"
