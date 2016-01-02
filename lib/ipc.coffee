#
# ipc: Inter-Plugins Call
#
# Usage:
#   remote = require('electron').remote
#   ipc = remote.require('./lib/ipc')
#
#   ipc.register("plugin-name", {
#     api_name: @ref_to_function
#     api_name2:  @ref_to_function_2
#   })
#
#   ipc.unregister("plugin-name", "api_name")
#   ipc.unregister("plugin-name", ["api_name", "api_name2"])
#   ipc.unregister("plugin-name", {
#     api_name: @ref_to_function
#     api_name2:  @ref_to_function_2
#   })
#
#   nameIPC = ipc.access("plugin-name")
#	  if nameIPC?
#     nameIPC.api_name(args)
#

class IPC
  constructor: ->
    @data = {}

  # scope:  string
  # opts:   key-func Object
  register: (scope, opts) ->
    if not (scope? and opts?)
      console.error "Invalid scope or opts:", scope, opts
      return

    @data[scope] ?= new Object()
    @unregister(scope, Object.keys(opts))
    for key, func of opts
      @data[scope][key] = func

  # scope:  string
  # keys:   string / Array of string / key-func Object
  unregister: (scope, keys) ->
    if not (scope? and keys?)
      console.error "Invalid scope or keys:", scope, keys
      return
    return unless @data[scope]?

    if typeof keys == "string"
      keys = new Array(keys)
    if keys instanceof Object and keys not instanceof Array
      keys = Object.keys(opts)
    for key in keys
      delete @data[scope][key]

  unregisterAll: (scope) ->
    delete @data[scope]

  access: (scope) ->
    return @data[scope]

module.exports = new IPC()
