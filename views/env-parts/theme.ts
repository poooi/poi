import type { BrowserWindow } from 'electron'
import type { ConfigStringPath, ConfigValue } from 'lib/config'

import * as remote from '@electron/remote'
import themes from 'assets/data/theme.json'
import classNames from 'classnames'
import { accessSync, ensureFileSync } from 'fs-extra'
import { join } from 'path'

import { fileUrl } from '../utils/tools'
import { config } from './config'

declare global {
  interface Window {
    /** @deprecated Use `config.set('poi.appearance.theme', theme)` instead */
    applyTheme: (theme: string) => void
    /** @deprecated Read from `config.get('poi.appearance.theme')` and check if it is a dark theme instead */
    isDarkTheme: boolean
  }
}

const EXROOT = `${remote.getGlobal('EXROOT')}`

require.extensions['.css'] = (m: NodeModule, name: string) => {
  accessSync(name)
  const link = document.createElement('link')
  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('href', fileUrl(name))
  document.head.appendChild(link)
}

window.applyTheme = (theme: string) => config.set('poi.appearance.theme', theme)
config.setDefault('poi.appearance.theme', 'darklykai')

export function loadStyle(
  doc: Document = window.document,
  currentWindow: BrowserWindow = remote.getCurrentWindow(),
  isMainWindow = true,
): void {
  const customCSSPath = join(EXROOT, 'hack', 'custom.css')
  ensureFileSync(customCSSPath)
  const customCSS = doc.createElement('link')
  customCSS.setAttribute('rel', 'stylesheet')
  customCSS.setAttribute('id', 'custom-css')
  customCSS.setAttribute('href', fileUrl(customCSSPath))

  const FACSSPath = require.resolve('@fortawesome/fontawesome-svg-core/styles.css')
  const FACSS = doc.createElement('link')
  FACSS.setAttribute('rel', 'stylesheet')
  FACSS.setAttribute('id', 'fontawesome')
  FACSS.setAttribute('href', fileUrl(FACSSPath))

  const glass = doc.createElement('div')
  glass.id = 'bg-overlay'
  glass.style.position = 'fixed'
  glass.style.top = '-15px'
  glass.style.left = '-15px'
  glass.style.height = 'calc(100vh + 30px)'
  glass.style.width = 'calc(100vw + 30px)'
  glass.style.zIndex = '-1'
  glass.style.backgroundRepeat = 'no-repeat'
  glass.style.backgroundPosition = 'center center'
  glass.style.backgroundSize = 'cover'
  glass.style.color = '#000'
  glass.style.display = 'none'

  const div = doc.createElement('div')
  div.id = 'custom-bg'
  div.style.position = 'fixed'
  div.style.top = '-15px'
  div.style.left = '-15px'
  div.style.height = 'calc(100vh + 30px)'
  div.style.width = 'calc(100vw + 30px)'
  div.style.zIndex = '-2'
  div.style.backgroundRepeat = 'no-repeat'
  div.style.backgroundPosition = 'center center'
  div.style.backgroundSize = 'cover'
  div.style.backgroundColor = '#000'
  div.style.display = 'none'

  const reloadCustomCss = () => {
    if (!doc.querySelector('#custom-css')) {
      return
    }
    doc.querySelector('#custom-css')!.setAttribute('href', `file://${EXROOT}/hack/custom.css`)
  }

  const delaySetClassName = (className: string) => {
    if (doc.body) {
      doc.body.className = className
    } else {
      setTimeout(() => delaySetClassName(className), 100)
    }
  }

  const delaySetBackgroundColor = (value: string) => {
    if (doc.body) {
      doc.body.style.backgroundColor = value
    } else {
      setTimeout(() => delaySetBackgroundColor(value), 100)
    }
  }

  const delaySetFilter = (value: string | null) => {
    if (doc.body) {
      doc.body.style.filter = value ?? ''
    } else {
      setTimeout(() => delaySetFilter(value), 100)
    }
  }

  const setFilter = (type: string | null | undefined) => {
    if (type === 'null' || type == null) {
      delaySetFilter(null)
    } else {
      delaySetFilter(`url(${fileUrl(join(ROOT, 'assets', 'svg', 'ui', 'filter.svg'))}#${type})`)
    }
  }

  const setBackgroundColor = (isDark: boolean, isVibrant: boolean | number) => {
    if (isVibrant) {
      if ('darwin' === process.platform) {
        delaySetBackgroundColor(isDark ? 'rgba(47, 52, 60, 0.59)' : 'rgba(246, 247, 249, 0.59)')
      } else {
        delaySetBackgroundColor(isDark ? 'rgba(47, 52, 60, 0.5)' : 'rgba(246, 247, 249, 0.25)')
      }
    } else {
      delaySetBackgroundColor(isDark ? 'rgb(47, 52, 60)' : 'rgb(246, 247, 249)')
    }
  }

  const setRef = (el: Element, url: string) => {
    if (el.getAttribute('href') !== url) {
      el.setAttribute('href', url)
    }
  }

  const loadTheme = (theme = 'dark', isVibrant?: boolean | number) => {
    theme = themes.includes(theme) ? theme : 'dark'
    isVibrant = typeof isVibrant === 'boolean' ? isVibrant : config.get('poi.appearance.vibrant', 0)
    const isDark = theme === 'dark'
    window.isDarkTheme = isDark
    setBackgroundColor(isDark, isVibrant)
    glass.style.backgroundColor = isDark ? 'rgb(47, 52, 60)' : 'rgb(246, 247, 249)'
    setFilter(config.get('poi.appearance.colorblindFilter'))
    delaySetClassName(
      classNames('bp5-focus-disabled', {
        'bp5-dark': isDark,
      }),
    )
    const bootstrapEl = doc.querySelector('#bootstrap-css')
    if (bootstrapEl) {
      setRef(
        bootstrapEl,
        fileUrl(
          require.resolve(
            `poi-asset-themes/dist/bootstrap/${isDark ? 'darklykai' : 'cosmo'}-vibrant.css`,
          ),
        ),
      )
    }
    const blueprintEl = doc.querySelector('#blueprint-css')
    if (blueprintEl) {
      setRef(
        blueprintEl,
        fileUrl(
          require.resolve(
            `poi-asset-themes/dist/blueprint/blueprint-${isVibrant ? 'vibrant' : 'normal'}.css`,
          ),
        ),
      )
    }
    const blueprintIconEl = doc.querySelector('#blueprint-icon-css')
    if (blueprintIconEl) {
      setRef(
        blueprintIconEl,
        fileUrl(require.resolve('@blueprintjs/icons/lib/css/blueprint-icons.css')),
      )
    }
    const normalizeEl = doc.querySelector('#normalize-css')
    if (normalizeEl) {
      setRef(normalizeEl, fileUrl(require.resolve('normalize.css/normalize.css')))
    }
    reloadCustomCss()
  }

  const setVibrancy = (value: number) => {
    const theme = config.get('poi.appearance.theme', 'dark')
    if ('darwin' === process.platform) {
      currentWindow.setBackgroundColor(value === 1 ? '#00000000' : '#000000')
      currentWindow.setVibrancy('window')
    } else if ('win32' === process.platform) {
      if (currentWindow.isVisible()) {
        currentWindow.setBackgroundColor(value === 1 ? '#00000000' : '#000000')
        currentWindow.setBackgroundMaterial?.(value === 1 ? 'acrylic' : 'none')
      }
    }
    window.dispatchEvent(new Event('resize'))
    if (themes.includes(theme ?? '')) {
      loadTheme(theme ?? undefined, !!value)
    } else {
      config.set('poi.appearance.theme', 'dark')
    }
  }

  setVibrancy(config.get('poi.appearance.vibrant', 0))

  currentWindow.on('focus', () => {
    setVibrancy(config.get('poi.appearance.vibrant', 0))
  })

  const themeChangeHandler = <P extends ConfigStringPath>(configPath: P, value: ConfigValue<P>) => {
    if (configPath === 'poi.appearance.theme') {
      loadTheme(typeof value === 'string' ? value : undefined)
    }
    if (configPath === 'poi.appearance.vibrant') {
      if (typeof value === 'number') {
        setVibrancy(value)
        toggleBackground(value)
      }
    }
    if (configPath === 'poi.appearance.background') {
      setBackground(typeof value === 'string' ? value : null)
    }
    if (configPath === 'poi.appearance.colorblindFilter') {
      setFilter(typeof value === 'string' ? value : null)
    }
  }

  config.addListener('config.set', themeChangeHandler)
  currentWindow.on('closed', () => {
    config.removeListener('config.set', themeChangeHandler)
  })

  const setBackground = (p: string | null) => {
    if (p) {
      div.style.backgroundImage = `url(${CSS.escape(fileUrl(p))})`
    } else {
      div.style.backgroundImage = ''
    }
  }

  const toggleBackground = (value: number) => {
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
    doc.body.appendChild(customCSS)
    doc.head.appendChild(FACSS)
    doc.body.appendChild(div)
    doc.body.appendChild(glass)
    setBackground(config.get('poi.appearance.background') ?? null)
    toggleBackground(config.get('poi.appearance.vibrant', 0))
  })

  void isMainWindow
}

loadStyle()
