{reducer: rootReducer, onGameRequest, onGameResponse} = require('../redux')
{store} = require('../createStore')

window._portStorageUpdated = true

isGameApi = (pathname) ->
  pathname.startsWith '/kcsapi'

handleProxyGameOnRequest = (method, [domain, path], body) ->
  return if !isGameApi path
  # Parse the json object
  try
    body = JSON.parse body
    details =
      method: method
      path: path
      body: body
    store.dispatch onGameRequest details
    event = new CustomEvent 'game.request',
      bubbles: true
      cancelable: true
      detail: details
    window.dispatchEvent event
  catch e
    console.log e

responses = []
locked = false
resolveResponses = ->
  locked = true
  while responses.length > 0
    [method, [domain, path, url], body, postBody] = responses.shift()
    try
      if path in ['/kcs/mainD2.swf', '/kcsapi/api_start2', '/kcsapi/api_get_member/basic']
        handleProxyGameStart()
      continue if !isGameApi path

      if body.api_result != 1
        event = new CustomEvent 'network.invalid.result',
          bubbles: true
          cancelable: true
          detail:
            code: body.api_result
        window.dispatchEvent event
        continue

      body = body.api_data if body.api_data?

      # Delete api_token
      delete postBody.api_token if postBody?.api_token?
      # Fix api
      body.api_level = parseInt body.api_level if body?.api_level?
      body.api_member_lv = parseInt body.api_member_lv if body?.api_member_lv?

      details =
        method: method
        path: path
        body: body
        postBody: postBody

      # Update redux store
      store.dispatch onGameResponse details

      switch path
        when '/kcsapi/api_port/port'
          window._portStorageUpdated = false
      event = new CustomEvent 'game.response',
        bubbles: true
        cancelable: true
        detail: details
      window.dispatchEvent event
    catch err
      console.error err.stack
  locked = false

handleProxyGameOnResponse = (method, [domain, path, url], body, postBody) ->
  # Parse the json object
  try
    responses.push [method, [domain, path, url], JSON.parse(body), JSON.parse(postBody)]
    resolveResponses() if !locked
  catch e
    console.log e

handleProxyGameStart = ->
  window.dispatchEvent new Event 'game.start'

handleProxyNetworkErrorRetry = ([domain, path, url], counter) ->
  return if !isGameApi path
  event = new CustomEvent 'network.error.retry',
    bubbles: true
    cancelable: true
    detail:
      counter: counter
  window.dispatchEvent event

handleProxyNetworkError = ([domain, path, url]) ->
  if url.startsWith('http://www.dmm.com/netgame/') or url.indexOf('/kcs/') != -1 or url.indexOf('/kcsapi/') != -1
    window.dispatchEvent new Event 'network.error'

handleGetServer = (server) ->
  window._serverIp = server.ip
  window._serverId = server.num
  window._serverName = server.name

proxyListener =
  'network.on.request': handleProxyGameOnRequest
  'network.on.response': handleProxyGameOnResponse
  'network.error': handleProxyNetworkError
  'network.error.retry': handleProxyNetworkErrorRetry
  'network.get.server': handleGetServer

window.listenerStatusFlag = false

addProxyListener = ()->
  if not window.listenerStatusFlag
    window.listenerStatusFlag = true
    for eventName, handler of proxyListener
      proxy.addListener eventName, handler

addProxyListener()

window.addEventListener 'load', ->
  addProxyListener()

window.addEventListener 'unload', ->
  if window.listenerStatusFlag
    window.listenerStatusFlag = false
    for eventName, handler of proxyListener
      proxy.removeListener eventName, handler
