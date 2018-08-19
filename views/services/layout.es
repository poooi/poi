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
  const tabSize = ($('.poi-tab-container:last-child .poi-tab-contents') || $('.poi-tab-container .poi-tab-contents')).getBoundingClientRect()
  const panelRect = $('poi-nav-tabs').getBoundingClientRect()
  const { right, bottom } =  config.get('poi.webview.width', 1200) !== 0 && !config.get('poi.isolateGameWindow', false) && $('kan-game webview') ?
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

const setMinSize = isolateWindow => {
  if (isolateWindow || !$('poi-info')) {
    remote.getCurrentWindow().setMinimumSize(1, 1)
  } else {
    const { width, height } = window.getStore('layout.webview')
    const zoomLevel = config.get('poi.zoomLevel', 1)
    remote.getCurrentWindow().setMinimumSize(width, Math.floor(height + $('poi-info').clientHeight * zoomLevel + (($('title-bar') || {}).clientHeight || 0)))
  }
}

const setIsolatedMainWindowSize = isolateWindow => {
  remote.getCurrentWindow().setMinimumSize(1, 1)
  const layout = config.get('poi.layout', 'horizontal')
  const reversed = config.get('poi.reverseLayout', false)
  const { width: webviewWidth, height: webviewHeight } = window.getStore('layout.webview')
  const bounds = remote.getCurrentWindow().getBounds()
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
  remote.getCurrentWindow().setBounds(bounds)
}

const setProperWindowSize = () => {
  const current = remote.getCurrentWindow()
  // Dont set size on maximized
  if (current.isMaximized() || current.isFullScreen()) {
    return
  }
  // Resize when window size smaller than webview size
  const { width: webviewWidth, height: webviewHeight } = window.getStore('layout.webview')
  const zoomLevel = config.get('poi.zoomLevel', 1)
  const layout = config.get('poi.layout', 'horizontal')
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
    const layout = config.get('poi.layout', 'horizontal')
    const zoomLevel = config.get('poi.zoomLevel', 1)
    const reversed = config.get('poi.reverseLayout', false)
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
  if (config.get('poi.layout', 'horizontal') === 'horizontal') {
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
  case 'poi.zoomLevel':
  case 'poi.panelMinSize':
  case 'poi.tabarea.double':
  case 'poi.webview.width':
  case 'poi.webview.useFixedResolution':
  case 'poi.webview.ratio.vertical':
  case 'poi.webview.ratio.horizontal':
  case 'poi.reverseLayout': {
    adjustSize()
    break
  }
  case 'poi.layout': {
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
  case 'poi.isolateGameWindow': {
    setIsolatedMainWindowSize(value)
    setMinSize(value)
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
