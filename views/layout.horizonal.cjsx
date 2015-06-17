{$, $$, gameScale} = window

# Initial
# $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "0px"
$('#layout-css').setAttribute 'href', "./assets/css/layout.horizonal.css"
factor = null

# Layout
adjustSize = ->
  webview = $('kan-game webview')
  url = null
  try
    url = webview?.getUrl?()
  catch e
    url = null
  # return if webview.isLoading()
  [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
    e.style.height = "#{window.innerHeight - 40}px"
    e.style.overflowY = "scroll"
  if url != 'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/'
    $('kan-game #webview-wrapper')?.style?.height = $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{window.innerHeight - 31}px"
    return
  factor = Math.ceil(window.innerWidth * gameScale / 800.0 * 100) / 100.0
  webview.executeJavaScript """
    var iframe = document.querySelector('#game_frame').contentWindow.document;
    document.querySelector('html').style.zoom = #{factor};
    iframe.querySelector('html').style.zoom = #{factor};
    window.scrollTo(0, 0);
    var x = document.querySelector('#game_frame').getBoundingClientRect().left + iframe.querySelector('embed').getBoundingClientRect().left;
    var y = document.querySelector('#game_frame').getBoundingClientRect().top + iframe.querySelector('embed').getBoundingClientRect().top;
    window.scrollTo(Math.ceil(x * #{factor}), Math.ceil(y * #{factor}));
    document.documentElement.style.overflow = 'hidden';
  """
  $('kan-game #webview-wrapper')?.style?.height = $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{Math.floor(480 * factor)}px"
  $('kan-game').style.marginTop = "#{Math.max(0, (window.innerHeight - 480 * factor - 30)) / 2.0}px"
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

handleTitleSet = ->
  @insertCSS """
    * {
      font-family: "Ubuntu", "Helvetica Neue", "Helvetica", "Arial", "Heiti SC", "WenQuanYi Micro Hei", "Microsoft YaHei", "Droid Sans Fallback", sans-serif !important;
    }
    #ntg-recommend {
      display: none !important;
    }
    ::-webkit-scrollbar {
      width: 0px;
    }
  """
  adjustSize()
# Hack CSS and Fix font family
document.addEventListener 'DOMContentLoaded', ->
  $('kan-game webview').addEventListener 'page-title-set', handleTitleSet

# Adjust elements layout
handleResize = ->
  if !window._delay
    adjustSize()
  else
    window._delay = false
handleChangeScale = ->
  {gameScale} = window
  $('kan-game').style.flex = gameScale
  $('poi-app').style.flex = 1 - gameScale
  handleResize()
if config.get('poi.scale', false)
  document.addEventListener 'DOMContentLoaded', handleChangeScale

window.addEventListener 'resize', handleResize
window.addEventListener 'scale.change', handleChangeScale
window.addEventListener 'game.start', adjustSize
window.addEventListener 'game.payitem', adjustPayitem

module.exports =
  unload: ->
    [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
      e.style.height = ""
      e.style.overflowY = "hidden"
    window.removeEventListener 'resize', handleResize
    window.removeEventListener 'scale.change', handleChangeScale
    window.removeEventListener 'game.start', adjustSize
    window.removeEventListener 'game.payitem', adjustPayitem
    # clearInterval interval
    $('kan-game webview').removeEventListener 'page-title-set', handleTitleSet
    $('kan-game').style.flex = null
    $('poi-app').style.flex = null
    if factor
      $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{Math.floor(480 * factor) - 5}px"
    else
      $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{window.innerHeight - 5}px"
    window._delay = true
