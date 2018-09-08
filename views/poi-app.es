/* global $, config */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import FontAwesome from 'react-fontawesome'
import { ResizableArea } from 'react-resizable-area'
import classnames from 'classnames'

import { ControlledTabArea } from './tabarea'

const overlayPanelDefaultWidth = {
  px: 700,
  percent: 0,
}

const overlayPanelMinimumWidth = {
  px: 350,
  percent: 0,
}

const transformToAreaSize = size => ({
  percent: 100,
  px: -size.px,
})

const transformToPanelSize = size => ({
  percent: 0,
  px: -size.px,
})

@connect((state, props) => ({
  layout: get(state, 'config.poi.layout.mode', 'horizontal'),
  overlay: get(state, 'config.poi.layout.overlay', false),
  editable: get(state.config, 'poi.layout.editable', false),
  overlayPanelWidth: get(state.config, 'poi.tabarea.overlaypanelwidth', overlayPanelDefaultWidth),
}))
export class PoiApp extends Component {
  state = {
    overlayVisible: false,
  }
  handleOverlayPanelResize = ({ width }) => {
    const val = transformToPanelSize(width)
    if (val.px < overlayPanelMinimumWidth.px) {
      val.px = overlayPanelMinimumWidth.px
    }
    config.set('poi.tabarea.overlaypanelwidth', val)
  }
  render() {
    const { layout, overlay } = this.props
    const { overlayVisible } = this.state
    const isHorizontal = layout === 'horizontal'
    const top = $('title-bar') ? $('title-bar').clientHeight : 0
    const bottom = $('poi-info') ? $('poi-info').clientHeight : 30
    const style = {
      flexBasis: 0,
      flexGrow: 1,
      [isHorizontal || overlay ? 'height' : 'width']: overlay ? 'inherit' : '100%',
      [isHorizontal  || overlay ?  'width' : 'height']: overlay ? this.props.overlayPanelWidth.px : 0,
      maxWidth: overlay ? 'calc(100vw - 50px)' : '100vw',
      WebkitTransform: overlayVisible || !overlay ? 'none': 'translateX(100%)',
      top: overlay ? top : 'inherit',
      bottom: overlay ? bottom : 'inherit',
    }
    const classname = overlay ? 'overlay-background poi-app-overlay' : null
    return (
      <>
        {
          overlay && (
            <ResizableArea
              ref={ref => this.resizableArea = ref}
              className={classnames('overlay-panel-resizer', { 'width-resize': this.props.editable && this.state.overlayVisible })}
              minimumWidth={{
                px: 50,
                percent: 0,
              }}
              maximumWidth={transformToAreaSize(overlayPanelMinimumWidth)}
              defaultWidth={transformToAreaSize(overlayPanelDefaultWidth)}
              initWidth={transformToAreaSize(this.props.overlayPanelWidth)}
              minimumHeight={{
                px: -(bottom + top),
                percent: 100,
              }}
              maximumHeight={{
                px: -(bottom + top),
                percent: 100,
              }}
              initHeight={{
                px: -(bottom + top),
                percent: 100,
              }}
              usePercentageResize={{ width: false, height: false }}
              disable={{
                width: !this.props.editable || !this.state.overlayVisible,
                height: !this.props.editable || !this.state.overlayVisible,
              }}
              onResizing={this.handleOverlayPanelResize}
              onResized={this.handleOverlayPanelResize}
              parentContainer={$('poi-main')}
            />
          )
        }
        <poi-app style={style}
          class={classname}>
          {
            overlay && (
              <a className='overlay-panel-trigger' onClick={() => this.setState({overlayVisible: ! this.state.overlayVisible})}>
                <FontAwesome name={!overlayVisible ? 'angle-left' : 'angle-right'} />
              </a>
            )
          }
          <div id='poi-app-container' className='poi-app-container'>
            <poi-nav>
              <poi-nav-tabs>
                <ControlledTabArea />
              </poi-nav-tabs>
            </poi-nav>
          </div>
        </poi-app>
      </>
    )
  }
}
