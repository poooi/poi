import { debounce } from 'lodash'
import { remote } from 'electron'

const {config, $} = window

// polyfill
if (config.get('poi.webview.width', 1200) < 0) {
  config.set('poi.webview.width', 1200)
}

const additionalStyle = document.createElement('style')

remote.getCurrentWindow().webContents.on('dom-ready', (e) => {
  document.head.appendChild(additionalStyle)
  setMinSize()
})

const setCSS = ({ layout, zoomLevel, reversed }) => {
  const tab = $('.poi-tab-container:last-child .poi-tab-contents') || $('.poi-tab-container .poi-tab-contents')
  const tabSize = tab ? tab.getBoundingClientRect() : { height: 0, width: 0 }
  const panelRect = $('poi-nav-tabs').getBoundingClientRect()
  const { right, bottom } =  config.get('poi.webview.width', 1200) !== 0 && !config.get('poi.layout.isolate', false) && $('kan-game webview') ?
    $('kan-game webview').getBoundingClientRect() : { right: window.innerWidth, bottom: window.innerHeight, width: 0 }
  // Apply css
  additionalStyle.innerHTML = `
div[role='tooltip'], .poi-app-container, poi-info {
  ${zoomLevel !== 1 ? `zoom: ${zoomLevel};` : ''}
}

.main-panel-content {
  ${zoomLevel !== 1 ? `width: ${Math.round(zoomLevel * 100)}%;` : ''}
}

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
${(zoomLevel !== 1 && (layout === 'vertical' || reversed)) ? `
#detail-map-info {
  left: initial !important;
  right: 0 !important;
}

#detail-map-info .tooltip-arrow {
  left: initial !important;
  right: 60px;
}
` : ''
}
`
}

const setCSSDebounced = debounce(setCSS, 200)

const setMinSize = () => {
  if (config.get('poi.layout.isolate', false) || !$('poi-info') || config.get('poi.layout.overlay', false)) {
    remote.getCurrentWindow().setMinimumSize(1, 1)
  } else {
    const { width, height } = window.getStore('layout.webview')
    const zoomLevel = config.get('poi.appearance.zoom', 1)
    remote.getCurrentWindow().setMinimumSize(width, Math.floor(height + $('poi-info').clientHeight * zoomLevel + (($('title-bar') || {}).clientHeight || 0)))
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
      bounds.width -= webviewWidth
      if (!reversed) {
        bounds.x += webviewWidth
      }
    } else {
      bounds.height -= webviewHeight + 30
      if (!reversed) {
        bounds.y += webviewHeight + 30
      }
    }
  } else {
    if (layout === 'horizontal') {
      bounds.width += webviewWidth
      if (!reversed) {
        bounds.x -= webviewWidth
      }
    } else {
      bounds.height += webviewHeight + 30
      if (!reversed) {
        bounds.y -= webviewHeight + 30
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
  const zoomLevel = config.get('poi.appearance.zoom', 1)
  const poiInfoHeight = Math.floor((($('poi-info') || {}).clientHeight || 0) * zoomLevel)
  const titlebarHeight = Math.floor(($('title-bar') || {}).clientHeight || 0)
  if (overlayPanel && !isolateWindow) {
    if (useFixedResolution) {
      remote.getCurrentWindow().setResizable(false)
    }
    if (layout === 'horizontal') {
      config.set('poi.layout.overlaypanel.width', bounds.width - webviewWidth)
      if (reversed) {
        bounds.x += (bounds.width - webviewWidth)
      }
      bounds.width = webviewWidth
      bounds.height = webviewHeight + poiInfoHeight + titlebarHeight
    } else {
      config.set('poi.layout.overlaypanel.width', bounds.height - webviewHeight - poiInfoHeight)
      if (reversed) {
        bounds.y += bounds.height - webviewHeight - poiInfoHeight
      }
      bounds.width = webviewWidth
      bounds.height = webviewHeight + poiInfoHeight + titlebarHeight
    }
    remote.getCurrentWindow().setAspectRatio(1200 / 720, { width: 0, height: poiInfoHeight + titlebarHeight })
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
    const zoomLevel = config.get('poi.appearance.zoom', 1)
    const poiInfoHeight = Math.floor((($('poi-info') || {}).clientHeight || 0) * zoomLevel)
    const titlebarHeight = Math.floor(($('title-bar') || {}).clientHeight || 0)
    remote.getCurrentWindow().setContentSize(width, Math.floor(width / 1200 * 720) + poiInfoHeight + titlebarHeight)
    if (config.get('poi.webview.useFixedResolution', true)) {
      remote.getCurrentWindow().setResizable(false)
    } else {
      remote.getCurrentWindow().setResizable(config.get('poi.content.resizable', true))
    }
  }
}

const handleOverlayPanelReszieDebounced = debounce(handleOverlayPanelReszie, 200)

const setProperWindowSize = () => {
  const current = remote.getCurrentWindow()
  // Dont set size on maximized
  if (current.isMaximized() || current.isFullScreen()) {
    return
  }
  // Resize when window size smaller than webview size
  const { width: webviewWidth, height: webviewHeight } = window.getStore('layout.webview')
  const zoomLevel = config.get('poi.appearance.zoom', 1)
  const layout = config.get('poi.layout.mode', 'horizontal')
  const realWidth = webviewWidth
  const realHeight = Math.floor(webviewHeight + $('poi-info').clientHeight * zoomLevel)
  if (layout === 'vertical' && realWidth > window.innerWidth) {
    let { width, height, x, y } = current.getBounds()
    const borderX = width - window.innerWidth
    width = realWidth + borderX
    current.setBounds({ width, height, x, y })
  }

  if (layout !== 'vertical' && realHeight > window.getStore('layout.window.height')) {
    let { width, height, x, y } = current.getBounds()
    height += realHeight - window.getStore('layout.window.height')
    current.setBounds({ width, height, x, y })
  }
}

const adjustSize = () => {
  try {
    const layout = config.get('poi.layout.mode', 'horizontal')
    const zoomLevel = config.get('poi.appearance.zoom', 1)
    const reversed = config.get('poi.layout.reverse', false)
    // Apply calcualted data
    setCSSDebounced({
      layout,
      zoomLevel,
      reversed,
    })
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
  const {width, height, x, y} = remote.getCurrentWindow().getBounds()
  const borderX = width - window.innerWidth
  const borderY = height - window.innerHeight
  let newHeight = window.innerHeight
  let newWidth = window.innerWidth
  if (config.get('poi.layout.mode', 'horizontal') === 'horizontal') {
    // Previous vertical
    newHeight = window.innerWidth / 1200 * 720 + 30
    newWidth = window.innerWidth / 5 * 7
  } else {
    // Previous horizontal
    newHeight = window.innerWidth / 7 * 5 / 1200 * 720 + 420
    newWidth = window.innerWidth / 7 * 5
  }
  remote.getCurrentWindow().setBounds({
    x,
    y,
    width: parseInt(newWidth + borderX),
    height: parseInt(newHeight + borderY),
  })
}

window.addEventListener('game.start', adjustSize)
window.addEventListener('resize', adjustSize)

config.on('config.set', (path, value) => {
  switch (path) {
  case 'poi.appearance.zoom':
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
