Promise = require 'bluebird'
async = Promise.coroutine

{log, warn, error} = require './lib/utils'
{buildAsync, buildLocalAsync} = require './build_detail'

#(async -> 
#   yield buildLocalAsync('v4.2.1', '0.34.0')
#   log "All set."
#)()

(async -> 
   yield buildAsync('4.2.2', '0.34.0', [['win32', 'x64'], ['linux', 'x64']])
)()
