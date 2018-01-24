import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'

import ControlledTabArea from './tabarea'


export const PoiApp = connect((state, props) => ({
  webviewWidth: get(state, 'config.poi.webview.width', -1),
  zoomLevel: get(state, 'config.poi.zoomLevel', 1),
  layout: get(state, 'config.poi.layout', 'horizontal'),
  doubleTabbed: get(state, 'config.poi.tabarea.double', false),
  panelMinSize: get(state, 'config.poi.panelMinSize', 1),
}))(class poiApp extends Component {
  render() {
    const { doubleTabbed, panelMinSize, zoomLevel, layout } = this.props
    const isHorizontal = layout === 'horizontal'
    return (
      <poi-app style={{
        flexBasis: Math.ceil(panelMinSize * zoomLevel * (isHorizontal ? (doubleTabbed ? 500 : 375) : 200)),
        flexGrow: 1,
        [isHorizontal ? 'height' : 'width']: '100%',
        [!isHorizontal ? 'height' : 'width']: 0,
      }}>
        <div id='poi-app-container' className='poi-app-container'>
          <poi-nav>
            <poi-nav-tabs>
              <ControlledTabArea />
            </poi-nav-tabs>
          </poi-nav>
        </div>
      </poi-app>
    )
  }
})
