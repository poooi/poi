import themes from 'poi-asset-themes/index.json'
import { remote } from 'electron'
const { getAllWindows } = remote.require('./lib/window')

const { normal: normalThemes, vibrant: vibrantThemes } = themes

const {$, ROOT, EXROOT, config} = window

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
  const themes = window.isVibrant ? vibrantThemes : normalThemes
  window.theme = themes.includes(theme) ? theme : 'darkly'
  window.isDarkTheme = /(dark|black|slate|superhero|papercyan)/i.test(theme)
  if ($('#bootstrap-css')) {
    $('#bootstrap-css').setAttribute('href', require.resolve(`poi-asset-themes/dist/${window.isVibrant ? 'vibrant' : 'normal'}/${theme}.css`))
  }
  window.reloadCustomCss()
}

window.applyTheme = theme => config.set('poi.theme', theme)

window.setVibrancy = value => {
  const windows = getAllWindows()
  if (windows) {
    windows.forEach(window => {
      window.setVibrancy(value ? 'ultra-dark' : null)
    })
  }
  window.isVibrant = Boolean(value)
  window.loadTheme(config.get('poi.theme'))
}

window.allThemes = normalThemes
config.setDefault('poi.theme', 'paperdark')
window.setVibrancy(config.get('poi.vibrancy', null))
window.loadTheme(config.get('poi.theme', 'paperdark'))

const themeChangeHandler = (path, value) => {
  if (path === 'poi.theme') {
    window.loadTheme(value)
  }
  if (path === 'poi.vibrancy') {
    window.setVibrancy(value)
  }
}

config.addListener('config.set', themeChangeHandler)
window.addEventListener('unload', (e) => {
  config.removeListener('config.set', themeChangeHandler)
})
