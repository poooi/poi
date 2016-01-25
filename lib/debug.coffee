
console.assert process, "process doesn't exist"
isRenderer = process?.type is 'renderer'

enabled = false
extraOpts = new Set()

doNothing = -> return
debugLog = doNothing

setupDebugLog = ->
  if enabled
    if isRenderer
      style = 'background: linear-gradient(30deg, cyan, white 5ex)'
      debugLog = console.debug.bind console, '%c[DEBUG] %s', style
    else
      debugLog = console.log.bind console, '[DEBUG] %s'.cyan
  else
    debugLog = doNothing

module.exports =
  setEnabled: (b) ->
    enabled = b
    setupDebugLog()
  enable: ->
    @setEnabled true
  disable: ->
    @setEnabled false
  isEnabled: ->
    enabled

  enableExtra: (tag) ->
    extraOpts.add tag
  disableExtra: (tag) ->
    extraOpts.delete tag
  isExtraEnabled: (tag) ->
    extraOpts.has tag
  getAllExtraOptionsAsArray: ->
    Array.from extraOpts

  log: (txt = '', obj = null) ->
    if obj? then debugLog txt, obj else debugLog txt
