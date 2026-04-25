import { nativeTheme } from 'electron'

import config from './config'

const getThemeSource = (value: string) => (value === 'dark' ? 'dark' : 'light')

config.on('config.set', (key: string, value: unknown) => {
  if (key === 'poi.appearance.theme' && typeof value === 'string') {
    nativeTheme.themeSource = getThemeSource(value)
  }
})

nativeTheme.themeSource = getThemeSource(config.get('poi.appearance.theme', 'dark'))
