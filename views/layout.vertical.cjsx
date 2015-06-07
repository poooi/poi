{$, $$} = window

# Initial
# $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{window.innerWidth / 800.0 * 480.0}px"
$('#layout-css').setAttribute 'href', "./assets/css/layout.vertical.css"

# Layout
adjustSize = ->
  $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "99%"
  $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "100%"
  $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "0px"
  $('kan-game webview')?.style?.height = $('kan-game webview /deep/ object[is=browserplugin]')?.style?.height = "#{window.innerWidth / 800.0 * 480.0}px"
  webview = $('kan-game webview')
  url = webview.getUrl()
  return if url != 'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/' || webview.isLoading()
  [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
    e.style.height = "#{window.innerHeight - window.innerWidth / 800.0 * 480.0 - 90}px"
    e.style.overflowY = "scroll"
  factor = Math.ceil(window.innerWidth /  800.0 * 100) / 100.0
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
setTimeout adjustSize, 500

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
window.addEventListener 'game.start', adjustSize
window.addEventListener 'game.payitem', adjustPayitem

module.exports =
  unload: ->
    [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
      e.style.height = ""
      e.style.overflowY = "hidden"
    window.removeEventListener 'resize', adjustSize
    $('kan-game webview').removeEventListener 'page-title-set', handleTitleSet
