import { LegacyColors } from '@blueprintjs/colors'
import { Colors } from '@blueprintjs/core'

export const darkTheme = {
  ...LegacyColors,
  ...Colors,
  name: 'bp5-dark',
  variant: 'dark',
  slotBg: 'rgb(33 33 33 / 0.7)',
}

export const lightTheme = {
  ...LegacyColors,
  ...Colors,
  name: 'bp5-light',
  variant: 'light',
  slotBg: 'rgb(255 255 255 / 0.7)',
}
