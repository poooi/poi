/* global $, config, getStore, dispatch */
import { debounce } from 'lodash'
import * as remote from '@electron/remote'

import { getPoiInfoHeight, getYOffset, getRealSize } from './utils'

// polyfill
if (config.get('poi.webview.width', 1200) < 0) {
  config.set('poi.webview.width', 1200)
}

const additionalStyle = document.createElement('style')

remote.getCurrentWindow().webContents.on('dom-ready', (e) => {
  document.head.appendChild(additionalStyle)
})

const setCSS = () => {
  const tab =
    $('.poi-tab-container:last-child .poi-tab-contents') ||
    $('.poi-tab-container .poi-tab-contents')
  const tabSize = tab ? tab.getBoundingClientRect() : { height: 0, width: 0 }
  const panelRect = $('poi-nav-tabs').getBoundingClientRect()
  // Apply css
  additionalStyle.innerHTML = `
.plugin-dropdown {
  max-height: ${tabSize.height}px;
  max-width: ${Math.min(panelRect.width * 0.875 - 48, tabSize.width - 16)}px;
}
`
}

const setCSSDebounced = debounce(setCSS, 200)

const setIsolatedMainWindowSize = (isolateWindow) => {
  remote.getCurrentWindow().setMinimumSize(1, 1)
  const layout = config.get('poi.layout.mode', 'horizontal')
  const reversed = config.get('poi.layout.reverse', false)
  const { width: webviewWidth, height: webviewHeight } = getStore('layout.webview')
  const bounds = remote.getCurrentWindow().getContentBounds()
  if (isolateWindow) {
    if (layout === 'horizontal') {
      const xdelta = getRealSize(webviewWidth)
      bounds.width -= xdelta
      if (!reversed) {
        bounds.x += xdelta
      }
    } else {
      const ydelta = getRealSize(webviewHeight + getPoiInfoHeight())
      bounds.height -= ydelta
      if (!reversed) {
        bounds.y += ydelta
      }
    }
  } else {
    if (layout === 'horizontal') {
      const xdelta = getRealSize(webviewWidth)
      bounds.width += xdelta
      if (!reversed) {
        bounds.x -= xdelta
      }
    } else {
      const ydelta = getRealSize(webviewHeight + getPoiInfoHeight())
      bounds.height += ydelta
      if (!reversed) {
        bounds.y -= ydelta
      }
    }
  }
  remote.getCurrentWindow().setContentBounds(bounds)
}

const setOverlayPanelWindowSize = (overlayPanel) => {
  const layout = config.get('poi.layout.mode', 'horizontal')
  const reversed = config.get('poi.layout.reverse', false)
  const isolateWindow = config.get('poi.layout.isolate', false)
  const { width: webviewWidth, height: webviewHeight } = getStore('layout.webview')
  const bounds = remote.getCurrentWindow().getContentBounds()
  const useFixedResolution = config.get('poi.webview.useFixedResolution', true)
  if (overlayPanel && !isolateWindow) {
    if (useFixedResolution) {
      remote.getCurrentWindow().setResizable(false)
    }
    if (layout === 'horizontal') {
      const xdelta = bounds.width - getRealSize(webviewWidth)
      config.set('poi.layout.overlaypanel.width', xdelta)
      if (reversed) {
        bounds.x += xdelta
      }
    } else {
      const ydelta = bounds.height - getRealSize(webviewHeight + getYOffset())
      config.set('poi.layout.overlaypanel.width', ydelta)
      if (reversed) {
        bounds.y += ydelta
      }
    }
    bounds.width = getRealSize(webviewWidth)
    bounds.height = getRealSize(webviewHeight + getYOffset())
    remote.getCurrentWindow().setAspectRatio(1200 / 720, {
      width: 0,
      height: getRealSize(getYOffset()),
    })
  } else if (!isolateWindow) {
    remote.getCurrentWindow().setResizable(config.get('poi.content.resizable', true))
    if (layout === 'horizontal') {
      bounds.width += config.get('poi.layout.overlaypanel.width', 500)
      if (reversed) {
        bounds.x -= config.get('poi.layout.overlaypanel.width', 500)
      }
    } else {
      bounds.height += config.get('poi.layout.overlaypanel.width', 500)
      if (reversed) {
        bounds.y -= config.get('poi.layout.overlaypanel.width', 500)
      }
    }
    remote.getCurrentWindow().setAspectRatio(0)
  }
  remote.getCurrentWindow().setContentBounds(bounds)
}

