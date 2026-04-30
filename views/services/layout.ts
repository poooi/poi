import * as remote from '@electron/remote'
import { debounce } from 'lodash'
import { dispatch, getStore } from 'views/create-store'
import { config } from 'views/env'

import { getPoiInfoHeight, getYOffset, getRealSize } from './utils'

// polyfill
if ((config.get('poi.webview.width', 1200) as number) < 0) {
  config.set('poi.webview.width', 1200)
}

const additionalStyle = document.createElement('style')

remote.getCurrentWindow().webContents.on('dom-ready', () => {
  document.head.appendChild(additionalStyle)
})

const setCSS = () => {
  const tab =
    document.querySelector<HTMLElement>('.poi-tab-container:last-child .poi-tab-contents') ||
    document.querySelector<HTMLElement>('.poi-tab-container .poi-tab-contents')
  const tabSize = tab ? tab.getBoundingClientRect() : { height: 0, width: 0 }
  const panelRect = document.querySelector('poi-nav-tabs')!.getBoundingClientRect()
  additionalStyle.innerHTML = `
.plugin-dropdown {
  max-height: ${tabSize.height}px;
  max-width: ${Math.min(panelRect.width * 0.875 - 48, tabSize.width - 16)}px;
}
`
}

const setCSSDebounced = debounce(setCSS, 200)

const setIsolatedMainWindowSize = (isolateWindow: boolean) => {
  remote.getCurrentWindow().setMinimumSize(1, 1)
  const layout = config.get('poi.layout.mode', 'horizontal')
  const reversed = config.get('poi.layout.reverse', false)
  const { width: webviewWidth, height: webviewHeight } = getStore('layout.webview') as {
    width: number
    height: number
  }
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

const setOverlayPanelWindowSize = (overlayPanel: boolean) => {
  const layout = config.get('poi.layout.mode', 'horizontal')
  const reversed = config.get('poi.layout.reverse', false)
  const isolateWindow = config.get('poi.layout.isolate', false)
  const { width: webviewWidth, height: webviewHeight } = getStore('layout.webview') as {
    width: number
    height: number
  }
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
      bounds.width += config.get('poi.layout.overlaypanel.width', 500) as number
      if (reversed) {
        bounds.x -= config.get('poi.layout.overlaypanel.width', 500) as number
      }
    } else {
      bounds.height += config.get('poi.layout.overlaypanel.width', 500) as number
      if (reversed) {
        bounds.y -= config.get('poi.layout.overlaypanel.width', 500) as number
      }
    }
    remote.getCurrentWindow().setAspectRatio(0)
  }
  remote.getCurrentWindow().setContentBounds(bounds)
}

const handleOverlayPanelResize = () => {
  if (config.get('poi.layout.overlay', false)) {
    const width = config.get('poi.webview.useFixedResolution', true)
      ? (config.get('poi.webview.width', 1200) as number)
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

const handleOverlayPanelResizeDebounced = debounce(handleOverlayPanelResize, 200)

const adjustSize = () => {
  try {
    setCSSDebounced()
    dispatch({
      type: '@@LayoutUpdate/webview/useFixedResolution',
      value: getStore('config.poi.webview.useFixedResolution'),
    })
    handleOverlayPanelResizeDebounced()
  } catch (error) {
    console.error(error)
  }
}

adjustSize()

const changeBounds = () => {
  const webview = getStore('layout.webview') as { width: number; height: number }
  let newWidth = webview.width
  let newHeight = webview.height
  newHeight += getYOffset()
  if (config.get('poi.layout.mode', 'horizontal') === 'horizontal') {
    newWidth += 400
  } else {
    newHeight += 400
  }
  remote.getCurrentWindow().setContentSize(getRealSize(newWidth), getRealSize(newHeight))
}

window.addEventListener('game.start', adjustSize)
window.addEventListener('resize', adjustSize)

config.on('config.set', (path: string, value: unknown) => {
  switch (path) {
    case 'poi.appearance.zoom': {
      const [width, height] = remote.getCurrentWindow().getContentSize()
      remote.getCurrentWebContents().zoomFactor = Number(value)
      remote.getCurrentWindow().setContentSize(width - 10, height - 10)
      adjustSize()
      setTimeout(() => {
        remote.getCurrentWindow().setContentSize(width, height)
        const webviewRef = getStore('layout.webview.ref')
        if (webviewRef) {
          webviewRef.forceSyncZoom()
        }
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

      current.setResizable(resizable)
      current.setMaximizable(maximizable)
      current.setFullScreenable(fullscreenable)

      adjustSize()
      break
    }
    case 'poi.layout.isolate': {
      setIsolatedMainWindowSize(!!value)
      break
    }
    case 'poi.layout.overlay': {
      setOverlayPanelWindowSize(!!value)
      break
    }
    default:
      break
  }
})
