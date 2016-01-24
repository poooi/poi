

enabled = false
extraOpts = new Set()

debugLog = console.log.bind console, '[DEBUG]'

module.exports =
  setEnabled: (b) ->
    enabled = b
  enable: ->
    enabled = true
  disable: ->
    enabled = false
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

  log: debugLog
