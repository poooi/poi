{$, $$, layout} = window
{config, proxy} = window
{setBounds, getBounds} = remote.require './lib/utils'

# Custom theme
theme = config.get 'poi.theme', '__default__'
if theme != '__default__'
  $('#bootstrap-css').setAttribute 'href', "./assets/themes/#{theme}/css/#{theme}.css"
else
  $('#bootstrap-css').setAttribute 'href', './components/bootstrap/dist/css/bootstrap.css'
window.addEventListener 'theme.change', (e) ->
  theme = e.detail.theme
  if theme == '__default__'
    $('#bootstrap-css').setAttribute 'href', './components/bootstrap/dist/css/bootstrap.css'
  else
    $('#bootstrap-css').setAttribute 'href', "./assets/themes/#{theme}/css/#{theme}.css"

changeBounds = ->
  bound = getBounds()
  {x, y} = bound
  borderX = bound.width - window.innerWidth
  borderY = bound.height - window.innerHeight
  newHeight = window.innerHeight
  newWidth = window.innerWidth
  if layout == 'horizonal'
    # Previous vertical
    newHeight = window.innerWidth / 800 * 480 + 30
    newWidth = window.innerWidth / 5 * 7
  else
    # Previous horizonal
    newHeight = window.innerWidth / 7 * 5 / 800 * 480 + 420
    newWidth = window.innerWidth / 7 * 5
  setBounds
    x: x
    y: y
    width: parseInt(newWidth + borderX)
    height: parseInt(newHeight + borderY)

window._layout = require "./layout.#{layout}"
window.addEventListener 'layout.change', (e) ->
  window._layout.unload()
  delete require.cache[require.resolve("./layout.#{layout}")]
  {layout} = e.detail
  window._layout = require "./layout.#{layout}"
  changeBounds()
