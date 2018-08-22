import themes from 'poi-asset-themes/index.json'
import { remote } from 'electron'
import { fileUrl } from '../utils/tools'
import { accessSync, ensureFileSync } from 'fs-extra'
import { join } from 'path-extra'

const { normal: normalThemes, vibrant: vibrantThemes } = themes
const { $, config } = window
const EXROOT = remote.getGlobal('EXROOT')

require.extensions['.css'] = (m, name) => {
  accessSync(name)
  const link = document.createElement('link')
  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('href', name)
  document.head.appendChild(link)
}

const customCSSPath = join(EXROOT, 'hack', 'custom.css')
ensureFileSync(customCSSPath)
const customCSS = document.createElement('link')
customCSS.setAttribute('rel', 'stylesheet')
customCSS.setAttribute('id', 'custom-css')
customCSS.setAttribute('href', customCSSPath)

const FACSSPath = require.resolve('@fortawesome/fontawesome-svg-core/styles.css')
const FACSS = document.createElement('link')
FACSS.setAttribute('rel', 'stylesheet')
FACSS.setAttribute('id', 'fontawesome')
FACSS.setAttribute('href', FACSSPath)

window.reloadCustomCss = () => {
  if (!$('#custom-css')) {
    return
  }
  $('#custom-css').setAttribute('href', `file://${EXROOT}/hack/custom.css`)
}

window.loadTheme = (theme = 'paperdark') => {
  theme = themes.normal.includes(theme) ? theme : 'paperdark'
  window.theme = theme
  window.isDarkTheme = /(dark|black|slate|superhero|papercyan)/i.test(theme)
  if ($('#bootstrap-css')) {
    $('#bootstrap-css').setAttribute('href', require.resolve(`poi-asset-themes/dist/${window.isVibrant ? 'vibrant' : 'normal'}/${theme}.css`))
  }
  window.reloadCustomCss()
}

window.applyTheme = theme => config.set('poi.theme', theme)

const windowsSetVibrancy = value => {
  try {
    const electronVibrancy = remote.require(join(window.ROOT, 'assets', 'binary', 'electron-vibrancy-x64'))
    if (value === 1) {
      electronVibrancy.SetVibrancy(remote.getCurrentWindow(), 0)
      if (window.isWindowMode) {
        remote.getCurrentWindow().setBackgroundColor('#002A2A2A')
      }
    } else {
      electronVibrancy.DisableVibrancy(remote.getCurrentWindow())
      if (window.isWindowMode) {
        remote.getCurrentWindow().setBackgroundColor('#E62A2A2A')
      }
    }
  } catch (e) {
    console.warn('Set vibrancy style failed. Check if electron-vibrancy is correctly complied.', e)
  }
}

window.setVibrancy = value => {
  const themes = value ? vibrantThemes : normalThemes
  if (window.isMain && window.dispatch) {
    window.dispatch({
      type: '@@UpdateThemes',
      themes,
    })
  }
  window.allThemes = themes
  if ('darwin' === process.platform) {
    remote.getCurrentWindow().setVibrancy((value === 1) ? 'ultra-dark' : null)
  } else if('win32' === process.platform) {
    if (remote.getCurrentWindow().isVisible()) {
      windowsSetVibrancy(value)
    }
  }
  window.isVibrant = Boolean(value)
  const theme = config.get('poi.theme', 'paperdark')
  if (themes.includes(theme)) {
    window.loadTheme(theme)
  } else {
    config.set('poi.theme', 'paperdark')
  }
}

if ('win32' === process.platform) {
  remote.getCurrentWindow().on('hide', () => {
    if (config.get('poi.vibrant', 0) === 1) {
      windowsSetVibrancy(0)
    }
  })
  remote.getCurrentWindow().on('show', () => {
    if (config.get('poi.vibrant', 0) === 1) {
      windowsSetVibrancy(1)
    }
  })
}

window.allThemes = normalThemes
window.normalThemes = normalThemes
window.vibrantThemes = vibrantThemes
config.setDefault('poi.theme', 'darklykai')
window.setVibrancy(config.get('poi.vibrant', null))

const themeChangeHandler = (path, value) => {
  if (path === 'poi.theme') {
    window.loadTheme(value)
  }
  if (path === 'poi.vibrant') {
    window.setVibrancy(value)
    toggleBackground(value)
  }
  if (path === 'poi.background') {
    setBackground(value)
  }
}

config.addListener('config.set', themeChangeHandler)
window.addEventListener('unload', (e) => {
  config.removeListener('config.set', themeChangeHandler)
})

const glass = document.createElement("div")
glass.id = 'bg-overlay'
glass.style.position = 'fixed'
glass.style.top = '-15px'
glass.style.left = '-15px'
glass.style.height = 'calc(100vh + 30px)'
glass.style.width = 'calc(100vw + 30px)'
glass.style.zIndex = -1
glass.style.backgroundRepeat = 'no-repeat'
glass.style.backgroundPosition = 'center center'
glass.style.backgroundSize = 'cover'
glass.style.backgroundColor = 'rgba(42,42,42,0.9)'
glass.style.color = '#000'
glass.style.display = 'none'

const div = document.createElement("div")
div.id = 'custom-bg'
div.style.position = 'fixed',
div.style.top = '-15px'
div.style.left = '-15px'
div.style.height = 'calc(100vh + 30px)'
div.style.width = 'calc(100vw + 30px)'
div.style.zIndex = -2
div.style.backgroundRepeat = 'no-repeat'
div.style.backgroundPosition = 'center center'
div.style.backgroundSize = 'cover'
div.style.backgroundColor = '#000'
div.style.display = 'none'

const setBackground = p => {
  if (p) {
    div.style.backgroundImage = `url(${CSS.escape(fileUrl(p))})`
  } else {
    div.style.backgroundImage = ''
  }
}

const toggleBackground = value => {
  if (value === 2) {
    div.style.filter = 'blur(10px) saturate(50%)'
    div.style.display = 'block'
    glass.style.display = 'block'
  } else {
    div.style.filter = ''
    div.style.display = 'none'
    glass.style.display = 'none'
  }
}

remote.getCurrentWebContents().on('dom-ready', () => {
  document.body.appendChild(customCSS)
  document.head.appendChild(FACSS)
  document.body.appendChild(div)
  document.body.appendChild(glass)
  setBackground(config.get('poi.background'))
  toggleBackground(config.get('poi.vibrant'))
})

// Workaround for window transparency on 2.0.0
if (process.platform === 'win32') {
  remote.getCurrentWindow().on('blur', () => {
    if (config.get('poi.vibrant', 0) === 1) {
      remote.getCurrentWindow().setBackgroundColor(window.isMain || window.blurpolyfill ? '#E62A2A2A' : '#FF2A2A2A')
    }
  })

  remote.getCurrentWindow().on('focus', () => {
    if (config.get('poi.vibrant', 0) === 1) {
      remote.getCurrentWindow().setBackgroundColor('#E62A2A2A')
      if (!window.isMain && !window.blurpolyfill) {
        window.blurpolyfill = true
        remote.getCurrentWindow().blur()
        remote.getCurrentWindow().focus()
      }
    }
  })
}
