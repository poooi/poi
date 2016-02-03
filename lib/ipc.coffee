#
# ipc: Inter-Plugins Call
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
  foreachCall: (key, args...) ->
    for scope, apis of @data
      if apis.hasOwnProperty(key)
        apis[key].apply(null, args)
    return

module.exports = new IPC()
