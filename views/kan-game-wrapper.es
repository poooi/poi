import React, { Component } from 'react'
import { remote } from 'electron'
import { connect } from 'react-redux'
import WebView from 'react-electron-web-view'
import { get, debounce } from 'lodash'
import { ResizableArea } from 'react-resizable-area'
import classnames from 'classnames'

import { PoiAlert } from './components/info/alert'
import { PoiMapReminder } from './components/info/map-reminder'
import { PoiControl } from './components/info/control'
import { layoutResizeObserver } from 'views/services/layout'

const config = remote.require('./lib/config')
const poiControlHeight = 30

@connect(state => ({
  configWebviewWidth: get(state, 'config.poi.webview.width', 1200),
  zoomLevel: get(state, 'config.poi.zoomLevel', 1),
  isHorizontal: get(state, 'config.poi.layout', 'horizontal') === 'horizontal',
  muted: get(state, 'config.poi.content.muted', false),
  useFixedResolution: get(state, 'config.poi.webview.useFixedResolution', true),
  horizontalRatio: get(state, 'config.poi.webview.ratio.horizontal', 60),
  verticalRatio: get(state, 'config.poi.webview.ratio.vertical', 50),
  editable: get(state, 'config.poi.layouteditable', false),
  windowSize: get(state, 'layout.window', { width: window.innerWidth, height: window.innerHeight }),
}))
export class KanGameWrapper extends Component {
  webview = React.createRef()

  alignWebview = () => {
    try {
      this.webview.current.executeJavaScript('window.align()')
    } catch(e) {
      return
    }
  }

  setRatio = ({ width, height }) => {
    if (this.props.isHorizontal) {
      config.set('poi.webview.ratio.horizontal', width.percent)
    } else {
      config.set('poi.webview.ratio.vertical', height.percent)
    }
  }

  componentDidMount = () => {
    this.alignWebviewDebounced = debounce(this.alignWebview, 200)
    this.props.dispatch({
      type: '@@LayoutUpdate/webview/UpdateWebviewRef',
      value: {
        ref: this.webview.current,
        ts: Date.now(),
      },
    })
    if (!this.props.windowMode) {
      window.addEventListener('resize', this.alignWebviewDebounced)
      layoutResizeObserver.observe(document.querySelector('kan-game webview'))
    }
  }

  componentWillUnmount = () => {
    this.props.dispatch({
      type: '@@LayoutUpdate/webview/UpdateWebviewRef',
      value: {
        ref: false,
        ts: Date.now(),
      },
    })
    if (!this.props.windowMode) {
      window.removeEventListener('resize', this.alignWebviewDebounced)
      layoutResizeObserver.unobserve(document.querySelector('kan-game webview'))
    }
  }

  componentDidUpdate = (prevProps, prevState) => {
    const { width, height } = this.webviewWrapper.getBoundingClientRect()
    if (!this.props.windowMode) {
      this.props.dispatch({
        type: '@@LayoutUpdate/webview/size',
        value: {
          width,
          height,
        },
      })
      this.resizableArea.setSize({
        width: this.resizableAreaWidth,
        height: this.resizableAreaHeight,
      })
    }
  }

