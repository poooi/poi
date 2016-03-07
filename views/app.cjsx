# Break on first line (Please keep this line at the top of this file)
debugger if dbg.h.brk?.isEnabled()

{ROOT, EXROOT, _, $, $$, React, ReactDOM} = window
{config, toggleModal} = window
fs = require 'fs-extra'
path = require 'path-extra'

__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

# Set zoom level
document.getElementById('poi-app-container').style.transformOrigin = '0 0'
document.getElementById('poi-app-container').style.WebkitTransform = "scale(#{window.zoomLevel})"
document.getElementById('poi-app-container').style.width = "#{Math.floor(100 / window.zoomLevel)}%"
# Disable OSX zoom
require('web-frame').setZoomLevelLimits(1, 1)

# Hackable panels
window.hack = {}

# Plugin manager
window.PluginManager = require './services/plugin-manager'

# Module path
require('module').globalPaths.push(path.join(ROOT, "node_modules"))

# poi menu
require './components/etc/menu'

# Main tabbed area
ControlledTabArea = require './tabarea'

{PoiAlert} = require './components/info/alert'
{PoiMapReminder} = require './components/info/map-reminder'
{PoiControl} = require './components/info/control'
{ModalTrigger} = require './components/etc/modal'

# Set webview muted
muter = setInterval =>
  try
    if config.get 'poi.content.muted', false
      $('kan-game webview').setAudioMuted true
    clearInterval muter
, 1000

# Custom css injector
CustomCssInjector = React.createClass
  render: ->
    cssPath = path.join window.EXROOT, 'hack', 'custom.css'
    fs.ensureFileSync cssPath
    <link rel='stylesheet' id='custom-css' href={cssPath} />

ReactDOM.render <PoiAlert id='poi-alert' />, $('poi-alert')
ReactDOM.render <PoiMapReminder id='poi-map-reminder'/>, $('poi-map-reminder')
ReactDOM.render <PoiControl />, $('poi-control')
ReactDOM.render <ModalTrigger />, $('poi-modal-trigger')
ReactDOM.render <ControlledTabArea />, $('poi-nav-tabs')
ReactDOM.render <CustomCssInjector />, $('poi-css-injector')
