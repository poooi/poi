/* global config, ROOT, dispatch */
import themes from 'poi-asset-themes/index.json'
import { remote } from 'electron'
import { fileUrl } from '../utils/tools'
import { accessSync, ensureFileSync } from 'fs-extra'
import { join } from 'path-extra'

const { normal: normalThemes, vibrant: vibrantThemes } = themes
const EXROOT = remote.getGlobal('EXROOT')

require.extensions['.css'] = (m, name) => {
  accessSync(name)
  const link = document.createElement('link')
  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('href', fileUrl(name))
  document.head.appendChild(link)
}

window.applyTheme = theme => config.set('poi.appearance.theme', theme)
window.allThemes = normalThemes
window.normalThemes = normalThemes
window.vibrantThemes = vibrantThemes
config.setDefault('poi.appearance.theme', 'darklykai')

export function loadStyle(document=window.document, currentWindow=remote.getCurrentWindow(), isMainWindow=true) {
  const $ = (...s) => document.querySelector(...s)
  const customCSSPath = join(EXROOT, 'hack', 'custom.css')
  ensureFileSync(customCSSPath)
  const customCSS = document.createElement('link')
  customCSS.setAttribute('rel', 'stylesheet')
  customCSS.setAttribute('id', 'custom-css')
  customCSS.setAttribute('href', fileUrl(customCSSPath))

  const FACSSPath = require.resolve('@fortawesome/fontawesome-svg-core/styles.css')
  const FACSS = document.createElement('link')
  FACSS.setAttribute('rel', 'stylesheet')
  FACSS.setAttribute('id', 'fontawesome')
  FACSS.setAttribute('href', fileUrl(FACSSPath))

  const reloadCustomCss = () => {
    if (!$('#custom-css')) {
      return
    }
    $('#custom-css').setAttribute('href', `file://${EXROOT}/hack/custom.css`)
  }

  const loadTheme = (theme = 'paperdark') => {
    theme = themes.normal.includes(theme) ? theme : 'paperdark'
    const isVibrant = config.get('poi.appearance.vibrant', false)
    // FIXME: wait for light theme
    window.isDarkTheme = true
    if ($('#bootstrap-css')) {
      $('#bootstrap-css').setAttribute('href', fileUrl(require.resolve(`poi-asset-themes/dist/${isVibrant ? 'vibrant' : 'normal'}/${theme}.css`)))
    }
    if ($('#blueprint-css')) {
      $('#blueprint-css').setAttribute('href', fileUrl(require.resolve(`poi-asset-themes/dist/blueprint/blueprint-${isVibrant ? 'vibrant' : 'normal'}.css`)))
    }
    if ($('#blueprint-icon-css')) {
      $('#blueprint-icon-css').setAttribute('href', fileUrl(require.resolve('@blueprintjs/icons/lib/css/blueprint-icons.css')))
    }
    if ($('#normalize-css')) {
      $('#normalize-css').setAttribute('href', fileUrl(require.resolve('normalize.css/normalize.css')))
    }
    reloadCustomCss()
  }

  const setBackgroundColor = value => {
    if (document.body) {
      document.body.style.backgroundColor = value
    } else {
      setTimeout(() => setBackgroundColor(value), 100)
    }
  }

  const windowsSetVibrancy = value => {
    try {
      const electronVibrancy = remote.require(join(ROOT, 'assets', 'binary', 'electron-vibrancy-x64'))
      if (value === 1) {
        electronVibrancy.SetVibrancy(currentWindow, 0)
      } else {
        electronVibrancy.DisableVibrancy(currentWindow)
      }
    } catch (e) {
      console.warn('Set vibrancy style failed. Check if electron-vibrancy is correctly complied.', e)
    }
  }

  const setVibrancy = value => {
    const themes = value ? vibrantThemes : normalThemes
    if (isMainWindow && window.dispatch) {
      dispatch({
        type: '@@UpdateThemes',
        themes,
      })
      window.allThemes = themes
    }
    if (value) {
      if ('darwin' === process.platform) {
        setBackgroundColor('#202b3396')
      } else {
        setBackgroundColor('#202b33e6')
      }
    } else {
      setBackgroundColor('#202b33')
    }
    if ('darwin' === process.platform) {
      currentWindow.setVibrancy((value === 1) ? 'dark' : null)
    } else if('win32' === process.platform) {
      if (currentWindow.isVisible()) {
        windowsSetVibrancy(value)
      }
    }
    const theme = config.get('poi.appearance.theme', 'paperdark')
    if (themes.includes(theme)) {
      loadTheme(theme)
    } else {
      config.set('poi.appearance.theme', 'paperdark')
    }
  }

  if ('win32' === process.platform) {
    currentWindow.on('hide', () => {
      if (config.get('poi.appearance.vibrant', 0) === 1) {
        windowsSetVibrancy(0)
      }
    })
    currentWindow.on('show', () => {
      if (config.get('poi.appearance.vibrant', 0) === 1) {
        windowsSetVibrancy(1)
      }
    })
  }

  setVibrancy(config.get('poi.appearance.vibrant', null))

  const themeChangeHandler = (path, value) => {
    if (path === 'poi.appearance.theme') {
      loadTheme(value)
    }
    if (path === 'poi.appearance.vibrant') {
      setVibrancy(value)
      toggleBackground(value)
    }
    if (path === 'poi.appearance.background') {
      setBackground(value)
    }
  }

  config.addListener('config.set', themeChangeHandler)
  currentWindow.on('closed', (e) => {
    config.removeListener('config.set', themeChangeHandler)
  })

  const glass = document.createElement('div')
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

  const div = document.createElement('div')
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

  currentWindow.webContents.on('dom-ready', () => {
    document.body.appendChild(customCSS)
    document.head.appendChild(FACSS)
    document.body.appendChild(div)
    document.body.appendChild(glass)
    setBackground(config.get('poi.appearance.background'))
    toggleBackground(config.get('poi.appearance.vibrant'))
  })

  // Workaround for window transparency on 2.0.0
  if (process.platform === 'win32') {
    currentWindow.on('blur', () => {
      if (config.get('poi.appearance.vibrant', 0) === 1) {
        currentWindow.setBackgroundColor('#00000000')
      }
    })

    currentWindow.once('focus', () => {
      if (config.get('poi.appearance.vibrant', 0) === 1) {
        currentWindow.setBackgroundColor('#00000000')
      }
    })
  }
}

loadStyle()
