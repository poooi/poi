import { TouchBar } from 'electron'
import config from './config'
import path from 'path-extra'

const { TouchBarButton, TouchBarSpacer, TouchBarSegmentedControl } = TouchBar
const mainWindow = global.mainWindow
const ROOT = global.ROOT

const getIcon = (name) => path.join(ROOT, 'assets', 'img', 'touchbar', `${name}.png`)

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
  icon: getIcon('console'),
  click: () => {
    mainWindow.openDevTools({ mode: 'detach' })
  },
})

const screenshot = new TouchBarButton({
  icon: getIcon('camera'),
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
  icon: getIcon('social-media'),
  click: () => {
    mainWindow.webContents.send('touchbar', 'cachedir')
  },
})

const screenshotdir = new TouchBarButton({
  icon: getIcon('media'),
  click: () => {
    mainWindow.webContents.send('touchbar', 'screenshotdir')
  },
})

const adjust = new TouchBarButton({
  icon: getIcon('fullscreen'),
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
  icon: config.get('poi.layout.editable') ? getIcon('unlock') : getIcon('lock'),
  click: () => {
    mainWindow.webContents.send('touchbar', 'edit')
  },
})

// poi esc
const poibutton = new TouchBarButton({
  icon: path.join(ROOT, 'assets', 'icons', 'poi_36x36.png'),
  backgroundColor: '#000000',
})

// spacer
const spacer1 = new TouchBarSpacer({
  size: 'flexible',
})

const spacer2 = new TouchBarSpacer({
  size: 'flexible',
})

//popover
//touchBar popover is not working for electron 11 at the moment, refer: https://github.com/electron/electron/issues/26615
//const popover = new TouchBarPopover({
//  items: [devtools, screenshot, volume, cachedir, screenshotdir, adjust, edit, refresh],
//  icon: getIcon('angle-right'),
//})

const openPopover = new TouchBarButton({
  icon: getIcon('angle-right'),
  click: () => {
    mainWindow.setTouchBar(popoverTouchbar)
  },
})

const closePopover = new TouchBarButton({
  icon: getIcon('angle-left'),
  click: () => {
    renderMainTouchbar()
  },
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
  change: (selectedIndex) => {
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
  items: [devtools, screenshot, volume, openPopover, spacer1, tabs, spacer2, refresh],
  escapeItem: poibutton,
})

const popoverTouchbar = new TouchBar({
  items: [devtools, screenshot, volume, cachedir, screenshotdir, adjust, edit, closePopover],
  escapeItem: poibutton,
})

//Change Volume or Edit btn
export const updateTouchbarInfoIcons = () => {
  edit.icon = config.get('poi.layout.editable') ? getIcon('unlock') : getIcon('lock')
  volume.icon = config.get('poi.content.muted') ? getIcon('volume-off') : getIcon('volume-up')
  //TouchBar icon will not auto update on recent macOS
  renderMainTouchbar()
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
    segments.forEach((x) => {
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
