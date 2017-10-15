import React from 'react'
import Divider from '../components/divider'

import LayoutConfig from './layout-config'
import ThemeConfig from './theme-config'
import ZoomingConfig from './zooming-config'
import PanelMinSizeConfig from './panel-min-size-config'
import FlashQualityConfig from './flash-quality-config'
import ResolutionConfig from './resolution-config'

const {config, toggleModal, i18n } = window
const __ = i18n.setting.__.bind(i18n.setting)

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
    toggleModalWithDelay(__('Layout settings'), __('Some plugins may not work before you refresh the page.'))
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
    toggleModalWithDelay(__('Layout settings'), __('Some plugins may not work before you refresh the page.'))
    break
  case 'poi.transition.enable':
    window.dispatchEvent(new Event('display.transition.change'))
    break
  default:
  }
})

const DisplayConfig = () => (
  <form>
    <div className="form-group">
      <Divider text={__("Layout")} />
      <LayoutConfig />
    </div>
    <div className="form-group">
      <Divider text={__('Themes')} />
      <ThemeConfig />
    </div>
    <div className="form-group">
      <Divider text={__('Zoom')} />
      <ZoomingConfig />
    </div>
    <div className="form-group">
      <Divider text={__('Panel area')} />
      <PanelMinSizeConfig />
    </div>
    <div className="form-group">
      <Divider text={__('Flash Quality & Window Mode')} />
      <FlashQualityConfig />
    </div>
    <div className="form-group">
      <Divider text={__('Game resolution')} />
      <ResolutionConfig />
    </div>
  </form>
)

export default DisplayConfig
