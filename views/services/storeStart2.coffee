{initConst} = require '../redux/const'

envKeyList = ['_teitokuLv', '_nickName', '_nickNameId', '_teitokuExp', '_teitokuId', '_slotitems', '_ships', '_decks', '_ndocks']

start2Version = 0
initStart2Value = ->
  if localStorage.start2Version?
    start2Version = parseInt localStorage.start2Version
    # We need a hack to deal with Infinity for historical reasons.
    if start2Version > 0xFFFFFFFF
      start2Version = 0
      localStorage.start2Version = 0

  if localStorage.start2Body?
    initConst JSON.parse localStorage.start2Body
  # TODO: init window._* values
  #for key in envKeyList
  #  delete localStorage[key] if localStorage[key] == 'undefined'
  #  if localStorage[key]? then window[key] = JSON.parse localStorage[key]


updateStart2Value = ({detail: {path, body}}) ->
  switch path
    when '/kcsapi/api_start2'
      start2Version += 1
      # updating start2Body while avoiding body from being updated by multi-plugins
      if not localStorage.start2Version? or start2Version > localStorage.start2Version
        localStorage.start2Version = start2Version % 0xFFFFFFFF
        localStorage.start2Body = JSON.stringify body
      # TODO
      window.dispatchEvent new Event 'initialize.complete'

initStart2Value()
window.addEventListener 'game.response', updateStart2Value
