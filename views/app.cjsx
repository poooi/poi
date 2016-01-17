{ROOT, EXROOT, _, $, $$, React, ReactDOM} = window
{config, toggleModal} = window
fs = require 'fs-extra'
path = require 'path-extra'

__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

if process.env.DEBUG?
  alert """
        DEBUG MODE

        Now it's your chance to pause the app & add your breakpoints!
        """

# Set zoom level
document.getElementById('poi-app-container').style.transformOrigin = '0 0'
document.getElementById('poi-app-container').style.WebkitTransform = "scale(#{window.zoomLevel})"
document.getElementById('poi-app-container').style.width = "#{Math.floor(100 / window.zoomLevel)}%"

# Hackable panels
window.hack = {}

# Plugin manager
window.PluginManager = require './services/plugin-manager'

# Module path
require('module').globalPaths.push(path.join(ROOT, "node_modules"))

# poi menu
if process.platform == 'darwin'
  require './components/etc/mac-menu'

# Main tabbed area
ControlledTabArea =
  if config.get('poi.tabarea.double', false)
    require './double-tabareas'
  else
    require './single-tabarea'

{PoiAlert} = require './components/info/alert'
{PoiMapReminder} = require './components/info/map-reminder'
{PoiControl} = require './components/info/control'
{ModalTrigger} = require './components/etc/modal'

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

# Check proxy status after modal is mounted
console.log window.proxy.getStatus()
console.log (window.proxy.getStatus() is 'EADDRINUSE')
if window.proxy.getStatus() is 'EADDRINUSE'
  solMsg = __ "PortInUseSolution"
  context =
    <div>
      <p>{__ "Port %s is in use", config.get 'poi.port', 12450}</p>
      <p>{__ "Solution"}</p>
      <ul>
      {
        for msg, index in solMsg
          <li>{msg}</li>
      }
      </ul>
    </div>
  toggleModal window.i18n.setting.__("Error"), context
