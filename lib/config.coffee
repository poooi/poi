Promise = require 'bluebird'
path = require 'path-extra'
fs = require 'fs-extra'
{log, warn, error} = require './utils'

{ROOT} = global

config = {}
# Read saved config
try
  fs.accessSync path.join(ROOT, 'config.json'), fs.R_OK | fs.W_OK
  config = fs.readJsonSync path.join(ROOT, 'config.json')
catch e
  warn e

module.exports =
  get: (path, value) ->
    path = path.split('.').filter (p) -> p != ''
    cur = config
    for p in path
      cur = cur?[p]
    cur || value
  set: (path, value) ->
    path = path.split('.').filter (p) -> p != ''
    cur = config
    len = path.length
    for p, i in path
      if i != len - 1
        cur[p] = {} if typeof cur[p] != 'object'
        cur = cur[p]
      else
        cur[p] = value
