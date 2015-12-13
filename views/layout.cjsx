{$, $$, layout} = window
{config, proxy} = window
{setBounds, getBounds} = remote.require './lib/utils'
WindowManager = remote.require './lib/window'

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

window._delay = false
window._layout = require "./layout.#{layout}"
window.addEventListener 'layout.change', (e) ->
  window._layout.unload()
  delete require.cache[require.resolve("./layout.#{layout}")]
  {layout} = e.detail
  changeBounds()
  window._layout = require "./layout.#{layout}"

document.addEventListener 'DOMContentLoaded', ->
  $('kan-game webview').src = config.get 'poi.homepage', 'http://www.dmm.com/netgame/social/application/-/detail/=/app_id=854854/'
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
