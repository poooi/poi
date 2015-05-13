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
