import React from 'react'
import { Divider } from '../components/divider'

import { LayoutConfig } from './layout-config'
import { ThemeConfig } from './theme-config'
import { ZoomingConfig } from './zooming-config'
import { ResolutionConfig } from './resolution-config'
import { Trans } from 'react-i18next'

const {config, toggleModal } = window

const toggleModalWithDelay = (...arg) => setTimeout(() => toggleModal(...arg), 1500)

config.on('config.set', (path, value) => {
  let event
  switch (path) {
  case 'poi.layout':
    event = new CustomEvent('layout.change', {
      bubbles: true,
      cancelable: true,
      detail: {
        layout: value,
      },
    })
    window.dispatchEvent(event)
    toggleModalWithDelay(<Trans>setting:Layout settings</Trans>, <Trans>setting:Some plugins may not work before you refresh the page</Trans>)
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
    toggleModalWithDelay(<Trans>setting:Layout settings</Trans>, <Trans>setting:Some plugins may not work before you refresh the page</Trans>)
    break
  case 'poi.transition.enable':
    window.dispatchEvent(new Event('display.transition.change'))
    break
  default:
  }
})

export const DisplayConfig = () => (
  <form>
    <div className="form-group">
      <Divider text={<Trans>setting:Layout</Trans>} />
      <LayoutConfig />
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Themes</Trans>} />
      <ThemeConfig />
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Zoom</Trans>} />
      <ZoomingConfig />
    </div>
    <div className="form-group">
      <Divider text={<Trans>setting:Game resolution</Trans>} />
      <ResolutionConfig />
    </div>
  </form>
)
