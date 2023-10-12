/* global config, ROOT */
import * as remote from '@electron/remote'
import { fileUrl } from '../utils/tools'
import { accessSync, ensureFileSync } from 'fs-extra'
import { join } from 'path-extra'
import themes from 'assets/data/theme.json'
import classNames from 'classnames'
import { isBoolean } from 'util'

const EXROOT = remote.getGlobal('EXROOT')

require.extensions['.css'] = (m, name) => {
  accessSync(name)
  const link = document.createElement('link')
  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('href', fileUrl(name))
  document.head.appendChild(link)
}

window.applyTheme = (theme) => config.set('poi.appearance.theme', theme)
config.setDefault('poi.appearance.theme', 'darklykai')

export function loadStyle(
  document = window.document,
  currentWindow = remote.getCurrentWindow(),
  isMainWindow = true,
) {
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
  glass.style.color = '#000'
  glass.style.display = 'none'

  const div = document.createElement('div')
  div.id = 'custom-bg'
  ;(div.style.position = 'fixed'), (div.style.top = '-15px')
  div.style.left = '-15px'
  div.style.height = 'calc(100vh + 30px)'
  div.style.width = 'calc(100vw + 30px)'
  div.style.zIndex = -2
  div.style.backgroundRepeat = 'no-repeat'
  div.style.backgroundPosition = 'center center'
  div.style.backgroundSize = 'cover'
  div.style.backgroundColor = '#000'
  div.style.display = 'none'

  const reloadCustomCss = () => {
    if (!$('#custom-css')) {
      return
    }
    $('#custom-css').setAttribute('href', `file://${EXROOT}/hack/custom.css`)
  }

  const delaySetClassName = (className) => {
    if (document.body) {
      document.body.className = className
    } else {
      setTimeout(() => delaySetClassName(className), 100)
    }
  }

  const delaySetBackgroundColor = (value) => {
    if (document.body) {
      document.body.style.backgroundColor = value
    } else {
      setTimeout(() => delaySetBackgroundColor(value), 100)
    }
  }

  const delaySetFilter = (value) => {
    if (document.body) {
      document.body.style.filter = value
    } else {
      setTimeout(() => delaySetFilter(value), 100)
    }
  }

  const setFilter = (type) => {
    if (type === 'null') {
      delaySetFilter(null)
    } else {
      delaySetFilter(`url(${fileUrl(join(ROOT, 'assets', 'svg', 'ui', 'filter.svg'))}#${type})`)
    }
  }

  const setBackgroundColor = (isDark, isVibrant) => {
    if (isVibrant) {
      if ('darwin' === process.platform) {
        delaySetBackgroundColor(isDark ? 'rgba(47, 52, 60, 0.59)' : 'rgba(246, 247, 249, 0.59)')
      } else {
        delaySetBackgroundColor(isDark ? 'rgba(36, 41, 46, 0.7)' : 'rgba(246, 247, 249, 0.25)')
      }
    } else {
      delaySetBackgroundColor(isDark ? 'rgb(47, 52, 60)' : 'rgb(246, 247, 249)')
    }
  }

  const setRef = (el, url) => {
    if (el.href !== url) {
      el.setAttribute('href', url)
    }
  }

  const loadTheme = (theme = 'dark', isVibrant) => {
    theme = themes.includes(theme) ? theme : 'dark'
    isVibrant = isBoolean(isVibrant) ? isVibrant : config.get('poi.appearance.vibrant', 0)
    const isDark = theme === 'dark'
    window.isDarkTheme = isDark
    setBackgroundColor(isDark, isVibrant)
    glass.style.backgroundColor = isDark ? 'rgb(47, 52, 60)' : 'rgb(246, 247, 249)'
    setFilter(config.get('poi.appearance.colorblindFilter'))
    delaySetClassName(
      classNames('bp4-focus-disabled', {
        'bp4-dark': isDark,
      }),
    )
    if ($('#bootstrap-css')) {
      setRef(
        $('#bootstrap-css'),
        fileUrl(
          require.resolve(
            `poi-asset-themes/dist/bootstrap/${isDark ? 'darklykai' : 'cosmo'}-vibrant.css`,
          ),
        ),
      )
    }
    if ($('#blueprint-css')) {
      setRef(
        $('#blueprint-css'),
        fileUrl(
          require.resolve(
            `poi-asset-themes/dist/blueprint/blueprint-${isVibrant ? 'vibrant' : 'normal'}.css`,
          ),
        ),
      )
    }
    if ($('#blueprint-icon-css')) {
      setRef(
        $('#blueprint-icon-css'),
        fileUrl(require.resolve('@blueprintjs/icons/lib/css/blueprint-icons.css')),
      )
    }
    if ($('#normalize-css')) {
      setRef($('#normalize-css'), fileUrl(require.resolve('normalize.css/normalize.css')))
    }
    reloadCustomCss()
  }

  const setVibrancy = (value) => {
    const theme = config.get('poi.appearance.theme', 'dark')
    const isDark = theme === 'dark'
    if ('darwin' === process.platform) {
      currentWindow.setBackgroundColor(value === 1 ? '#00000000' : '#000000')
      currentWindow.setVibrancy(value === 1 ? (isDark ? 'dark' : 'light') : null)
    } else if ('win32' === process.platform) {
      if (currentWindow.isVisible()) {
        currentWindow.setBackgroundColor(value === 1 ? '#00000000' : '#000000')
        currentWindow.setBackgroundMaterial(value === 1 ? 'acrylic' : 'none')
      }
    }
    window.dispatchEvent(new Event('resize'))
    if (themes.includes(theme)) {
      loadTheme(theme, !!value)
    } else {
      config.set('poi.appearance.theme', 'dark')
    }
  }

  setVibrancy(config.get('poi.appearance.vibrant', 0))

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
    if (path === 'poi.appearance.colorblindFilter') {
      setFilter(value)
    }
  }

  config.addListener('config.set', themeChangeHandler)
  currentWindow.on('closed', (e) => {
    config.removeListener('config.set', themeChangeHandler)
  })

  const setBackground = (p) => {
    if (p) {
      div.style.backgroundImage = `url(${CSS.escape(fileUrl(p))})`
    } else {
      div.style.backgroundImage = ''
    }
  }

  const toggleBackground = (value) => {
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

  // Workaround for window transparency on 27.0.0
  if (process.platform === 'win32') {
    const resetBackgroundColor = () => {
      if (config.get('poi.appearance.vibrant', 0) === 1) {
        currentWindow.setBackgroundColor('#00000000')
      }
    }

    currentWindow.on('blur', resetBackgroundColor)
    currentWindow.on('focus', resetBackgroundColor)
    currentWindow.on('restore', () => {
      if (config.get('poi.appearance.vibrant', 0) === 1) {
        const [width, height] = currentWindow.getSize()
        currentWindow.setSize(width + 1, height + 1)
        currentWindow.setSize(width, height)
      }
    })
  }
}

loadStyle()
