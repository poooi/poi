import themes from 'poi-asset-themes/index.json'
import { remote } from 'electron'
const { getAllWindows } = remote.require('./lib/window')

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
  const themes = window.isVibrant ? vibrantThemes : normalThemes
  window.theme = theme = themes.includes(theme) ? theme : 'paperdark'
  window.isDarkTheme = /(dark|black|slate|superhero|papercyan)/i.test(theme)
  if ($('#bootstrap-css')) {
    $('#bootstrap-css').setAttribute('href', require.resolve(`poi-asset-themes/dist/${window.isVibrant ? 'vibrant' : 'normal'}/${theme}.css`))
  }
  window.reloadCustomCss()
}

window.applyTheme = theme => config.set('poi.theme', theme)

window.setVibrancy = value => {
  if (process.platform !== 'darwin') {
    return
  }
  const themes = value ? vibrantThemes : normalThemes
  if (window.dispatch) {
    window.dispatch({
      type: '@@UpdateThemes',
      themes,
    })
  }
  window.allThemes = themes
  const windows = getAllWindows()
  if (windows) {
    windows.forEach(window => {
      window.setVibrancy(value ? 'ultra-dark' : null)
    })
  }
  window.isVibrant = Boolean(value)
  const theme = config.get('poi.theme', 'paperdark')
  window.applyTheme(themes.includes(theme) ? theme : 'paperdark')
}

window.allThemes = normalThemes
config.setDefault('poi.theme', 'paperdark')
if (process.platform === 'darwin') {
  window.setVibrancy(config.get('poi.vibrant', null))
}

window.loadTheme(config.get('poi.theme', 'paperdark'))

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
