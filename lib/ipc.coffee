#
# ipc: Inter-Plugins Call
#
# Any function passed to `register` will be run asynchronous.
# Be careful of your `this.
#
# Usage:
#   remote = require('electron').remote
#   ipc = remote.require('./lib/ipc')
#
#   ipc.register("scope_name", {
#     api_name:   @ref_to_function
#     api_name2:  @ref_to_function_2
#   })
#
#   ipc.unregister("scope_name", "api_name")
#   ipc.unregister("scope_name", ["api_name", "api_name_2"])
#   ipc.unregister("scope_name", {
#     api_name:   @whatever
#     api_name_2: @whatever
#   })
#
#   ipc.unregisterAll("scope_name")
#
#   scope = ipc.access("scope_name")
#   scope?.api_name?(args)
#
#   ipc.foreach("api_name", arg1, arg2, ...)
#

class IPC
  constructor: ->
    @data = new Object()

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
    return

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
    return

  unregisterAll: (scope) ->
    delete @data[scope]

  access: (scope) ->
    return @data[scope]

  # key:    string
  # args:   arguments passing to api
  foreach: (key, args...) ->
    for scope, apis of @data
      if apis.hasOwnProperty(key)
        apis[key].apply(null, args)
    return

module.exports = new IPC()