const handleOverlayPanelReszie = () => {
  if (config.get('poi.layout.overlay', false)) {
    const width = config.get('poi.webview.useFixedResolution', true)
      ? config.get('poi.webview.width', 1200)
      : remote.getCurrentWindow().getContentSize()[0]
    remote
      .getCurrentWindow()
      .setContentSize(width, Math.floor((width / 1200) * 720 + getRealSize(getYOffset())))
    if (config.get('poi.webview.useFixedResolution', true)) {
      remote.getCurrentWindow().setResizable(false)
    } else {
      remote.getCurrentWindow().setResizable(config.get('poi.content.resizable', true))
    }
  }
}

const handleOverlayPanelReszieDebounced = debounce(handleOverlayPanelReszie, 200)

const adjustSize = () => {
  try {
    // Apply calcualted data
    setCSSDebounced()
    dispatch({
      type: '@@LayoutUpdate/webview/useFixedResolution',
      value: getStore('config.poi.webview.useFixedResolution', true),
    })
    handleOverlayPanelReszieDebounced()
  } catch (error) {
    console.error(error)
  }
}

adjustSize()

const changeBounds = () => {
  let { width: newWidth, height: newHeight } = getStore('layout.webview')
  newHeight += getYOffset()
  if (config.get('poi.layout.mode', 'horizontal') === 'horizontal') {
    // Previous vertical
    newWidth += 400
  } else {
    // Previous horizontal
    newHeight += 400
  }
  remote.getCurrentWindow().setContentSize(getRealSize(newWidth), getRealSize(newHeight))
}

window.addEventListener('game.start', adjustSize)
window.addEventListener('resize', adjustSize)

config.on('config.set', (path, value) => {
  switch (path) {
    case 'poi.appearance.zoom': {
      const [width, height] = remote.getCurrentWindow().getContentSize()
      remote.getCurrentWebContents().zoomFactor = value
      // Workaround for ResizeObserver not fired on zoomFactor change
      remote.getCurrentWindow().setContentSize(width - 10, height - 10)
      adjustSize()
      setTimeout(() => {
        remote.getCurrentWindow().setContentSize(width, height)
      }, 1000)
      break
    }
    case 'poi.tabarea.double':
    case 'poi.webview.width':
    case 'poi.webview.useFixedResolution':
    case 'poi.webview.ratio.vertical':
    case 'poi.webview.ratio.horizontal':
    case 'poi.layout.reverse': {
      adjustSize()
      break
    }
    case 'poi.layout.mode': {
      const current = remote.getCurrentWindow()
      const resizable = current.isResizable()
      const maximizable = current.isMaximizable()
      const fullscreenable = current.isFullScreenable()
      current.setResizable(true)
      current.setMaximizable(true)
      current.setFullScreenable(true)

      changeBounds()
      // dispatchEvent(new Event('resize'))

      current.setResizable(resizable)
      current.setMaximizable(maximizable)
      current.setFullScreenable(fullscreenable)

      adjustSize()
      break
    }
    case 'poi.layout.isolate': {
      setIsolatedMainWindowSize(value)
      break
    }
    case 'poi.layout.overlay': {
      setOverlayPanelWindowSize(value)
      break
    }
    default:
      break
  }
})

// workaround for https://github.com/electron/electron/issues/22440
let minimumSize

const storeMinimumSize = debounce(() => {
  minimumSize = remote.getCurrentWindow().getMinimumSize()
  remote.getCurrentWindow().setMinimumSize(1, 1)
}, 200)

const restoreMinimumSize = () => {
  if (minimumSize && minimumSize.length === 2) {
    remote.getCurrentWindow().setMinimumSize(...minimumSize)
  }
}

remote.getCurrentWindow().on('minimize', storeMinimumSize)
remote.getCurrentWindow().on('maximize', storeMinimumSize)

remote.getCurrentWindow().on('restore', restoreMinimumSize)
remote.getCurrentWindow().on('unmaximize', restoreMinimumSize)
