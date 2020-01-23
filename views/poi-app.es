/* global $, config */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import FontAwesome from 'react-fontawesome'
import { ResizableArea } from 'react-resizable-area'
import styled, { css } from 'styled-components'

import { ControlledTabArea } from './components/tab-area'

const PoiAppE = styled.div`
  position: relative;
  flex-shrink: 0;
  flex-basis: 0;
  flex-grow: 1;
  max-width: 100vw;
  width: 100%;
  height: 0;

  .container {
    overflow-x: hidden;
    padding-left: 0;
    padding-right: 0;
    width: auto;
  }

  ${({ isHorizontal }) =>
    isHorizontal &&
    css`
      height: 100%;
      width: 0;
    `}

  ${({ overlay, top, bottom, overlayVisible, overlayWidth }) =>
    overlay &&
    css`
      position: fixed;
      right: 0;
      transition: transform 0.3s 0.2s ease-in;
      will-change: transform;
      max-width: calc(100vw - 50px);
      transform: translate3d(${overlayVisible ? 0 : 100}%, 0, 0);
      top: ${top}px;
      bottom: ${bottom}px;
      height: inherit;
      width: ${overlayWidth}px;
      z-index: 19;
    `}
`

const PoiAppContainer = styled.div`
  overflow: hidden;
  height: 100%;
  ${({ overlay }) =>
    overlay &&
    css`
      backdrop-filter: blur(5px);
      background: #202b33e6;
    `}
`

const OverlayPanelTrigger = styled.a`
  transform: translateX(-100%);
  position: fixed;
  background: rgba(75, 75, 75, 0.8);
  height: 5vh;
  display: flex;
  align-items: center;
  width: 40px;
  min-height: 30px;
  text-align: center;
  padding: 5px 10px 5px 10px;
  font-size: 15px;
  bottom: 0;
  border-top-left-radius: 5px;

  & > svg {
    margin: auto;
  }
`

const OverlayPanelResizer = styled(ResizableArea)`
  position: fixed !important;
  left: 0;
  bottom: 30px;
  pointer-events: none;
  ${({ widthResize }) =>
    widthResize &&
    css`
      & > div {
        pointer-events: all;
        opacity: 0;
      }
    `}
`

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
    const bottom = $('poi-info')
      ? do {
          const rect = $('poi-info').getBoundingClientRect()
          rect.height - rect.bottom + innerHeight
        }
      : 29
    return (
      <>
        {overlay && (
          <OverlayPanelResizer
            ref={ref => (this.resizableArea = ref)}
            className="overlay-panel-resizer"
            widthResize={this.props.editable && this.state.overlayVisible ? 1 : 0}
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
        )}
        <PoiAppE
          overlay={overlay}
          overlayVisible={overlayVisible}
          isHorizontal={isHorizontal}
          overlayWidth={this.props.overlayPanelWidth.px}
          top={top}
          bottom={bottom}
        >
          {overlay && (
            <OverlayPanelTrigger
              className="overlay-panel-trigger"
              onClick={() => this.setState({ overlayVisible: !this.state.overlayVisible })}
            >
              <FontAwesome name={!overlayVisible ? 'angle-left' : 'angle-right'} />
            </OverlayPanelTrigger>
          )}
          <PoiAppContainer id="poi-app-container" className="poi-app-container" overlay={overlay}>
            <poi-nav>
              <poi-nav-tabs>
                <ControlledTabArea />
              </poi-nav-tabs>
            </poi-nav>
          </PoiAppContainer>
        </PoiAppE>
      </>
    )
  }
}
