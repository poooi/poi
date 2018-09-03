/* global $ */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import FontAwesome from 'react-fontawesome'

import { ControlledTabArea } from './tabarea'


@connect((state, props) => ({
  layout: get(state, 'config.poi.layout', 'horizontal'),
  overlay: get(state, 'config.poi.overlayPanel', false),
}))
export class PoiApp extends Component {
  state = {
    overlayVisible: false,
  }
  render() {
    const { layout, overlay } = this.props
    const { overlayVisible } = this.state
    const isHorizontal = layout === 'horizontal'
    const style = {
      flexBasis: 0,
      flexGrow: 1,
      [isHorizontal || overlay ? 'height' : 'width']: overlay ? 'inherit' : '100%',
      [isHorizontal  || overlay ?  'width' : 'height']: overlay ? '500px' : 0,
      WebkitTransform: overlayVisible || !overlay ? 'none': 'translateX(100%)',
      top: overlay ? $('title-bar') ? $('title-bar').clientHeight : 0 : 'inherit',
      bottom: overlay ? $('poi-info') ? $('poi-info').clientHeight : 30 : 'inherit',
    }
    const classname = overlay ? 'overlay-background poi-app-overlay' : null
    const showTrigger = overlay ? null : {display: 'none'}
    return (
      <poi-app style={style}
        class={classname}>
        <a className="overlayPanelTrigger" style={showTrigger} onClick={() => this.setState({overlayVisible: ! this.state.overlayVisible})}><FontAwesome name={!overlayVisible ? 'angle-left' : 'angle-right'} /></a>
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
