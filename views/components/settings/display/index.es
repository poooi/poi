/* global config, toggleModal */
import React from 'react'

import { LayoutConfig } from './layout-config'
import { ThemeConfig } from './theme-config'
import { ZoomingConfig } from './zooming-config'
import { ResolutionConfig } from './resolution-config'
import { Trans } from 'react-i18next'

const toggleModalWithDelay = (...arg) => setTimeout(() => toggleModal(...arg), 1500)

config.on('config.set', (path, value) => {
  let event
  switch (path) {
    case 'poi.layout.mode':
      event = new CustomEvent('layout.change', {
        bubbles: true,
        cancelable: true,
        detail: {
          layout: value,
        },
      })
      window.dispatchEvent(event)
      toggleModalWithDelay(
        <Trans>setting:Layout settings</Trans>,
        <Trans>setting:Some plugins may not work before you refresh the page</Trans>,
      )
      break
    case 'poi.tabarea.double':
      event = new CustomEvent('doubleTabbed.change', {
        bubbles: true,
        cancelable: true,
        detail: {
          doubleTabbed: value,
        },
      })
      window.dispatchEvent(event)
      toggleModalWithDelay(
        <Trans>setting:Layout settings</Trans>,
        <Trans>setting:Some plugins may not work before you refresh the page</Trans>,
      )
      break
    case 'poi.transition.enable':
      window.dispatchEvent(new Event('display.transition.change'))
      break
    default:
  }
})

export const DisplayConfig = () => (
  <div>
    <LayoutConfig />
    <ThemeConfig />
    <ZoomingConfig />
    <ResolutionConfig />
  </div>
)
