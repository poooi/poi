import themes from 'poi-asset-themes/index.json'
import { remote } from 'electron'
import { fileUrl } from '../utils/tools'

const { normal: normalThemes, vibrant: vibrantThemes } = themes

const {$, EXROOT, config} = window

if ($('#fontawesome-css')) {
  $('#fontawesome-css').setAttribute('href', require.resolve('font-awesome/css/font-awesome.css'))
}

window.reloadCustomCss = () => {
  if (!$('#custom-css')) {
    return
  }
  $('#custom-css').setAttribute('href', `file://${EXROOT}/hack/custom.css`)
}

window.loadTheme = (theme = 'paperdark') => {
  window.theme = theme
  window.isDarkTheme = /(dark|black|slate|superhero|papercyan)/i.test(theme)
  if ($('#bootstrap-css')) {
    $('#bootstrap-css').setAttribute('href', require.resolve(`poi-asset-themes/dist/${window.isVibrant ? 'vibrant' : 'normal'}/${theme}.css`))
  }
  window.reloadCustomCss()
}

window.applyTheme = theme => config.set('poi.theme', theme)

window.setVibrancy = value => {
  const themes = value ? vibrantThemes : normalThemes
  if (window.isMain && window.dispatch) {
    window.dispatch({
      type: '@@UpdateThemes',
      themes,
    })
  }
  window.allThemes = themes
  if (['darwin'].includes(process.platform)) {
    remote.getCurrentWindow().setVibrancy((value === 1) ? 'ultra-dark' : null)
  }
  window.isVibrant = Boolean(value)
  const theme = config.get('poi.theme', 'paperdark')
  if (themes.includes(theme)) {
    window.loadTheme(theme)
  } else {
    config.set('poi.theme', 'paperdark')
  }
}

window.allThemes = normalThemes
window.normalThemes = normalThemes
window.vibrantThemes = vibrantThemes
config.setDefault('poi.theme', 'paperdark')
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
    div.style.backgroundImage = `url(${fileUrl(p)})`
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
  document.body.appendChild(div)
  document.body.appendChild(glass)
  setBackground(config.get('poi.background'))
  toggleBackground(config.get('poi.vibrant'))
})
