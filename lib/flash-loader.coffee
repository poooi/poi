
pepperFlashData =
  linux:
    filename: 'libpepflashplayer.so'
    version: '20.0.0.248'
  win32:
    filename: 'pepflashplayer.dll'
    version: '20.0.0.248'
  darwin:
    filename: 'PepperFlashPlayer.plugin'
    version: '20.0.0.248'

pepperFlashData = pepperFlashData[process.platform]
innerFlashPath = path.join 'PepperFlash', process.platform, pepperFlashData.filename
defaultFlashPath = path.join EXECROOT, innerFlashPath
try
  fs.accessSync defaultFlashPath
  app.commandLine.appendSwitch 'ppapi-flash-path', defaultFlashPath
  app.commandLine.appendSwitch 'ppapi-flash-version', pepperFlashData.version
catch
  app.commandLine.appendSwitch 'ppapi-flash-path', path.join(ROOT, innerFlashPath)
  app.commandLine.appendSwitch 'ppapi-flash-version', pepperFlashData.version
