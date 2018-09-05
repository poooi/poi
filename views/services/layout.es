/* global $, config*/
import { debounce } from 'lodash'
import { remote } from 'electron'

import { getPoiInfoHeight, getYOffset, getRealSize, getZoomedSize } from './utils'

// polyfill
if (config.get('poi.webview.width', 1200) < 0) {
  config.set('poi.webview.width', 1200)
}

const additionalStyle = document.createElement('style')

remote.getCurrentWindow().webContents.on('dom-ready', (e) => {
  document.head.appendChild(additionalStyle)
  setMinSize()
})

const setCSS = () => {
  const tab = $('.poi-tab-container:last-child .poi-tab-contents') || $('.poi-tab-container .poi-tab-contents')
  const tabSize = tab ? tab.getBoundingClientRect() : { height: 0, width: 0 }
  const panelRect = $('poi-nav-tabs').getBoundingClientRect()
  const { right, bottom } =  config.get('poi.webview.width', getZoomedSize(1200)) !== 0 && !config.get('poi.layout.isolate', false) && $('kan-game webview') ?
    $('kan-game webview').getBoundingClientRect() : { right: window.innerWidth, bottom: window.innerHeight, width: 0 }
  // Apply css
  additionalStyle.innerHTML = `
.dropdown-menu[aria-labelledby=plugin-dropdown] {
  max-height: ${tabSize.height}px;
}

.grid-menu ul[aria-labelledby=plugin-dropdown] {
  max-width: ${tabSize.width}px;
  width: ${panelRect.width * 0.875}px;
}

.toast-poi {
  bottom: ${window.innerHeight - bottom + 12}px;
  right: ${window.innerWidth - right + 12}px;
}
`
}

const setCSSDebounced = debounce(setCSS, 200)

const setMinSize = () => {
  if (config.get('poi.layout.isolate', false) || !$('poi-info') || config.get('poi.layout.overlay', false)) {
    remote.getCurrentWindow().setMinimumSize(1, 1)
  } else {
    const { width, height } = window.getStore('layout.webview')
    remote.getCurrentWindow().setMinimumSize(
      getRealSize(width),
      getRealSize(height + getYOffset()),
    )
  }
}

const setIsolatedMainWindowSize = isolateWindow => {
  remote.getCurrentWindow().setMinimumSize(1, 1)
  const layout = config.get('poi.layout.mode', 'horizontal')
  const reversed = config.get('poi.layout.reverse', false)
  const { width: webviewWidth, height: webviewHeight } = window.getStore('layout.webview')
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

const setOverlayPanelWindowSize = overlayPanel => {
  const layout = config.get('poi.layout.mode', 'horizontal')
  const reversed = config.get('poi.layout.reverse', false)
  const isolateWindow = config.get('poi.layout.isolate', false)
  const { width: webviewWidth, height: webviewHeight } = window.getStore('layout.webview')
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
  setMinSize()
  remote.getCurrentWindow().setContentBounds(bounds)
}

const handleOverlayPanelReszie = () => {
  if (config.get('poi.layout.overlay', false)) {
    const width = config.get('poi.webview.useFixedResolution', true) ? config.get('poi.webview.width', 1200) : remote.getCurrentWindow().getContentSize()[0]
    remote.getCurrentWindow().setContentSize(
      width,
      Math.floor(width / 1200 * 720 + getRealSize(getYOffset())),
    )
    if (config.get('poi.webview.useFixedResolution', true)) {
      remote.getCurrentWindow().setResizable(false)
    } else {
      remote.getCurrentWindow().setResizable(config.get('poi.content.resizable', true))
    }
  }
}

const handleOverlayPanelReszieDebounced = debounce(handleOverlayPanelReszie, 200)

const setProperWindowSize = () => {
  if (config.get('poi.layout.overlay', false) || config.get('poi.layout.isolate', false)) {
    return
  }
  const current = remote.getCurrentWindow()
  // Dont set size on maximized
  if (current.isMaximized() || current.isFullScreen()) {
    return
  }
  // Resize when window size smaller than webview size
  const { width: webviewWidth, height: webviewHeight } = window.getStore('layout.webview')
  const layout = config.get('poi.layout.mode', 'horizontal')
  const realWidth = getRealSize(webviewWidth)
  const realHeight = getRealSize(webviewHeight + getYOffset())
  if (layout === 'vertical' && realWidth > getRealSize(window.innerWidth)) {
    let [width, height] = current.getContentSize()
    width = realWidth
    current.setContentSize(width, height)
  }

  if (layout !== 'vertical' && realHeight > getRealSize(window.getStore('layout.window.height'))) {
    let [width, height] = current.getContentSize()
    height = realHeight
    current.setContentSize(width, height)
  }
}

const adjustSize = () => {
  try {
    // Apply calcualted data
    setCSSDebounced()
    window.dispatch({
      type: '@@LayoutUpdate/webview/useFixedResolution',
      value: window.getStore('config.poi.webview.useFixedResolution', true),
    })
    setMinSize()
    handleOverlayPanelReszieDebounced()
  } catch (error) {
    console.error(error)
  }
}

adjustSize()

const changeBounds = () => {
  let { width: newWidth, height: newHeight } = window.getStore('layout.webview')
  newHeight += getYOffset()
  if (config.get('poi.layout.mode', 'horizontal') === 'horizontal') {
    // Previous vertical
    newWidth += 400
  } else {
    // Previous horizontal
    newHeight += 400
  }
  remote.getCurrentWindow().setContentSize(
    getRealSize(newWidth),
    getRealSize(newHeight),
  )
}

window.addEventListener('game.start', adjustSize)
window.addEventListener('resize', adjustSize)

config.on('config.set', (path, value) => {
  switch (path) {
  case 'poi.appearance.zoom': {
    const [ width, height ] = remote.getCurrentWindow().getContentSize()
    remote.getCurrentWebContents().setZoomFactor(value)
    adjustSize()
    setTimeout(() => remote.getCurrentWindow().setContentSize(width, height), 1000)
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
    // window.dispatchEvent(new Event('resize'))

    current.setResizable(resizable)
    current.setMaximizable(maximizable)
    current.setFullScreenable(fullscreenable)

    adjustSize()
    break
  }
  case 'poi.layout.isolate': {
    setIsolatedMainWindowSize(value)
    setMinSize()
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

export const layoutResizeObserver = new ResizeObserver(entries => {
  let value = {}
  entries.forEach(entry => {
    const key = entry.target.tagName === 'POI-MAIN'
      ? 'window' : entry.target.tagName === 'WEBVIEW'
        ? 'webview' : entry.target.className.includes('miniship-fleet-content')
          ? 'minishippane' : entry.target.className.includes('ship-tab-container')
            ? 'shippane' : entry.target.className.includes('main-panel-content')
              ? 'mainpane': entry.target.className.includes('combined-panels')
                ? 'combinedpane' : null
    value = {
      ...value,
      [key]: {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
        ...key === 'webview' ? {
          useFixedResolution: window.getStore('config.poi.webview.useFixedResolution', true),
        } : {},
      },
    }
    if (entry.target.tagName === 'WEBVIEW') {
      setMinSize()
      setProperWindowSize()
    }
  })
  window.dispatch({
    type: '@@LayoutUpdate',
    value,
  })
})
