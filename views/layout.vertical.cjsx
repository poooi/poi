{$, $$} = window

# Initial
# $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{window.innerWidth / 800.0 * 480.0}px"
$('#layout-css').setAttribute 'href', "./assets/css/layout.vertical.css"

# Layout
adjustSize = ->
  $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{window.innerWidth / 800.0 * 480.0}px"
  webview = $('kan-game webview')
  url = webview.getUrl()
  return if url != 'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/'
  [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
    e.style.height = "#{window.innerHeight - window.innerWidth / 800.0 * 480.0 - 90}px"
    e.style.overflowY = "scroll"
  factor = Math.ceil(window.innerWidth /  800.0 * 100) / 100.0
  webview.executeJavaScript """
    var iframe = document.querySelector('#game_frame').contentWindow.document;
    document.querySelector('html').style.zoom = #{factor + 0.002};
    iframe.querySelector('html').style.zoom = #{factor + 0.002};
    window.scrollTo(0, 0);
    var x = document.querySelector('#game_frame').getBoundingClientRect().left + iframe.querySelector('embed').getBoundingClientRect().left;
    var y = document.querySelector('#game_frame').getBoundingClientRect().top + iframe.querySelector('embed').getBoundingClientRect().top;
    window.scrollTo(Math.ceil(x * #{factor + 0.002}), Math.ceil(y * #{factor + 0.002}));
    document.documentElement.style.overflow = 'hidden';
  """
adjustSize()
handleTitleSet = ->
  @insertCSS """
    * {
      font-family: Ubuntu, "WenQuanYi Micro Hei", "Microsoft YaHei" !important;
    }
    ::-webkit-scrollbar {
      width: 0px;
    }
  """
  adjustSize()
# Hack CSS and Fix font family
$('kan-game webview').addEventListener 'page-title-set', handleTitleSet

# Adjust elements layout
window.addEventListener 'resize', adjustSize

timeout = null
$('kan-game webview').addEventListener 'did-finish-load', (e) ->
  timeout = setTimeout adjustSize, 1000

module.exports =
  unload: ->
    [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
      e.style.height = ""
      e.style.overflowY = "hidden"
    window.removeEventListener 'resize', adjustSize
    $('kan-game webview').removeEventListener 'page-title-set', handleTitleSet
    clearTimeout timeout
