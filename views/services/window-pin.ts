import type { RootState } from 'views/redux/reducer-factory'

import * as remote from '@electron/remote'
import { observer, observe } from 'redux-observers'
import { store, getStore } from 'views/create-store'
import { config } from 'views/env'

const currentWindow = remote.getCurrentWindow()

// Handle parent-child relationship for pinned plugin windows
const pinConfigObserver = observer(
  (state: RootState) => state.config?.poi?.plugin?.pin,
  (dispatch, current) => {
    if (!current) return
    remote.BrowserWindow.getAllWindows().forEach((win) => {
      const pluginId = win.webContents.getURL().split('?').pop()
      if (pluginId) {
        if (current[pluginId] && !win.getParentWindow()) {
          // Pin the window
          win.setParentWindow(currentWindow)
          win.setResizable(false)
          win.setMovable(false)
          win.setMinimizable(false)
          win.setMaximizable(false)
          win.setClosable(false)
        } else if (!current[pluginId] && win.getParentWindow()?.id === currentWindow.id) {
          // Unpin the window
          win.setParentWindow(null)
          win.setMovable(true)
          win.setMinimizable(true)
          if (pluginId === 'kangame') {
            const windowUseFixedResolution = config.get('poi.webview.windowUseFixedResolution')
            win.setResizable(!windowUseFixedResolution)
            win.setMaximizable(!windowUseFixedResolution)
            win.setClosable(false)
          } else {
            // For non-kangame plugins, allow resizing and maximizing after unpinning
            win.setResizable(true)
            win.setMaximizable(true)
            win.setClosable(true)
          }
        }
      }
    })
  },
)
observe(store, [pinConfigObserver])

// Handle window movement for pinned plugin windows
currentWindow.on('move', () => {
  const pinConfig = getStore('config.poi.plugin.pin')
  if (!pinConfig) return
  remote.BrowserWindow.getAllWindows().forEach((win) => {
    const pluginId = win.webContents.getURL().split('?').pop()
    if (pluginId && pinConfig[pluginId] && win.getParentWindow()?.id === currentWindow.id) {
      const bounds = currentWindow.getBounds()
      const delta = pinConfig[pluginId]
      win.setBounds({
        x: bounds.x + delta.deltaX,
        y: bounds.y + delta.deltaY,
        width: delta.width,
        height: delta.height,
      })
    }
  })
})
