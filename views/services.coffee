{config, toggleModal} = window

__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

require './services/update'
require './services/layout'
require './services/welcome'
require './services/doyouknow'
require './services/modernization-delta'

refreshFlash = ->
  $('kan-game webview').executeJavaScript """
    var doc;
    if (document.getElementById('game_frame')) {
      doc = document.getElementById('game_frame').contentDocument;
    } else {
      doc = document;
    }
    var flash = doc.getElementById('flashWrap');
    if(flash) {
      var flashInnerHTML = flash.innerHTML;
      flash.innerHTML = '';
      flash.innerHTML = flashInnerHTML;
    }
  """

# F5 & Ctrl+F5 & Alt+F5
window.addEventListener 'keydown', (e) ->
  if process.platform == 'darwin'
    if e.keyCode is 91 or e.keyCode is 93
      # When the game (flash) is on focus, it catches all keypress events
      # Blur the webview when any Cmd key is pressed,
      # so the OS shortcuts will always work
      remote.getCurrentWindow().blurWebView()
    else if e.keyCode is 82 and e.metaKey
      if e.shiftKey # cmd + shift + r
        $('kan-game webview').reloadIgnoringCache()
      else if e.altKey # cmd + alt + r
        refreshFlash()
      else # cmd + r
        # Catched by menu
        # $('kan-game webview').reload()
        false
  else if e.keyCode is 116
    if e.ctrlKey # ctrl + f5
      $('kan-game webview').reloadIgnoringCache()
    else if e.altKey # alt + f5
      refreshFlash()
    else if !e.metaKey # f5
      $('kan-game webview').reload()

# Confirm before quit
confirmExit = false
exitPoi = ->
  confirmExit = true
  window.close()
window.onbeforeunload = (e) ->
  if confirmExit || !config.get('poi.confirm.quit', false)
    remote.require('./lib/window').rememberMain()
    e.returnValue = true
  else
    toggleModal __('Exit'), __('Confirm?'), [
      name: __ 'Confirm'
      func: exitPoi
      style: 'warning'
    ]
    e.returnValue = false

class GameResponse
  constructor: (@path, @body, @postBody) ->
    Object.defineProperty @, 'ClickToCopy -->',
      get: ->
        require('electron').clipboard.writeText JSON.stringify @
        "Copied: #{@path}"

window.addEventListener 'game.request', (e) ->
  {method} = e.detail
  resPath = e.detail.path
window.addEventListener 'game.response', (e) ->
  {method, body, postBody} = e.detail
  resPath = e.detail.path
  if dbg.extra('gameResponse').isEnabled()
    dbg._getLogFunc()(new GameResponse(resPath, body, postBody))
  log "#{__ 'Hit'} #{method} #{resPath}"
window.addEventListener 'network.error.retry', (e) ->
  {counter} = e.detail
  error __n 'Connection failed after %s retry',  counter
window.addEventListener 'network.invalid.code', (e) ->
  {code} = e.detail
  error __ 'Network error: HTTP %s', code
window.addEventListener 'network.error', ->
  error __ 'Connection failed.'