  render () {
    const {
      configWebviewWidth,
      zoomLevel,
      isHorizontal,
      muted,
      useFixedResolution,
      horizontalRatio,
      verticalRatio,
      editable,
      windowSize,
    } = this.props
    if (this.props.windowMode) {
      return (
        <kan-game style={{
          width: "100%",
        }}>
          <div id="webview-wrapper"
            className="webview-wrapper"
            ref={e => this.webviewWrapper = e}>
            <WebView
              src={config.get('poi.homepage', 'http://www.dmm.com/netgame/social/application/-/detail/=/app_id=854854/')}
              ref={this.webview}
              plugins
              disablewebsecurity
              webpreferences="allowRunningInsecureContent=no"
              preload={require.resolve('assets/js/webview-preload')}
              style={{
                width: '100%',
                paddingTop: '60%',
                position: 'relative',
              }}
              muted={muted}
            />
          </div>
          <poi-info style={{ flexBasis: poiControlHeight }}>
            <poi-control><PoiControl weview={this.webview} /></poi-control>
            <poi-alert><PoiAlert id='poi-alert' /></poi-alert>
            <poi-map-reminder><PoiMapReminder id='poi-map-reminder'/></poi-map-reminder>
          </poi-info>
        </kan-game>
      )
    } else {
      const { width: windowWidth, height: windowHeight } = windowSize
      const zoomedPoiControlHeight = Math.floor(poiControlHeight * zoomLevel)
      let webviewWidth = configWebviewWidth
      let webviewHeight = Math.floor(configWebviewWidth * 0.6)
      if (!useFixedResolution) {
        if (isHorizontal) {
          webviewWidth = Math.floor(windowWidth * horizontalRatio / 100)
          webviewHeight = Math.floor(webviewWidth * 0.6)
        } else {
          webviewHeight = Math.floor(windowHeight * verticalRatio / 100)
          webviewWidth = Math.floor(webviewHeight / 0.6)
        }
      }

      const defaultWidth = useFixedResolution ? {
        px: 1200,
        percent: 0,
      } : isHorizontal ? {
        px: 0,
        percent: (windowHeight - zoomedPoiControlHeight) * 500 / (windowWidth * 3),
      } : {
        px: windowWidth,
        percent: 0,
      }
      const defaultHeight = useFixedResolution ? {
        px: 720 + zoomedPoiControlHeight,
        percent: 0,
      } : isHorizontal ? {
        px: windowHeight,
        percent: 0,
      } : {
        px: zoomedPoiControlHeight,
        percent: windowWidth * 60 / windowHeight,
      }
      this.resizableAreaWidth =  useFixedResolution ? {
        px: webviewWidth,
        percent: 0,
      } : isHorizontal ? {
        px: 0,
        percent: horizontalRatio,
      } : {
        px: 0,
        percent: 100,
      }
      this.resizableAreaHeight = useFixedResolution ? {
        px: webviewHeight + zoomedPoiControlHeight,
        percent: 0,
      } : isHorizontal ? {
        px: 0,
        percent: 100,
      } : {
        px: zoomedPoiControlHeight,
        percent: verticalRatio,
      }
      const disableWidth = !editable || useFixedResolution || !isHorizontal
      const disableHeight = !editable || useFixedResolution || isHorizontal

      return (
        <ResizableArea
          className={classnames("webview-resizable-area", {
            'width-resize': !disableWidth,
            'height-resize': !disableHeight,
          })}
          minimumWidth={!isHorizontal ? { px: 0, percent: 100 } : { px: 0, percent: 0 }}
          defaultWidth={defaultWidth}
          initWidth={this.resizableAreaWidth}
          minimumHeight={isHorizontal ? { px: 0, percent: 100 } : { px: zoomedPoiControlHeight, percent: 0 }}
          defaultHeight={defaultHeight}
          initHeight={this.resizableAreaHeight}
          parentContainer={document.querySelector('poi-main')}
          disable={{
            width: disableWidth,
            height: disableHeight,
          }}
          onResized={this.setRatio}
          ref={r => this.resizableArea = r}
        >
          <kan-game style={{
            width: "100%",
          }}>
            <div id="webview-wrapper"
              className="webview-wrapper"
              ref={e => this.webviewWrapper = e}
              style={{
                width: webviewWidth,
              }}>
              <WebView
                src={config.get('poi.homepage', 'http://www.dmm.com/netgame/social/application/-/detail/=/app_id=854854/')}
                ref={this.webview}
                plugins
                disablewebsecurity
                webpreferences="allowRunningInsecureContent=no"
                preload={require.resolve('assets/js/webview-preload')}
                style={{
                  width: '100%',
                  paddingTop: '60%',
                  position: 'relative',
                  display: webviewWidth > -0.00001 && webviewWidth < 0.00001 ? 'none' : null,
                }}
                muted={muted}
              />
            </div>
            <poi-info style={{ flexBasis: poiControlHeight }}>
              <poi-control><PoiControl weview={this.webview} /></poi-control>
              <poi-alert><PoiAlert id='poi-alert' /></poi-alert>
              <poi-map-reminder><PoiMapReminder id='poi-map-reminder'/></poi-map-reminder>
            </poi-info>
          </kan-game>
        </ResizableArea>
      )
    }
  }
}
