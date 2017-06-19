import { debounce } from 'lodash'
import { remote } from 'electron'
import { devicePixelRatioDetector } from './device-pixel-ratio-detector'

const {config, $} = window

$('#layout-css').setAttribute('href',
  `./assets/css/layout.${config.get('poi.layout', 'horizontal')}.css`)

const poiControlHeight = 30
const titleBarHeight = process.platform === 'win32' || process.platform === 'linux' ? 28 : 0
const additionalStyle = document.createElement('style')

remote.getCurrentWindow().webContents.on('dom-ready', (e) => {
  document.body.appendChild(additionalStyle)
})

const getFlexCSS = ({layout, webviewWidth}) => {
  if (layout === 'horizontal') {
    return `
      kan-game {
        flex: ${webviewWidth};
      }
      poi-app {
        flex: ${window.innerWidth - webviewWidth};
      }
    `
  }
  return ''
}

const getToastCSS = ({layout, webviewWidth, webviewHeight}) => {
  let { innerHeight, innerWidth } = window
  innerHeight -= titleBarHeight
  if (webviewWidth === 0) {
    return `
      .toast-poi {
        bottom: 12px;
        right: 12px;
      }
    `
  } else if (layout === 'horizontal') {
    return `
      .toast-poi {
        bottom: ${(innerHeight - webviewHeight - 30) / 2 + 36}px;
        right: ${(innerWidth - webviewWidth) + 12}px;
      }
    `
  } else {
    return `
      .toast-poi {
        bottom: ${(innerHeight - webviewHeight - 30) + 36}px;
        right: ${(innerWidth - webviewWidth) / 2 + 12}px;
      }
    `
  }
}

const getPluginDropdownCSS = ({webviewWidth, layout, zoomLevel, doubleTabbed}) => {
  let menuSize, tabWidth

  if (layout === 'horizontal') {
    tabWidth = (window.innerWidth - webviewWidth) / zoomLevel
    menuSize = doubleTabbed ? Math.floor(tabWidth / 2) : Math.floor(tabWidth * 0.875)
    // 0.875 = excluding settings nav width
  }
  else {
    tabWidth = window.innerWidth / zoomLevel
    menuSize = doubleTabbed ? Math.floor(tabWidth / 2) : Math.floor(tabWidth * 0.875)
  }

  return `
    poi-nav .grid-menu ul[aria-labelledby=plugin-dropdown] {
      width: ${menuSize}px;
    }
    `
}

const setCSS = ({webviewWidth, webviewHeight, tabpaneHeight, layout, zoomLevel, doubleTabbed, reversed}) => {
  // Apply css
  let { innerHeight } = window
  innerHeight -= titleBarHeight
  additionalStyle.innerHTML = `
    poi-app {
      ${layout === 'horizontal' ? `
        width: 0;
        height: 0;
      ` : `
        height: calc(${innerHeight}px - ${webviewHeight}px - 30px * ${zoomLevel})
      `}
    }
    .kan-game-warpper {
      height: calc(${webviewHeight}px + 30px * ${zoomLevel});
    }
    poi-app div.poi-app-tabpane {
      height: ${tabpaneHeight};
    }
    poi-main {
      ${reversed ? layout === 'horizontal' ? 'flex-flow: row-reverse nowrap;' : 'flex-flow: column-reverse nowrap;' : ''}
    }
    div[role='tooltip'], #poi-app-container, poi-info {
      ${zoomLevel !== 1 && `transform: scale(${zoomLevel});`}
    }
    .poi-control-tooltip {
      max-height: ${Math.ceil(poiControlHeight / zoomLevel)}px;
    }
    #poi-app-container, poi-info {
      width: calc(100% / ${zoomLevel});
    }
    poi-nav poi-nav-tabs .nav .dropdown-menu {
      max-height: ${tabpaneHeight};
    }
    kan-game #webview-wrapper {
      width: ${webviewWidth}px !important;
      height: ${webviewHeight}px !important;
    }
    ${getFlexCSS({webviewWidth: webviewWidth, layout: layout})}
    ${getToastCSS({webviewWidth: webviewWidth, webviewHeight: webviewHeight, layout: layout})}
    ${getPluginDropdownCSS({webviewWidth: webviewWidth, zoomLevel: zoomLevel, layout: layout, doubleTabbed: doubleTabbed})}
  `

  // Resize when window size smaller than webview size
  if (layout === 'vertical' && webviewWidth > window.innerWidth) {
    let {width, height, x, y} = remote.getCurrentWindow().getBounds()
    const borderX = width - window.innerWidth
    width = webviewWidth + borderX
    remote.getCurrentWindow().setBounds({width, height, x, y})
  }

  // Fix poi-info when game size 0x0
  if (webviewWidth > -0.00001 && webviewWidth < 0.00001) {
    $('kan-game').style.display = 'none'
  }
  else {
    $('kan-game').style.display = ''
  }

  // Adjust webview height & position
  if (layout === 'horizontal') {
    $('kan-game #webview-wrapper').style.marginLeft = '0'
    $('kan-game').style.marginTop = `${Math.max(0, Math.floor((innerHeight - webviewHeight - poiControlHeight * zoomLevel) / 2.0))}px`
  } else {
    $('kan-game #webview-wrapper').style.marginLeft = `${Math.max(0, Math.floor((window.innerWidth - webviewWidth) / 2.0))}px`
    $('kan-game').style.marginTop = '0'
  }

  // Adjust content
  try {
    $('kan-game webview').executeJavaScript('window.align()')
  } catch (e) {
    console.error(e)
  }
}

