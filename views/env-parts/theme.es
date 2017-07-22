import themes from 'poi-asset-themes/index.json'

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

window.loadTheme = (th) => {
  window.theme = th || 'paperdark'
  const {theme} = window
  window.isDarkTheme = /(dark|black|slate|superhero|papercyan)/i.test(th)
  if ($('#bootstrap-css')) {
    $('#bootstrap-css').setAttribute('href', `file://${ROOT}/node_modules/poi-asset-themes/dist/${theme}.css`)
  }
  window.reloadCustomCss()
}

window.applyTheme = (th) => {
  config.set('poi.theme', th)
  const event = new CustomEvent('theme.change',{
    bubbles: true,
    cancelable: true,
    detail: {
      theme: th,
    },
  })
  window.dispatchEvent(event)
}

window.allThemes = themes
config.setDefault('poi.theme', 'paperdark')
window.loadTheme(config.get('poi.theme', 'paperdark'))

const themeChangeHandler = (path, value) => {
  if (path === 'poi.theme') {
    window.loadTheme(value)
  }
}

config.addListener('config.set', themeChangeHandler)
window.addEventListener('unload', (e) => {
  config.removeListener('config.set', themeChangeHandler)
})
