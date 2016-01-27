
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

# This class is only for the purpose of giving some feedbacks
# when certain function is called through the dev-tool console.
# (e.g., shows "Debug {enabled: true}" instead of "undefined")
# It should NOT be used for any other purpose.
class Debug
  @wrap: (o) ->
    if typeof o is 'string'
      Object.assign new Debug, {msg: o}
    else if o.toString() is "[object Object]"
      Object.assign new Debug, o
    else
      o

module.exports =
  setEnabled: (b) ->
    enabled = b
    setupDebugLog()
    Debug.wrap {enabled: b}
  enable: ->
    @setEnabled true
  disable: ->
    @setEnabled false
  isEnabled: ->
    enabled

  enableExtra: (tag) ->
    console.assert tag, 'Are you kidding me? What do you want to enable?'
    return {Debug.wrap 'Nothing happened'} if !tag
    extraOpts.add tag.toString()
    Debug.wrap {enabledExtra: tag}
  disableExtra: (tag) ->
    extraOpts.delete tag.toString()
    Debug.wrap {disabledExtra: tag}
  isExtraEnabled: (tag) ->
    extraOpts.has tag
  getAllExtraOptionsAsArray: ->
    Array.from extraOpts

  log: (txt = '', obj = null) ->
    if obj? then debugLog txt, obj else debugLog txt

  init: ->
    if not isRenderer
      process.env.DEBUG = 1 if @isEnabled()
      process.env.DEBUG_EXTRA = Array.from(extraOpts).join(',') if extraOpts.size > 0
    else
      @setEnabled process.env.DEBUG?
      extraOpts = new Set(process.env.DEBUG_EXTRA?.split ',')
    @log "Debug Mode Enabled"
    @log "Extra Options: #{process.env.DEBUG_EXTRA}" if extraOpts.size > 0
