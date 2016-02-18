{app} = require 'electron'
{join} = require 'path-extra'
fs = require 'fs-extra'

platform = process.platform
filename = switch platform
  when 'darwin' then 'PepperFlashPlayer.plugin'
  when 'linux'  then 'libpepflashplayer.so'
  when 'win32'  then 'pepflashplayer.dll'
innerPath = join 'PepperFlash', platform, filename

validatePath = (path) ->
  return false if typeof path isnt 'string' or not path.endsWith filename
  try
    fs.accessSync path
  catch
    return false
  true

builtInPath = join EXECROOT, innerPath if EXECROOT?
builtInPath = join ROOT, innerPath if not validatePath builtInPath

reVerNum = /(\d+)\.(\d+)\.(\d+)\.(\d+)/
getNewerVersion = (ver1, ver2) ->
  v1 = reVerNum.exec ver1
  v2 = reVerNum.exec ver2
  if not v1
    return if v2 then ver2 else ''
  for i in [1..4]
    continue if v1[i] == v2[i]
    return if parseInt(v1[i]) > parseInt(v2[i]) then ver1 else ver2

findChromeFlashPath = ->
  # Refer to: https://helpx.adobe.com/flash-player/kb/flash-player-google-chrome.html
  switch platform
    when 'darwin'
      try
        # Usually there are 2 directories under the 'Versions' directory,
        # all named after their respective Google Chrome version number.
        # Find the newest version of Google Chrome
        # and use its built-in Pepper Flash Player plugin.
        chromeVersionsDir = '/Applications/Google Chrome.app/Contents/Versions'
        chromeVersions = fs.readdirSync chromeVersionsDir
        return '' if chromeVersions.length is 0 # Broken Chrome...
        chromeVer = chromeVersions.reduce getNewerVersion
        chromeFlashPath = join chromeVersionsDir, chromeVer,
          'Google Chrome Framework.framework/Internet Plug-Ins/PepperFlash/PepperFlashPlayer.plugin'
        fs.accessSync chromeFlashPath
        chromeFlashPath
      catch
        ''
    when 'linux' then ''  # TODO
    when 'win32' then ''  # TODO

getFlashVersion = (path) ->
  return '' if not validatePath path
  switch platform
    when 'darwin'
      # The version info is in the Info.plist inside PepperFlashPlayer.plugin
      plistPath = join path, 'Contents', 'Info.plist'
      plistContent = fs.readFileSync(plistPath, 'utf8')
      match = /<key>CFBundleVersion<\/key>\s*<string>(\d+(?:\.\d+)*)<\/string>/.exec plistContent
      if match and match.length > 1 then match[1] else ''
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
exports.getFlashPlayerVersion = getFlashVersion
exports.loadFlashPlayer = load
