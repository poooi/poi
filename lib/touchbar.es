import { TouchBar } from 'electron'
import config from './config'
import path from 'path-extra'

const { TouchBarButton, TouchBarSpacer } = TouchBar
const mainWindow = global.mainWindow
const ROOT = global.ROOT

// simulate Escape key
export const touchbaresc = () => {
  mainWindow.webContents.sendInputEvent({
    type: "keyDown",
    keyCode: 'Escape',
  }),
  mainWindow.webContents.sendInputEvent({
    type: "keyUp",
    keyCode: 'Escape',
  })
}
// buttons
const devtools = new TouchBarButton({
  icon: path.join(ROOT, 'assets', 'img', 'touchbar', 'gears.png'),
  click: () => {mainWindow.openDevTools({mode: 'detach'})},
})
const screenshot = new TouchBarButton({
  icon: path.join(ROOT, 'assets', 'img', 'touchbar', 'camera-retro.png'),
  click: () => {mainWindow.webContents.send('touchbar','screenshot')},
})
const volume = new TouchBarButton({
  icon: config.get('poi.content.muted') ? path.join(ROOT, 'assets', 'img', 'touchbar', 'volume-off.png') : path.join(ROOT, 'assets', 'img', 'touchbar', 'volume-up.png'),
  click: () => {mainWindow.webContents.send('touchbar','volume')},
})
const cachedir = new TouchBarButton({
  icon: path.join(ROOT, 'assets', 'img', 'touchbar', 'bolt.png'),
  click: () => {mainWindow.webContents.send('touchbar','cachedir')},
})
const screenshotdir = new TouchBarButton({
  icon: path.join(ROOT, 'assets', 'img', 'touchbar', 'photo.png'),
  click: () => {mainWindow.webContents.send('touchbar','screenshotdir')},
})
const adjust = new TouchBarButton({
  icon: path.join(ROOT, 'assets', 'img', 'touchbar', 'arrows-alt.png'),
  click: () => {mainWindow.webContents.send('touchbar','adjust')},
})
const refresh = new TouchBarButton({
  icon: path.join(ROOT, 'assets', 'img', 'touchbar', 'refresh.png'),
  click: () => {mainWindow.webContents.send('touchbar','refresh')},
})
// poi esc
const poibutton = new TouchBarButton({
  icon: path.join(ROOT, 'assets', 'icons', 'poi_36x36.png'),
  backgroundColor: '#000000',
})
//confirmation modal
export const refreshconfirm = (btn1,btn2) => {
  mainWindow.setTouchBar(
    new TouchBar({
      items:[
        new TouchBarSpacer({size: 'flexible'}),
        new TouchBarButton({
          label: btn1,
          backgroundColor: '#E08E0B',
          click: () => {
            mainWindow.webContents.send('touchbar','gameRefreshPage')
            touchbaresc()
          },
        }),
        new TouchBarButton({
          label: btn2,
          backgroundColor: '#E43725',
          click: () => {
            mainWindow.webContents.send('touchbar','gameReloadFlash')
            touchbaresc()
          },
        }),
        new TouchBarSpacer({size: 'flexible'}),
      ],
    })
  )
}
//main-touchbar
export const touchBar = new TouchBar({
  items: [
    devtools,
    screenshot,
    volume,
    cachedir,
    screenshotdir,
    adjust,
    refresh,
  ],
  escapeItem: poibutton,
})
//Change Volume btn
export const touchBarReInit = () => {
  volume.icon = config.get('poi.content.muted') ? path.join(ROOT, 'assets', 'img', 'touchbar', 'volume-off.png') : path.join(ROOT, 'assets', 'img', 'touchbar', 'volume-up.png')
}
//Touchbar reset
export const touchBarReset = () => {mainWindow.setTouchBar(touchBar)}
