{app} = require 'electron'
path = require 'path-extra'
fs = require 'fs-extra'

platform = process.platform
filename = switch platform
  when 'darwin' then 'PepperFlashPlayer.plugin'
  when 'linux'  then 'libpepflashplayer.so'
  when 'win32'  then 'pepflashplayer.dll'
innerPath = path.join 'PepperFlash', platform, filename
try
  flashPath = path.join EXECROOT, innerPath
  fs.accessSync flashPath
catch
  flashPath = path.join ROOT, innerPath
dbg.extra('flashLoader').log "Loading flash player from:"
dbg.extra('flashLoader').log flashPath
app.commandLine.appendSwitch 'ppapi-flash-path', flashPath
