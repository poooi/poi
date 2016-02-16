{$, $$} = window

# Initial
# $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{window.innerWidth / 800.0 * 480.0}px"
$('#layout-css').setAttribute 'href', "./assets/css/layout.vertical.css"
poiControlHeight = 30 # Magic number
minPOIHeight = 200
dropdownStyleAppended = false
dropdownStyle = document.createElement 'style'

# Layout
adjustWebviewHeight = (h) ->
  $('kan-game #webview-wrapper')?.style?.height = h
  $('kan-game webview')?.style?.height = h
  $('kan-game webview')?.shadowRoot?.querySelector('object[is=browserplugin]')?.style?.height = h

adjustSize = ->
  webview = $('kan-game webview')
  poiapp = document.getElementsByTagName('poi-app')[0]
  url = null
  try
    url = webview?.getURL?()
  catch e
    url = null
  factor = Math.min window.innerWidth / 800.0, (window.innerHeight - minPOIHeight) / 480.0
  factor = Math.ceil(factor * 100) / 100.0
  if window.webviewWidth != -1
    factor = Math.ceil(window.webviewWidth / 800.0 * 100) / 100.0
  poiapp?.style?.height = "#{window.innerHeight - Math.ceil(480.0 * factor) - poiControlHeight}px"
  [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
    e.style.height = "#{(window.innerHeight - Math.ceil(480.0 * factor) - poiControlHeight) / window.zoomLevel - poiControlHeight}px"
    e.style.overflowY = "scroll"
  if window.webviewWidth > window.innerWidth
    nowWindow = remote.getCurrentWindow()
    bound = nowWindow.getBounds()
    borderX = bound.width - window.innerWidth
    newWidth = window.webviewWidth
    nowWindow.setBounds
      x: bound.x
      y: bound.y
      width: parseInt(newWidth + borderX)
      height: bound.height
  adjustWebviewHeight "#{480.0 * factor}px"
  $('kan-game #webview-wrapper')?.style?.width = "#{800 * factor}px"
  $('kan-game #webview-wrapper')?.style?.marginLeft = "#{Math.max(0, window.innerWidth - 800 * factor - 1) / 2}px"
  return if url != 'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/' and !(url?.startsWith('http://osapi.dmm.com/gadgets/ifr'))
  webview.insertCSS """
    html {
      overflow: hidden;
      zoom: #{factor};
    }
    #dmm-ntgnavi-renew {
      display: none;
    }
    #w {
      position: absolute;
      left: -38px;
      top: -16px;
    }
  """
  # Autoset plugin-dropdown height
  if !dropdownStyleAppended
    document.body.appendChild dropdownStyle
    dropdownStyleAppended = true
  dropdownStyle.innerHTML =
    """poi-nav poi-nav-tabs .nav .dropdown-menu {
      max-height: #{$('#MainView').style.height};
      overflow: auto;
    }
    """

if !window._delay
  adjustSize()
else
  setTimeout adjustSize, 500
  setTimeout adjustSize, 2000

adjustPayitem = ->
  webview = $('kan-game webview')
  webview.executeJavaScript """
    function fixPayitem() {
      setTimeout(function() {
        var alert = document.querySelector('#alert');
        if (alert == null || typeof(alert) == 'undefined')
          return;
        alert.style.zoom = 0.8;
        alert.style.left = '320px';
        alert.style.top = '90px';
      }, 500);
    }
    fixPayitem();
    if (typeof(__POI_INJECTED_LISTENER__) == 'undefined') {
      __POI_INJECTED_LISTENER__ = window.addEventListener('resize', fixPayitem);
    }
  """

# Adjust elements layout
handleResize = ->
  if !window._delay
    adjustSize()
  else
    window._delay = false

handleTitleSet = ->
  @insertCSS """
    #ntg-recommend {
      display: none !important;
    }
  """
  handleResize()

document.addEventListener 'DOMContentLoaded', ->
  $('kan-game webview').addEventListener 'page-title-set', handleTitleSet
window.addEventListener 'resize', handleResize
window.addEventListener 'webview.width.change', handleResize
window.addEventListener 'game.start', adjustSize
window.addEventListener 'game.payitem', adjustPayitem

module.exports =
  unload: ->
    [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
      e.style.height = ""
      e.style.overflowY = "hidden"
    window.removeEventListener 'resize', handleResize
    window.removeEventListener 'webview.width.change', handleResize
    window.removeEventListener 'game.start', adjustSize
    window.removeEventListener 'game.payitem', adjustPayitem
    $('kan-game webview').removeEventListener 'page-title-set', handleTitleSet
    adjustWebviewHeight "#{window.innerWidth / 800.0 * 480.0 - 5}px"
    $('kan-game #webview-wrapper')?.style?.width = ""
    $('kan-game #webview-wrapper')?.style?.marginLeft = ""
    window._delay = true
