import { app } from 'electron'
import path from 'path-extra'
import fs from 'fs-extra'
import { warn } from './utils'
const { ROOT } = global

// Specify flash path, supposing it is placed in the same directory with main.js.
let pluginName, folderName
switch (process.platform) {
case 'win32':
  pluginName = 'pepflashplayer.dll'
  folderName = `win-${process.arch}`
  break
case 'darwin':
  pluginName = 'PepperFlashPlayer.plugin'
  folderName = `mac-${process.arch}`
  break
case 'linux':
  pluginName = 'libpepflashplayer.so'
  folderName = `linux-${process.arch}`
  break
}
const flashPaths = [
  app.getPath('pepperFlashSystemPlugin'),
  path.join(ROOT, '..', 'PepperFlash', folderName, pluginName),
  path.join(ROOT, 'PepperFlash', folderName, pluginName),
]
for (const flashPath of flashPaths) {
  try {
    fs.accessSync(flashPath, fs.R_OK)
    app.commandLine.appendSwitch('ppapi-flash-path', flashPath)
    break
  } catch (e) {
    warn(`Flash in ${flashPath} not found.`)
  }
}