const setCSSDebounced = debounce(setCSS, 200)

const adjustSize = () => {
  const { devicePixelRatio } = window
  const layout = config.get('poi.layout', 'horizontal')
  const reversed = config.get('poi.reverseLayout', false)
  const zoomLevel = config.get('poi.zoomLevel', 1)
  const doubleTabbed = config.get('poi.tabarea.double', false)
  const panelMinSize = config.get('poi.panelMinSize', 1)
  let webviewWidth = config.get('poi.webview.width', -1)
  let webviewHeight = Math.min((window.innerHeight - poiControlHeight * zoomLevel - titleBarHeight) * devicePixelRatio , Math.round(webviewWidth / 800.0 * 480.0))
  const useFixedResolution = (webviewWidth !== -1)
  let { innerHeight } = window
  innerHeight -= titleBarHeight

  // Calculate webview size
  if (!useFixedResolution) {
    if (layout === 'horizontal') {
      webviewHeight = innerHeight - poiControlHeight * zoomLevel
      webviewWidth = Math.round(webviewHeight / 480.0 * 800.0)
    } else {
      webviewWidth = window.innerWidth
      webviewHeight = Math.round(webviewWidth / 800.0 * 480.0)
    }
  } else {
    // HiDPI fix
    webviewWidth = Math.round(webviewWidth / devicePixelRatio)
    webviewHeight = Math.round(webviewHeight / devicePixelRatio)
  }

  // Set a smaller webview size if it takes too much place
  let cap
  if (layout === 'vertical') {
    cap = Math.ceil(200 * panelMinSize * zoomLevel)
    if (innerHeight - webviewHeight < cap) {
      webviewHeight = innerHeight - cap
      webviewWidth = Math.round(webviewHeight / 480.0 * 800.0)
    }
  } else {
    if (doubleTabbed) {
      cap = Math.ceil(500 * panelMinSize * zoomLevel)
    } else {
      cap = Math.ceil(375 * panelMinSize * zoomLevel)
    }
    if (window.innerWidth - webviewWidth < cap) {
      webviewWidth = window.innerWidth - cap
      webviewHeight = Math.min(innerHeight - poiControlHeight * zoomLevel, Math.round(webviewWidth / 800.0 * 480))
    }
  }

  // Calculate tabpanes' height
  let tabpaneHeight
  if (layout === 'horizontal') {
    tabpaneHeight = `${innerHeight / zoomLevel - poiControlHeight * zoomLevel}px`
  }
  else {
    tabpaneHeight = `${(innerHeight - webviewHeight - poiControlHeight * zoomLevel) / zoomLevel - poiControlHeight * zoomLevel}px`
  }

  // Update redux store
  window.dispatch({
    type: '@@LayoutUpdate',
    value: {
      window: {
        width: window.innerWidth,
        height: innerHeight,
      },
      webview: {
        width: webviewWidth,
        height: webviewHeight,
        useFixedResolution: useFixedResolution,
      },
    },
  })

  // Apply calcualted data
  setCSSDebounced({
    webviewHeight,
    webviewWidth,
    tabpaneHeight,
    layout,
    zoomLevel,
    doubleTabbed,
    reversed,
  })
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
    newHeight = window.innerWidth / 800 * 480 + 30
    newWidth = window.innerWidth / 5 * 7
  } else {
    // Previous horizontal
    newHeight = window.innerWidth / 7 * 5 / 800 * 480 + 420
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
  case 'poi.reverseLayout': {
    adjustSize()
    break
  }
  case 'poi.layout': {
    const resizable = remote.getCurrentWindow().isResizable()
    remote.getCurrentWindow().setResizable(true)
    changeBounds()
    // window.dispatchEvent(new Event('resize'))
    $('#layout-css').setAttribute('href', `./assets/css/layout.${value}.css`)
    remote.getCurrentWindow().setResizable(resizable)
    adjustSize()
    break
  }
  default:
    break
  }
})

const detector = new devicePixelRatioDetector()
detector.on('change', adjustSize)
