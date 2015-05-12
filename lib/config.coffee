Promise = require 'bluebird'
path = require 'path'
fs = require 'fs-extra'
{log, warn, error} = require './utils'

{ROOT} = global

config = {}
configPath = path.join(ROOT, 'config.json')

# Read saved config
try
  fs.accessSync configPath, fs.R_OK | fs.W_OK
  config = fs.readJsonSync configPath
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
    # Save to file
    try
      fs.accessSync configPath, fs.R_OK | fs.W_OK
      fs.writeJsonSync configPath, config
    catch e
      warn e
