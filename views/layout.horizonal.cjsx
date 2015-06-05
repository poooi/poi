{$, $$} = window

# Initial
# $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "0px"
$('#layout-css').setAttribute 'href', "./assets/css/layout.horizonal.css"

# Layout
adjustSize = ->
  $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{window.innerHeight}px"
  webview = $('kan-game webview')
  url = webview.getUrl()
  return if url != 'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/' || webview.isLoading()
  [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
    e.style.overflowX = "scroll"
  factor = Math.ceil(window.innerWidth / 7.0 * 5.0 / 800.0 * 100) / 100.0
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
  $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{Math.floor(480 * factor)}px"
  $('kan-game').style.marginTop = "#{(window.innerHeight - 480 * factor - 25) / 2.0}px"
  $('poi-app').style.marginTop = "#{(window.innerHeight - 480 * factor - 25) / 2.0}px"
adjustSize()
handleTitleSet = ->
  @insertCSS """
    * {
      font-family: "Ubuntu", "Helvetica Neue", "Helvetica", "Arial", "Heiti SC", "WenQuanYi Micro Hei", "Microsoft YaHei", sans-serif !important;
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

module.exports =
  unload: ->
    [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
      e.style.overflowX = "hidden"
    window.removeEventListener 'resize', adjustSize
    $('kan-game webview').removeEventListener 'page-title-set', handleTitleSet
