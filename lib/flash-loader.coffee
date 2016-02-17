{app} = require 'electron'
{join} = require 'path-extra'
fs = require 'fs-extra'

platform = process.platform
filename = switch platform
  when 'darwin' then 'PepperFlashPlayer.plugin'
  when 'linux'  then 'libpepflashplayer.so'
  when 'win32'  then 'pepflashplayer.dll'
innerPath = join 'PepperFlash', platform, filename

validatePath = (p) ->
  return false if not p.endsWith filename
  try
    fs.accessSync p
  catch
    return false
  true

builtInPath = join EXECROOT, innerPath
builtInPath = join ROOT, innerPath if not validatePath builtInPath

findChromeFlashPath = ->
  switch platform
    when 'darwin'
      # "/Applications/Google Chrome.app/Contents/Versions/48.0.2564.109/Google Chrome Framework.framework/Internet Plug-Ins/PepperFlash/PepperFlashPlayer.plugin/Contents/Info.plist"
      try
        chromeVersionsDir = '/Applications/Google Chrome.app/Contents/Versions'
        chromeVersions = fs.readdirSync chromeVersionsDir
        return '' if chromeVersions.length is 0
        chromeVer = chromeVersions[1] # TODO
        chromeFlashPath = join chromeVersionsDir, chromeVer,
          'Google Chrome Framework.framework/Internet Plug-Ins/PepperFlash/PepperFlashPlayer.plugin'
        fs.accessSync chromeFlashPath
        chromeFlashPath
      catch
        ''
    when 'linux' then ''  # TODO
    when 'win32' then ''  # TODO

parseCLIArg = (arg) ->
  # --flash=useChrome
  # --flash-path=/Applications/Google\ Chrome.app/Contents/Versions/48.0.2564.109/Google\ Chrome\ Framework.framework/Internet\ Plug-Ins/PepperFlash/PepperFlashPlayer.plugin

getPath = ->
  chromeFlashPath = findChromeFlashPath()
  return chromeFlashPath if validatePath chromeFlashPath
  builtInPath

load = ->
  flashPath = getPath()
  dbg.extra('flashLoader').assert validatePath(flashPath), ''
  dbg.ex.flashLoader.log "Loading flash player from:"
  dbg.ex.flashLoader.log flashPath
  app.commandLine.appendSwitch 'ppapi-flash-path', flashPath


exports.parseCLIArg = ->
exports.getFlashPlayerVersion = (flashPlayerPath) ->
exports.loadFlashPlayer = load
