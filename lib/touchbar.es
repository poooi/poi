import { TouchBar } from 'electron'
import config from './config'
import path from 'path-extra'

const { TouchBarButton, TouchBarSpacer, TouchBarPopover, TouchBarSegmentedControl } = TouchBar
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
  icon: path.join(ROOT, 'assets', 'img', 'touchbar', 'terminal.png'),
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
const edit = new TouchBarButton ({
  icon: config.get('poi.layouteditable') ? path.join(ROOT, 'assets', 'img', 'touchbar', 'pen-square.png') : path.join(ROOT, 'assets', 'img', 'touchbar', 'edit.png'),
  click: () => {mainWindow.webContents.send('touchbar','edit')},
})
// poi esc
const poibutton = new TouchBarButton({
  icon: path.join(ROOT, 'assets', 'icons', 'poi_36x36.png'),
  backgroundColor: '#000000',
})
//spacer
const spacer = new TouchBarSpacer({
  size: 'flexible',
})
//popover
const popover = new TouchBarPopover({
  items: [
    devtools,
    screenshot,
    volume,
    cachedir,
    screenshotdir,
    adjust,
    edit,
    refresh,
  ],
  icon: path.join(ROOT,'assets', 'img', 'touchbar', 'angle-right.png'),
})
//tab-switching
const segments = [{
  label: '     ',
  enabled: false,
}, {
  label: '     ',
  enabled: false,
}, {
  label: '     ',
  enabled: false,
}]
const tabs = new TouchBarSegmentedControl({
  segmentStyle: 'automatic',
  segments: segments,
  selectedIndex: 0,
  change: (selectedIndex) => {mainWindow.webContents.send('touchbartab', selectedIndex)},
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
    popover,
    spacer,
    tabs,
    spacer,
    refresh,
  ],
  escapeItem: poibutton,
})
//Change Volume or Edit btn
export const touchBarReInit = (e) => {
  edit.icon = config.get('poi.layouteditable') ?
    path.join(ROOT, 'assets', 'img', 'touchbar', 'pen-square.png') :
    path.join(ROOT, 'assets', 'img', 'touchbar', 'edit.png')
  volume.icon = config.get('poi.content.muted') ?
    path.join(ROOT, 'assets', 'img', 'touchbar', 'volume-off.png') :
    path.join(ROOT, 'assets', 'img', 'touchbar', 'volume-up.png')
}

//Tab switching initialization
export const touchBarTabinit = (mainTitle, fleetTitle, pluginTitle, activeTab, pluginDefault) => {
  //Get tab display name
  //lock plugin when no plugins enabled
  if (pluginTitle != segments[2].label){
    segments.map( x => {
      x.label = [mainTitle, fleetTitle, pluginTitle][segments.indexOf(x)]
      x.enabled = x.label != pluginDefault? true : false
    })
    touchBarReset()
  }
  //Update active tab if necessary
  let tabIndex
  switch (activeTab){
  case 'mainView':
    tabIndex = 0
    break
  case 'shipView':
    tabIndex = 1
    break
  case 'settings':
    tabIndex = -1
    break
  default:
    tabIndex = 2
    break
  }
  if (tabs.selectedIndex != tabIndex) {
    tabs.selectedIndex = tabIndex
    touchBarReset()
  }
}
//Touchbar reset
export const touchBarReset = () => {mainWindow.setTouchBar(touchBar)}
