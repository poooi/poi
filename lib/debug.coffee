################################################################################
#                                 Debug Suite                                  #
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
definePureVirtual = (obj, name, defaultReturn = false) ->
  Object.defineProperty obj, name,
    value: ->
      console.error "[ERROR] Child class must implement `#{name}`!"
      defaultReturn
    writable: true

class IDebugger
  definePureVirtual @prototype, 'isEnabled'
  definePureVirtual @prototype, '_log'
  Object.defineProperties @prototype,
    log:
      get: -> if @isEnabled() then @_log else doNothing
    assert:
      get: -> if @isEnabled() then console.assert.bind(console) else doNothing

# Extra Option Handler
class ExOptHandler extends IDebugger

# Extra options container (just need the name)
class ExtraDebugOptions

# Base Implementation
class DebuggerBase extends IDebugger
  definePureVirtual @prototype, '_getLogFunc', doNothing
  constructor: ->
    @_log = @_getLogFunc '[DEBUG]'
    @main()

  initialised = false
  isInitialised: ->
    [r ,initialised] = [initialised, true]
    r
  init: ->
    @log "Debug Mode"
    if extraOpts.size is 1 then @_log "Extra Option: #{process.env.DEBUG_EXTRA}"
    else if extraOpts.size > 1 then @_log "Extra Options: #{process.env.DEBUG_EXTRA}"

  setEnabled: (b) ->
    enabled = b
    Debug.wrap {enabled: b}
  enable: ->
    @setEnabled true
  disable: ->
    @setEnabled false
  isEnabled: ->
    enabled

  validateTagName: (tag) ->
    valid = tag? and typeof tag is 'string' and tag.length > 0
    console.assert valid, 'You must pass a non-empty string! Current:', tag
    valid
  enableExtra: (tag) ->
    return (Debug.wrap 'Invalid extra option name') if !@extra tag
    extraOpts.add tag.toString()
    Debug.wrap {enabledExtra: tag}
  disableExtra: (tag) ->
    return (Debug.wrap 'Invalid extra option name') if !@validateTagName tag
    extraOpts.delete tag.toString()
    Debug.wrap {disabledExtra: tag}
  isExtraEnabled: (tag) ->
    return false if !@validateTagName tag
    extraOpts.has tag
  getAllExtraOptionsAsArray: ->
    Array.from extraOpts
  extra: (tag) ->
    if @validateTagName(tag) and !@h[tag]?
      Object.defineProperty @h, tag,
        value: new ExOptHandler
        enumerable: true
      Object.defineProperties @h[tag],
        enable:
          value: @enableExtra.bind(@, tag)
        disable:
          value: @disableExtra.bind(@, tag)
        isEnabled:
          value: @isExtraEnabled.bind(@, tag)
        _log:
          value: @_getLogFunc "[#{tag}]"
        toString:
          value: -> "[#{tag}: #{if @isEnabled() then 'enabled' else 'disabled'}]"
    @h[tag]
  main: ->
    if not @h.main?
      Object.defineProperty @h, 'main',
        value: new ExOptHandler
        enumerable: true
      Object.defineProperties @h.main,
        enable:
          value: @enable.bind @
        disable:
          value: @disable.bind @
        isEnabled:
          value: @isEnabled.bind @
        _log:
          value: @_log
        toString:
          value: -> "[main: #{if @isEnabled() then 'enabled' else 'disabled'}]"
    @h.main

  Object.defineProperty @prototype, 'h',
    value: new ExtraDebugOptions
    enumerable: true

# For the Browser Process
class DebuggerBrowser extends DebuggerBase
  colors = require 'colors/safe'
  _getLogFunc: (prefix) ->
    console.log.bind console, colors.cyan("#{prefix} %s")

  init: ->
    return Debug.wrap('Already initialised') if @isInitialised()
    process.env.DEBUG = 1 if @isEnabled()
    process.env.DEBUG_EXTRA = Array.from(extraOpts).join(',') if extraOpts.size > 0
    super()

# Helper classes to make life easier with DevTools
class DevToolsBooster

class Booster
  constructor: (dbgr, type, relistFunc) ->
    @Enabled = dbgr.isEnabled()
    @Type = type
    enable = dbgr.enable.bind dbgr
    disable = dbgr.disable.bind dbgr
    if @Enabled
      Object.defineProperty @, 'ClickToDisable -->',
        get: ->
          disable()
          relistFunc()
          'Disabled'
    else
      Object.defineProperty @, 'ClickToEnable -->',
        get: ->
          enable()
          relistFunc()
          'Enabled'

# For the Renderer Processes
class DebuggerRenderer extends DebuggerBase
  style = 'background: linear-gradient(30deg, cyan, white 3ex)'
  _getLogFunc: (prefix) ->
    if prefix? then console.debug.bind console, "%c#{prefix}", style
    else console.debug.bind console

  init: ->
    return Debug.wrap('Already initialised') if @isInitialised()
    @setEnabled process.env.DEBUG?
    process.env.DEBUG_EXTRA?.split(',').forEach @enableExtra.bind @
    super()

  list: ->
    relist = @list.bind @
    output = new DevToolsBooster
    output['DEBUG'] = new Booster(@, 'main', relist)
    for opt of @h
      continue if opt is 'main'
      output[opt] = new Booster(@h[opt], 'extra', relist)
    console.table output

dbg = if isRenderer then new DebuggerRenderer else new DebuggerBrowser

module.exports = dbg
