import config from './config'
import { nativeTheme } from 'electron'

const getThemeSource = (value: string) => (value === 'dark' ? 'dark' : 'light')

config.on('config.set', (key: string, value: string) => {
  if (key === 'poi.appearance.theme') {
    nativeTheme.themeSource = getThemeSource(value)
  }
})

nativeTheme.themeSource = getThemeSource(config.get('poi.appearance.theme', 'dark'))
