{$, $$, layout, webviewWidth} = window
{config, proxy} = window
{setBounds, getBounds} = remote.require './lib/utils'
WindowManager = remote.require './lib/window'

window._delay = false

# Initial
# $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "0px"
$('#layout-css').setAttribute 'href', "./assets/css/layout.#{window.layout}.css"
factor = null
poiControlHeight = 30 # Magic number
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
  poiapp?.style?.height = "#{window.innerHeight}px"
  # Set height of panel
  [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
    if window.layout == 'horizontal'
      e.style.height = "#{window.innerHeight / window.zoomLevel - poiControlHeight}px"
    else
      e.style.height = "#{(window.innerHeight - Math.ceil(480.0 * factor) - poiControlHeight) / window.zoomLevel - poiControlHeight}px"
    e.style.overflowY = "scroll"
  # Resize when window size smaller than webview size
  if window.layout == 'vertical' && window.webviewWidth > window.innerWidth
    nowWindow = remote.getCurrentWindow()
    bound = nowWindow.getBounds()
    borderX = bound.width - window.innerWidth
    newWidth = window.webviewWidth
    nowWindow.setBounds
      x: bound.x
      y: bound.y
      width: parseInt(newWidth + borderX)
      height: bound.height
  # Get factor
  if window.layout == 'vertical'
    cap = 200 * window.zoomLevel
  else if window.doubleTabbed
    cap = 450 * window.zoomLevel
  else cap = 300 * window.zoomLevel
  if window.layout == 'horizontal'
    factor = Math.ceil((window.innerHeight - poiControlHeight) / 480.0 * 100) / 100.0
    if window.innerWidth - factor * 800 < cap
      factor = Math.ceil((window.innerWidth - cap) / 800.0 * 100) / 100.0
  else
    factor = Math.ceil(window.innerWidth / 800.0 * 100) / 100.0
    if window.innerHeight - factor * 480 < cap
      factor = Math.ceil((window.innerHeight - cap) / 480.0 * 100) / 100.0
  if window.webviewWidth > 0.00001
    factor = Math.max(window.webviewWidth / 800.0 * 100 / 100.0, 0.00125)
  window.webviewFactor = factor
  # Fix poi-info when game size 0x0
  if webviewWidth > -0.00001 and webviewWidth < 0.00001
    $('kan-game')?.style?.display = 'none'
  else
    $('kan-game')?.style?.display = ''
  if url != 'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/' and !(url?.startsWith('http://osapi.dmm.com/gadgets/ifr'))
    return if window.layout is 'vertical'
    $('kan-game #webview-wrapper')?.style?.width = "#{webviewWidth}px"
    adjustWebviewHeight "#{window.innerHeight - poiControlHeight}px"
    factor = null
    return
  # Insert CSS
  webview.insertCSS """
    html {
      overflow: hidden;
    }
    #w, #main-ntg {
      position: absolute !important;
      top: 0;
      left: 0;
      z-index: 100;
      margin-left: 0 !important;
      margin-top: 0 !important;
    }
    #game_frame {
      width: 800px !important;
      position: absolute;
      top: -16px;
      left: 0;
    }
    #spacing_top {
      display: none;
    }
    .naviapp {
      z-index: -1;
    }
  """
  # Set zoom factor
  webview.executeJavaScript """
    window.scrollTo(0, 0);
    if (document.querySelector('#game_frame') != null) {
      var iframe = document.querySelector('#game_frame').contentWindow.document;
      document.querySelector('html').style.zoom = #{factor};
      iframe.querySelector('html').style.zoom = #{factor};
    } else if (document.querySelector('embed') != null) {
      var iframe = document.querySelector('embed');
      document.querySelector('html').style.zoom = #{factor};
    }
  """
  # Adjust webview height & position
  if window.layout == 'horizontal'
    adjustWebviewHeight "#{Math.min(Math.floor(480 * factor), window.innerHeight - poiControlHeight)}px"
    $('kan-game #webview-wrapper')?.style?.width = "#{Math.floor(800 * factor)}px"
    $('kan-game #webview-wrapper')?.style?.marginLeft = '0'
    $('kan-game')?.style?.marginTop = "#{Math.max(0, Math.floor((window.innerHeight - 480 * factor - poiControlHeight) / 2.0))}px"
  else
    adjustWebviewHeight "#{Math.floor(480.0 * factor)}px"
    $('kan-game #webview-wrapper')?.style?.width = "#{Math.floor(800 * factor)}px"
    $('kan-game #webview-wrapper')?.style?.marginLeft = "#{Math.max(0, Math.floor((window.innerWidth - Math.floor(800 * factor)) / 2.0))}px"
    $('kan-game')?.style?.marginTop = '0'
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
        alert.style.left = '225px';
        alert.style.top = '0px';
      }, 500);
    }
    fixPayitem();
    if (typeof(__POI_INJECTED_LISTENER__) == 'undefined') {
      __POI_INJECTED_LISTENER__ = window.addEventListener('resize', fixPayitem);
    }
  """

# Adjust elements layout
handleResize = ->
  if window.layout == 'horizontal'
    {webviewWidth} = window
    if webviewWidth != -1
      $('kan-game').style.flex = webviewWidth
      $('poi-app').style.flex = window.innerWidth - webviewWidth
    else
      $('kan-game').style.flex = Math.floor(window.webviewFactor * 800)
      $('poi-app').style.flex = window.innerWidth - Math.floor(window.webviewFactor * 800)
  if !window._delay
    adjustSize()
  else
    window._delay = false

handleTitleSet = ->
  try
    url = $('kan-game webview')?.getURL?()
  catch e
    url = null
  return if url != 'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/' and !(url?.startsWith('http://osapi.dmm.com/gadgets/ifr'))
  @insertCSS """
    #ntg-recommend {
      display: none !important;
    }
  """
  handleResize()

if webviewWidth != -1
  document.addEventListener 'DOMContentLoaded', handleResize

changeBounds = ->
  bound = getBounds()
  {x, y} = bound
  borderX = bound.width - window.innerWidth
  borderY = bound.height - window.innerHeight
  newHeight = window.innerHeight
  newWidth = window.innerWidth
  if layout == 'horizontal'
    # Previous vertical
    newHeight = window.innerWidth / 800 * 480 + 30
    newWidth = window.innerWidth / 5 * 7
  else
    # Previous horizontal
    newHeight = window.innerWidth / 7 * 5 / 800 * 480 + 420
    newWidth = window.innerWidth / 7 * 5
  setBounds
    x: x
    y: y
    width: parseInt(newWidth + borderX)
    height: parseInt(newHeight + borderY)

window.addEventListener 'layout.change', (e) ->
  resizable = remote.getCurrentWindow().isResizable()
  remote.getCurrentWindow().setResizable true
  {layout} = e.detail
  changeBounds()
  window.dispatchEvent new Event('resize')
  $('#layout-css').setAttribute 'href', "./assets/css/layout.#{layout}.css"
  remote.getCurrentWindow().setResizable resizable
window.addEventListener 'resize', handleResize
window.addEventListener 'webview.width.change', handleResize
window.addEventListener 'game.start', adjustSize
window.addEventListener 'game.payitem', adjustPayitem

document.addEventListener 'DOMContentLoaded', ->
  $('kan-game webview').src = config.get 'poi.homepage', 'http://www.dmm.com/netgame/social/application/-/detail/=/app_id=854854/'
  $('kan-game webview').addEventListener 'page-title-set', handleTitleSet
  # Editing DMM Cookie's Region Flag
  $('kan-game webview').addEventListener 'dom-ready', (e) ->
    enableDMMcookie = config.get 'poi.enableDMMcookie', false
    if enableDMMcookie
      $('kan-game webview').executeJavaScript """
        document.cookie = "cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/";
        document.cookie = "cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame/";
        document.cookie = "cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame_s/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=osapi.dmm.com;path=/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=203.104.209.7;path=/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=www.dmm.com;path=/netgame/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=log-netgame.dmm.com;path=/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame/";
        document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame_s/";
      """
    disableNetworkAlert = config.get 'poi.disableNetworkAlert', false
    if disableNetworkAlert
      $('kan-game webview').executeJavaScript """
        DMM.netgame.reloadDialog=function(){}
      """
  # Create new window for new window in webview
  $('kan-game webview').addEventListener 'new-window', (e) ->
    exWindow = WindowManager.createWindow
      realClose: true
      navigatable: true
      'node-integration': false
    exWindow.loadURL e.url
    exWindow.show()
    e.preventDefault()
