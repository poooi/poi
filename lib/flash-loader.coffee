{app} = require 'electron'
{join} = require 'path-extra'
fs = require 'fs-extra'
{warn, error} = require './utils'

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

getBuiltInFlashPath = ->
  builtInPath = join EXECROOT, innerPath if EXECROOT?
  builtInPath = join ROOT, innerPath if not validatePath builtInPath
  if validatePath builtInPath then builtInPath else null

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
        return null if chromeVersions.length is 0 # Broken Chrome...
        chromeVer = chromeVersions.reduce getNewerVersion
        chromeFlashPath = join chromeVersionsDir, chromeVer,
          'Google Chrome Framework.framework/Internet Plug-Ins/PepperFlash/PepperFlashPlayer.plugin'
        fs.accessSync chromeFlashPath
        chromeFlashPath
      catch
        null
    when 'linux' then null  # TODO
    when 'win32' then null  # TODO

findSystemFlashPath = ->
  # Download/install from: https://get.adobe.com/flashplayer/otherversions/
  switch platform
    when 'darwin'
      try
        systemFlashPath = '/Library/Internet Plug-Ins/PepperFlashPlayer/PepperFlashPlayer.plugin'
        fs.accessSync systemFlashPath
        systemFlashPath
      catch
        null
    when 'linux' then null  # TODO
    when 'win32' then null  # TODO

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

class FlashPlayerVersions
  constructor: (builtInFlashPath, chromeFlashPath, systemFlashPath) ->
    @builtin = getFlashVersion builtInFlashPath if builtInFlashPath?
    @chrome = getFlashVersion chromeFlashPath if chromeFlashPath?
    @system = getFlashVersion systemFlashPath if systemFlashPath?

getAllVersions = ->
  new FlashPlayerVersions getBuiltInFlashPath(), findChromeFlashPath(), findSystemFlashPath()

useFlashLoc = 'auto'
CLIFlashPath = ''
reCLIArg = /^--flash-player=(.+)$/i
reUseSpecialPath = /^@(auto|builtin|chrome|system)$/i
parseCLIArg = (arg) ->
  if (m = reCLIArg.exec arg)?
    value = m[1]
    if value.startsWith '@'
      if (m = reUseSpecialPath.exec value)?
        useFlashLoc = m[1]
      else
        error "Invalid flash player location: '#{value}'."
        error "Use one of [@auto, @builtin, @chrome, @system], \
          or the path to your '#{filename}'"
    else
      useFlashLoc = 'cli'
      CLIFlashPath = value
    true
  else
    false

getPath = (loc = useFlashLoc) ->
  switch loc
    when 'auto'
      flashPath = getBuiltInFlashPath()
      flashPath ?= findChromeFlashPath()
      flashPath ?= findSystemFlashPath()
      return flashPath
    when 'builtin'
      flashPath = getBuiltInFlashPath()
      error 'Could not load built-in Pepper Flash Player'
    when 'chrome'
      flashPath = findChromeFlashPath()
      error 'Could not load Chrome Pepper Flash Player'
    when 'system'
      flashPath = findSystemFlashPath()
      error 'Could not load system Pepper Flash Player plug-in'
    when 'cli'
      if validatePath CLIFlashPath
        flashPath = CLIFlashPath
      else
        error "Invalid path to '#{filename}': \n#{CLIFlashPath}"
  dbg.ex.flashLoader?.log 'Fall back to auto-detection'
  flashPath ?= getPath 'auto'
  flashPath

load = ->
  flashPath = getPath()
  if flashPath?
    dbg.ex.flashLoader?.log "Loading Pepper Flash Player from:"
    dbg.ex.flashLoader?.log flashPath
    app.commandLine.appendSwitch 'ppapi-flash-path', flashPath
  else
    error 'No installed Pepper Flash Player found'


exports.parseCLIArg = parseCLIArg
exports.loadFlashPlayer = load
exports.getFlashPlayerVersion = getFlashVersion
exports.getAllVersions = getAllVersions
