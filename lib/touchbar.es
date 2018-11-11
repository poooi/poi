import { TouchBar } from 'electron'
import config from './config'
import path from 'path-extra'

const { TouchBarButton, TouchBarSpacer, TouchBarPopover, TouchBarSegmentedControl } = TouchBar
const mainWindow = global.mainWindow
const ROOT = global.ROOT

const getIcon = name => path.join(ROOT, 'assets', 'img', 'touchbar', `${name}.png`)

// simulate Escape key
export const sendEscKey = () => {
  mainWindow.webContents.sendInputEvent({
    type: 'keyDown',
    keyCode: 'Escape',
  })
  mainWindow.webContents.sendInputEvent({
    type: 'keyUp',
    keyCode: 'Escape',
  })
}

// buttons
const devtools = new TouchBarButton({
  icon: getIcon('terminal'),
  click: () => {
    mainWindow.openDevTools({ mode: 'detach' })
  },
})

const screenshot = new TouchBarButton({
  icon: getIcon('camera-retro'),
  click: () => {
    mainWindow.webContents.send('touchbar', 'screenshot')
  },
})

const volume = new TouchBarButton({
  icon: config.get('poi.content.muted') ? getIcon('volume-off') : getIcon('volume-up'),
  click: () => {
    mainWindow.webContents.send('touchbar', 'volume')
  },
})

const cachedir = new TouchBarButton({
  icon: getIcon('bolt'),
  click: () => {
    mainWindow.webContents.send('touchbar', 'cachedir')
  },
})

const screenshotdir = new TouchBarButton({
  icon: getIcon('photo'),
  click: () => {
    mainWindow.webContents.send('touchbar', 'screenshotdir')
  },
})

const adjust = new TouchBarButton({
  icon: getIcon('arrows-alt'),
  click: () => {
    mainWindow.webContents.send('touchbar', 'adjust')
  },
})

const refresh = new TouchBarButton({
  icon: getIcon('refresh'),
  click: () => {
    mainWindow.webContents.send('touchbar', 'refresh')
  },
})

const edit = new TouchBarButton({
  icon: config.get('poi.layout.editable') ? getIcon('pen-square') : getIcon('edit'),
  click: () => {
    mainWindow.webContents.send('touchbar', 'edit')
  },
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
  items: [devtools, screenshot, volume, cachedir, screenshotdir, adjust, edit, refresh],
  icon: getIcon('angle-right'),
})

//tab-switching
const segments = [
  {
    label: '     ',
    enabled: false,
  },
  {
    label: '     ',
    enabled: false,
  },
  {
    label: '     ',
    enabled: false,
  },
]

const tabs = new TouchBarSegmentedControl({
  segmentStyle: 'automatic',
  segments: segments,
  selectedIndex: 0,
  change: selectedIndex => {
    mainWindow.webContents.send('touchbartab', selectedIndex)
  },
})

//confirmation modal
export const toggleRefreshConfirm = (btn1, btn2) => {
  mainWindow.setTouchBar(
    new TouchBar({
      items: [
        new TouchBarSpacer({ size: 'flexible' }),
        new TouchBarButton({
          label: btn1,
          backgroundColor: '#E08E0B',
          click: () => {
            mainWindow.webContents.send('touchbar', 'gameRefreshPage')
            sendEscKey()
          },
        }),
        new TouchBarButton({
          label: btn2,
          backgroundColor: '#E43725',
          click: () => {
            mainWindow.webContents.send('touchbar', 'gameReload')
            sendEscKey()
          },
        }),
        new TouchBarSpacer({ size: 'flexible' }),
      ],
    }),
  )
}

//main-touchbar
const mainTouchbar = new TouchBar({
  items: [devtools, screenshot, volume, popover, spacer, tabs, spacer, refresh],
  escapeItem: poibutton,
})

//Change Volume or Edit btn
export const updateTouchbarInfoIcons = () => {
  edit.icon = config.get('poi.layout.editable') ? getIcon('pen-square') : getIcon('edit')
  volume.icon = config.get('poi.content.muted') ? getIcon('volume-off') : getIcon('volume-up')
}

//Tab switching initialization
export const updateMainTouchbar = (
  mainTitle,
  fleetTitle,
  pluginTitle,
  activeTab,
  pluginDefault,
) => {
  //Get tab display name
  //lock plugin when no plugins enabled
  if (pluginTitle != segments[2].label) {
    segments.forEach(x => {
      x.label = [mainTitle, fleetTitle, pluginTitle][segments.indexOf(x)]
      x.enabled = x.label != pluginDefault ? true : false
    })
    renderMainTouchbar()
  }
  //Update active tab if necessary
  let tabIndex
  switch (activeTab) {
    case 'main-view':
      tabIndex = 0
      break
    case 'ship-view':
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
    renderMainTouchbar()
  }
}
//Touchbar reset
export const renderMainTouchbar = () => {
  mainWindow.setTouchBar(mainTouchbar)
}
