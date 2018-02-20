import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'

import { ControlledTabArea } from './tabarea'

@connect((state, props) => ({
  layout: get(state, 'config.poi.layout', 'horizontal'),
}))
export class PoiApp extends Component {
  render() {
    const { layout } = this.props
    const isHorizontal = layout === 'horizontal'
    return (
      <poi-app style={{
        flexBasis: 0,
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
}
