################################################################################
#                                Debug Support                                 #
################################################################################

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

# Globals
console.assert process, "process doesn't exist"
isRenderer = process?.type is 'renderer'

enabled = false
extraOpts = new Set()

doNothing = -> return

# Base Implementation
class DebugBase
  setEnabled: (b) ->
    enabled = b
    Debug.wrap {enabled: b}
  enable: ->
    @setEnabled true
  disable: ->
    @setEnabled false
  isEnabled: ->
    enabled

  enableExtra: (tag) ->
    console.assert tag, 'Are you kidding me? What do you want to enable?'
    return (Debug.wrap 'Nothing happened') if !tag
    extraOpts.add tag.toString()
    Debug.wrap {enabledExtra: tag}
  disableExtra: (tag) ->
    extraOpts.delete tag.toString()
    Debug.wrap {disabledExtra: tag}
  isExtraEnabled: (tag) ->
    extraOpts.has tag
  getAllExtraOptionsAsArray: ->
    Array.from extraOpts

  _log: doNothing
  Object.defineProperties @prototype,
    log:
      get: -> if @isEnabled() then @_log else doNothing

  init: ->
    @log "Debug Mode"
    @log "Extra Options: #{process.env.DEBUG_EXTRA}" if extraOpts.size > 0

# For the Browser Process
class DebugBrowser extends DebugBase
  _log: (msg = '', obj = null) ->
    txt = "[DEBUG] #{msg}".cyan
    if obj? then console.log txt, obj else console.log txt

  init: ->
    process.env.DEBUG = 1 if @isEnabled()
    process.env.DEBUG_EXTRA = Array.from(extraOpts).join(',') if extraOpts.size > 0
    super()

# For the Renderer Processes
class DebugRenderer extends DebugBase
  style = 'background: linear-gradient(30deg, cyan, white 5ex)'
  _log: (msg = '', obj = null) ->
    txt = "%c[DEBUG] #{msg}"
    if obj? then console.debug txt, style, obj else console.debug txt, style

  init: ->
    @setEnabled process.env.DEBUG?
    extraOpts = new Set(process.env.DEBUG_EXTRA?.split ',')
    super()

debug = if isRenderer then new DebugRenderer else new DebugBrowser

module.exports = debug
