{$, $$, layout, webviewWidth} = window
{config, proxy} = window
{setBounds, getBounds} = remote.require './lib/utils'
WindowManager = remote.require './lib/window'

# Initial
# $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "0px"
$('#layout-css').setAttribute 'href', "./assets/css/layout.#{window.layout}.css"
factor = null
poiControlHeight = 30 # Magic number
additionalStyle = document.createElement 'style'
remote.getCurrentWindow().webContents.on 'dom-ready', (e) ->
  document.body.appendChild additionalStyle

# Layout
isKancollePage = (url) ->
  url is 'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/' or url?.startsWith('http://osapi.dmm.com/gadgets/ifr')

adjustSize = ->
  webview = $('kan-game webview')
  url = null
  try
    url = webview?.getURL?()
  catch e
    url = null

  # Get factor
  if window.layout == 'vertical'
    cap = 200 * window.zoomLevel
  else if window.doubleTabbed
    cap = 500 * window.zoomLevel
  else cap = 375 * window.zoomLevel
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

  # Autoset style
  if window.layout == 'horizontal'
    tabpaneHeight = "#{window.innerHeight / window.zoomLevel - poiControlHeight}px"
  else
    tabpaneHeight = "#{(window.innerHeight - Math.ceil(480.0 * factor) - poiControlHeight) / window.zoomLevel - poiControlHeight}px"
  additionalStyle.innerHTML =
    """
    poi-app {
      height: #{window.innerHeight}px;
      width: 0px;
    }
    poi-app div.poi-app-tabpane {
      height: #{tabpaneHeight};
      overflow-y: scroll;
    }
    div[role='tooltip'], #poi-app-container {
      transform-origin : 0 0;
      transform : scale(#{window.zoomLevel});
    }
    #poi-app-container {
      width: #{Math.floor(100 / window.zoomLevel)}%;
    }
    poi-nav poi-nav-tabs .nav .dropdown-menu {
      max-height: #{tabpaneHeight};
      overflow: auto;
    }
    """
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

  # Fix poi-info when game size 0x0
  if webviewWidth > -0.00001 and webviewWidth < 0.00001
    $('kan-game')?.style?.display = 'none'
  else
    $('kan-game')?.style?.display = ''
  # Adjust webview height & position
  if window.layout == 'horizontal'
    if isKancollePage(url)
      $('kan-game #webview-wrapper')?.style?.height = "#{Math.min(Math.floor(480 * factor), window.innerHeight - poiControlHeight)}px"
      $('kan-game #webview-wrapper')?.style?.width = "#{Math.floor(800 * factor)}px"
    $('kan-game #webview-wrapper')?.style?.marginLeft = '0'
    $('kan-game')?.style?.marginTop = "#{Math.max(0, Math.floor((window.innerHeight - 480 * factor - poiControlHeight) / 2.0))}px"
  else
    if isKancollePage(url)
      $('kan-game #webview-wrapper')?.style?.height = "#{Math.floor(480.0 * factor)}px"
      $('kan-game #webview-wrapper')?.style?.width = "#{Math.floor(800 * factor)}px"
    $('kan-game #webview-wrapper')?.style?.marginLeft = "#{Math.max(0, Math.floor((window.innerWidth - Math.floor(800 * factor)) / 2.0))}px"
    $('kan-game')?.style?.marginTop = '0'
  if not isKancollePage(url)
    $('kan-game #webview-wrapper')?.style?.width = "#{Math.ceil(800 * window.webviewFactor)}px"
    $('kan-game #webview-wrapper')?.style?.height = "#{Math.ceil(480 * window.webviewFactor)}px"
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
    #alert {
      transform: scale(0.8);
      left: 80px !important;
      top: -80px !important;
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

adjustSize()

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
  adjustSize()

handleTitleSet = ->
  try
    url = $('kan-game webview')?.getURL?()
  catch e
    url = null
  return if not isKancollePage(url)
  @insertCSS """
    #ntg-recommend {
      display: none !important;
    }
  """
  handleResize()

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
      webPreferences:
        nodeIntegration: false
    exWindow.loadURL e.url
    exWindow.show()
    e.preventDefault()
