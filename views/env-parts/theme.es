import themes from 'poi-asset-themes/index.json'
import { remote } from 'electron'

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

window.loadTheme = theme => {
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
  remote.getCurrentWindow().setVibrancy(value ? 'ultra-dark' : null)
  window.isVibrant = Boolean(value)
  const theme = config.get('poi.theme', 'paperdark')
  if (themes.includes(theme)) {
    window.loadTheme(theme)
  } else {
    config.set('poi.theme', 'paperdark')
  }
}

window.allThemes = normalThemes
config.setDefault('poi.theme', 'paperdark')
if (['darwin', 'win32'].includes(process.platform)) {
  window.setVibrancy(config.get('poi.vibrant', null))
} else {
  window.loadTheme(config.get('poi.theme', 'paperdark'))
}

const themeChangeHandler = (path, value) => {
  if (path === 'poi.theme') {
    window.loadTheme(value)
  }
  if (path === 'poi.vibrant') {
    window.setVibrancy(value)
  }
}

config.addListener('config.set', themeChangeHandler)
window.addEventListener('unload', (e) => {
  config.removeListener('config.set', themeChangeHandler)
})
