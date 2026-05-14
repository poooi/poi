import { app, nativeImage, Tray } from 'electron'
import path from 'path'

/* eslint-disable no-var */
declare global {
  var appTray: Tray
}
/* eslint-enable no-var */

const getIcon = (platform: NodeJS.Platform) => {
  if (platform === 'linux') {
    return 'poi_32x32.png'
  }
  if (platform === 'darwin') {
    return 'poi_ribbon_light.png'
  }
  return 'poi.ico'
}

const getIconPath = (platform: NodeJS.Platform) =>
  path.join(global.ROOT, 'assets', 'icons', getIcon(platform))

let tray: Tray | null = null
app.on('ready', () => {
  const iconPath = getIconPath(process.platform)
  tray = new Tray(iconPath)
  if (process.platform === 'darwin') {
    const icon = nativeImage.createFromPath(iconPath)
    icon.setTemplateImage(true)
    tray.setImage(icon)
  }
  global.appTray = tray
  tray.on('click', () => {
    if (global.mainWindow?.isMinimized()) {
      global.mainWindow.restore()
    } else {
      global.mainWindow?.show()
    }
  })
  tray.setToolTip(app.getName())
})
