{$, $$, webviewWidth} = window

# Initial
# $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "0px"
$('#layout-css').setAttribute 'href', "./assets/css/layout.horizontal.css"
factor = null
poiControlHeight = 31 # Magic number
dropdownStyleAppended = false
dropdownStyle = document.createElement 'style'

# Layout
adjustWebviewHeight = (h) ->
  $('kan-game #webview-wrapper')?.style?.height = h
  $('kan-game webview')?.style?.height = h
  $('kan-game webview')?.shadowRoot?.querySelector('object[is=browserplugin]')?.style?.height = h

adjustSize = ->
  poiapp = document.getElementsByTagName('poi-app')[0]
  webview = $('kan-game webview')
  url = null
  try
    url = webview?.getURL?()
  catch e
    url = null
  # return if webview.isLoading()
  poiapp?.style?.height = "#{window.innerHeight}px"
  [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
    e.style.height = "#{window.innerHeight / window.zoomLevel - poiControlHeight}px"
    e.style.overflowY = "scroll"
  # Fix poi-info when game size 0x0
  if webviewWidth > -0.00001 and webviewWidth < 0.00001
    $('kan-game')?.style?.display = 'none'
  else
    $('kan-game')?.style?.display = ''
  if url != 'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/' and !(url?.startsWith('http://osapi.dmm.com/gadgets/ifr'))
    $('kan-game #webview-wrapper')?.style?.width = "#{webviewWidth}px"
    adjustWebviewHeight "#{window.innerHeight - poiControlHeight}px"
    factor = null
    return
  factor = Math.ceil(window.innerWidth * (if window.doubleTabbed then 4.0 / 7.0 else 5.0 / 7.0) / 800.0 * 100) / 100.0
  if webviewWidth > 0.00001
    factor = Math.ceil(webviewWidth / 800.0 * 100) / 100.0
  webview.executeJavaScript """
    if (document.querySelector('#game_frame') != null) {
      var iframe = document.querySelector('#game_frame').contentWindow.document;
      document.querySelector('html').style.zoom = #{factor};
      iframe.querySelector('html').style.zoom = #{factor};
      window.scrollTo(0, 0);
      var x = document.querySelector('#game_frame').getBoundingClientRect().left + iframe.querySelector('embed').getBoundingClientRect().left;
      var y = document.querySelector('#game_frame').getBoundingClientRect().top + iframe.querySelector('embed').getBoundingClientRect().top;
      window.scrollTo(Math.ceil(x * #{factor}), Math.ceil(y * #{factor}));
      document.documentElement.style.overflow = 'hidden';
    } else if (document.querySelector('embed') != null) {
      var iframe = document.querySelector('embed');
      document.querySelector('html').style.zoom = #{factor};
      window.scrollTo(0, 0);
      var x = document.querySelector('embed').getBoundingClientRect().left;
      var y = document.querySelector('embed').getBoundingClientRect().top;
      window.scrollTo(Math.ceil(x * #{factor}), Math.ceil(y * #{factor}));
      document.documentElement.style.overflow = 'hidden';
    }
  """
  adjustWebviewHeight "#{Math.floor(480 * factor)}px"
  $('kan-game #webview-wrapper')?.style?.width = "#{Math.floor(800 * factor)}px"
  $('kan-game').style.marginTop = "#{Math.max(0, (window.innerHeight - Math.floor(480 * factor - 1) - 30)) / 2.0}px"
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
  {webviewWidth} = window
  if webviewWidth != -1
    $('kan-game').style.flex = webviewWidth
    $('poi-app').style.flex = window.innerWidth - webviewWidth
  else
    $('kan-game').style.flex = (if window.doubleTabbed then 4.0 else 5.0)
    $('poi-app').style.flex = (if window.doubleTabbed then 3.0 else 2.0)
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

if webviewWidth != -1
  document.addEventListener 'DOMContentLoaded', handleResize

window.addEventListener 'resize', handleResize
window.addEventListener 'webview.width.change', handleResize
window.addEventListener 'game.start', adjustSize
window.addEventListener 'game.payitem', adjustPayitem

module.exports =
  unload: ->
    [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
      e.style.height = ""
      e.style.overflowY = "hidden"
    $('kan-game').style.display = ''
    window.removeEventListener 'resize', handleResize
    window.removeEventListener 'webview.width.change', handleResize
    window.removeEventListener 'game.start', adjustSize
    window.removeEventListener 'game.payitem', adjustPayitem
    # clearInterval interval
    $('kan-game webview').removeEventListener 'page-title-set', handleTitleSet
    $('kan-game').style.flex = null
    $('poi-app').style.flex = null
    if factor
      adjustWebviewHeight "#{Math.floor(480 * factor) - 5}px"
    else
      adjustWebviewHeight "#{window.innerHeight - 5}px"
    window._delay = true
