import { debounce } from 'lodash'
import { remote } from 'electron'

const {config, $} = window

$('#layout-css').setAttribute('href',
  `./assets/css/layout.${config.get('poi.layout', 'horizontal')}.css`)

const poiControlHeight = 30
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

const setCSS = ({webviewWidth, webviewHeight, tabpaneHeight, layout, zoomLevel}) => {
  // Apply css
  additionalStyle.innerHTML = `
    poi-app div.poi-app-tabpane {
      height: ${tabpaneHeight};
    }
    div[role='tooltip'], #poi-app-container {
      transform : scale(${zoomLevel});
    }
    .poi-control-tooltip {
      max-height: ${Math.ceil(poiControlHeight / zoomLevel)}px;
    }
    #poi-app-container {
      width: ${Math.floor(100 / zoomLevel)}%;
    }
    poi-nav poi-nav-tabs .nav .dropdown-menu {
      max-height: ${tabpaneHeight};
    }
    kan-game #webview-wrapper {
      width: ${webviewWidth}px !important;
      height: ${webviewHeight}px !important;
    }
    ${getFlexCSS({webviewWidth: webviewWidth, layout: layout})}
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
    $('kan-game').style.marginTop = `${Math.max(0, Math.floor((window.innerHeight - webviewHeight - poiControlHeight) / 2.0))}px`
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
  const layout = config.get('poi.layout', 'horizontal')
  const zoomLevel = config.get('poi.zoomLevel', 1)
  const doubleTabbed = config.get('poi.tabarea.double', false)
  let webviewWidth = config.get('poi.webview.width', -1)
  let webviewHeight = Math.min(window.innerHeight - poiControlHeight, Math.round(webviewWidth / 800.0 * 480.0))
  const useFixedResolution = (webviewWidth !== -1)

  // Calculate webview size
  if (!useFixedResolution) {
    if (layout === 'horizontal') {
      webviewHeight = window.innerHeight - poiControlHeight
      webviewWidth = Math.round(webviewHeight / 480.0 * 800.0)
    } else {
      webviewWidth = window.innerWidth
      webviewHeight = Math.round(webviewWidth / 800.0 * 480.0)
    }
  }

  // Set a smaller webview size if it takes too much place
  let cap
  if (layout === 'vertical') {
    cap = Math.ceil(200 * zoomLevel)
    if (window.innerHeight - webviewHeight < cap) {
      webviewHeight = window.innerHeight - cap
      webviewWidth = Math.round(webviewHeight / 480.0 * 800.0)
    }
  } else {
    if (doubleTabbed) {
      cap = Math.ceil(500 * zoomLevel)
    } else {
      cap = Math.ceil(375 * zoomLevel)
    }
    if (window.innerWidth - webviewWidth < cap) {
      webviewWidth = window.innerWidth - cap
      webviewHeight = Math.min(window.innerHeight - poiControlHeight, Math.round(webviewWidth / 800.0 * 480))
    }
  }

  // Calculate tabpanes' height
  let tabpaneHeight
  if (layout === 'horizontal') {
    tabpaneHeight = `${window.innerHeight / zoomLevel - poiControlHeight}px`
  }
  else {
    tabpaneHeight = `${(window.innerHeight - webviewHeight - poiControlHeight) / zoomLevel - poiControlHeight}px`
  }

  // Update redux store
  window.dispatch({
    type: '@@LayoutUpdate',
    value: {
      window: {
        width: window.innerWidth,
        height: window.innerHeight,
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
    webviewHeight: webviewHeight,
    webviewWidth: webviewWidth,
    tabpaneHeight: tabpaneHeight,
    layout: layout,
    zoomLevel: zoomLevel,
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
  case 'poi.tabarea.double':
  case 'poi.webview.width': {
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
