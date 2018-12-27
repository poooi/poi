import path from 'path'
import { app, Tray, systemPreferences } from 'electron'

const getIcon = platform => {
  if (platform === 'linux') {
    return 'poi_32x32.png'
  }
  if (platform === 'darwin') {
    if (systemPreferences.isDarkMode()) {
      return 'poi_ribbon_dark.png'
    }
    return 'poi_ribbon_light.png'
  }
  return 'poi.ico'
}

const getIconPath = platform => path.join(global.ROOT, 'assets', 'icons', getIcon(platform))

let tray = null
app.on('ready', () => {
  global.appTray = tray = new Tray(getIconPath(process.platform))
  tray.on('click', () => {
    if (global.mainWindow?.isMinimized()) {
      global.mainWindow.restore()
    } else {
      global.mainWindow?.show()
    }
  })
  tray.setToolTip(app.getName())
})

if (process.platform === 'darwin') {
  systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () => {
    tray?.setImage(getIconPath(process.platform))
  })
}
