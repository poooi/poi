/* eslint-disable @typescript-eslint/no-namespace */
import path from 'path'
import { app, Tray, systemPreferences, nativeTheme } from 'electron'

declare global {
  namespace NodeJS {
    interface Global {
      appTray: Tray
    }
  }
}

const getIcon = (platform: NodeJS.Platform) => {
  if (platform === 'linux') {
    return 'poi_32x32.png'
  }
  if (platform === 'darwin') {
    if (nativeTheme.shouldUseDarkColors) {
      return 'poi_ribbon_dark.png'
    }
    return 'poi_ribbon_light.png'
  }
  return 'poi.ico'
}

const getIconPath = (platform: NodeJS.Platform) =>
  path.join(global.ROOT, 'assets', 'icons', getIcon(platform))

let tray: Tray | null = null
app.on('ready', () => {
  tray = new Tray(getIconPath(process.platform))
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

if (process.platform === 'darwin') {
  systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () => {
    tray?.setImage(getIconPath(process.platform))
  })
}
