{app} = require 'electron'
{join} = require 'path-extra'
fs = require 'fs-extra'
{error} = require './utils'

PLATFORM = process.platform
FILENAME = switch PLATFORM
  when 'darwin' then 'PepperFlashPlayer.plugin'
  when 'linux'  then 'libpepflashplayer.so'
  when 'win32'  then 'pepflashplayer.dll'
INNER_PATH = join 'PepperFlash', PLATFORM, FILENAME

validatePath = (path) ->
  return false if typeof path isnt 'string' or not path.endsWith FILENAME
  try
    fs.accessSync path
  catch
    return false
  true

getBuiltInFlashPath = ->
  builtInPath = join EXECROOT, INNER_PATH if EXECROOT?
  builtInPath = join ROOT, INNER_PATH if not validatePath builtInPath
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
  switch PLATFORM
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
    when 'win32'
      try
        chromeVersionsDir = join app.getPath('appData'), 'Local', 'Google', 'Chrome', 'Application'
        chromeVersions = fs.readdirSync chromeVersionsDir
        return null if chromeVersions.length is 0 # Broken Chrome...
        chromeVer = chromeVersions.reduce getNewerVersion
        chromeFlashPath = join chromeVersionsDir, chromeVer, 'PepperFlash', FILENAME
        fs.accessSync chromeFlashPath
        chromeFlashPath
      catch
        null
    else null

findSystemFlashPath = ->
  # Download/install from: https://get.adobe.com/flashplayer/otherversions/
  switch PLATFORM
    when 'darwin'
      try
        systemFlashPath = '/Library/Internet Plug-Ins/PepperFlashPlayer/PepperFlashPlayer.plugin'
        fs.accessSync systemFlashPath
        systemFlashPath
      catch
        null
    else null

getFlashVersion = (path) ->
  dbg.ex.flashLoader?.assert path, 'No flash player path passed in!'
  return '' if not validatePath path
  switch PLATFORM
    when 'darwin'
      # The version info is in the Info.plist inside PepperFlashPlayer.plugin
      plistPath = join path, 'Contents', 'Info.plist'
      plistContent = fs.readFileSync(plistPath, 'utf8')
      match = /<key>CFBundleVersion<\/key>\s*<string>(\d+(?:\.\d+)*)<\/string>/.exec plistContent
      if match and match.length > 1 then match[1] else ''
    else ''

class FlashPlayerVersions
  constructor: (builtInFlashPath, chromeFlashPath, systemFlashPath) ->
    @builtin = getFlashVersion builtInFlashPath if builtInFlashPath?
    @chrome = getFlashVersion chromeFlashPath if chromeFlashPath?
    @system = getFlashVersion systemFlashPath if systemFlashPath?

getAllVersions = ->
  new FlashPlayerVersions getBuiltInFlashPath(), findChromeFlashPath(), findSystemFlashPath()

useFlashLoc = 'auto'
CLIFlashPath = ''
reCLIArg = /^--flash=(.+)$/i
parseCLIArg = (arg) ->
  if (m = reCLIArg.exec arg)?
    value = m[1]
    if value.startsWith '@'
      useFlashLoc = value.slice 1
    else
      useFlashLoc = 'cli'
      CLIFlashPath = value
  m?

getPath = (loc = 'auto') ->
  # The order of detecting Pepper Flash Player:
  # 1. If '@builtin'/'@chrome'/'@system'/[a file path] is passed from CLI,
  #    try to find flash player from the specified location.
  # 2. If 1 failed, or '@auto' or nothing is passed from CLI (i.e., auto-detection),
  #    try to find built-in flash player.
  # 3. If 2 failed, try to find Google Chrome integrated flash player.
  # 4. If 3 failed, try to find globally installed flash player.
  switch loc.toLowerCase()
    when 'auto'
      flashPath = getBuiltInFlashPath()
      flashPath ?= findChromeFlashPath()
      flashPath ?= findSystemFlashPath()
      error 'No installed Pepper Flash Player found' if not flashPath?
      return flashPath
    when 'builtin'
      flashPath = getBuiltInFlashPath()
      errMsg = 'Could not load built-in Pepper Flash Player'
    when 'chrome'
      flashPath = findChromeFlashPath()
      errMsg = 'Could not load Chrome Pepper Flash Player'
    when 'system'
      flashPath = findSystemFlashPath()
      errMsg = 'Could not load system Pepper Flash Player plug-in'
    when 'cli'
      flashPath = CLIFlashPath if validatePath CLIFlashPath
      errMsg = "Invalid path to '#{FILENAME}': \n#{CLIFlashPath}"
    else
      errMsg = "Invalid Pepper Flash Player location: '@#{loc}'."
  if not flashPath?
    error errMsg
    dbg.ex.flashLoader?.log 'Falling back to auto-detection'
    flashPath = getPath()
  flashPath

load = ->
  flashPath = getPath useFlashLoc
  if flashPath?
    dbg.ex.flashLoader?.log "Loading Pepper Flash Player from:"
    dbg.ex.flashLoader?.log flashPath
    app.commandLine.appendSwitch 'ppapi-flash-path', flashPath
    # Note: the 'ppapi-flash-version' switch is used by Google Chrome to decide
    # which flash player to load (it'll choose the newest one), and dioplay in
    # the 'chrome://version', 'chrome://plugins', 'chrome://flash' pages.
    # But it's useless here, so we just ignore it.

if process.type is 'browser'
  exports.parseCLIArg = parseCLIArg
  exports.load = load

exports.getFlashVersion = getFlashVersion
exports.getAllVersions = getAllVersions
