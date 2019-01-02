/* global getStore, toggleModal */
import React, { Component } from 'react'
import { remote } from 'electron'
import { connect } from 'react-redux'
import WebView from 'react-electron-web-view'
import { get, debounce } from 'lodash'
import { ResizableArea } from 'react-resizable-area'
import classnames from 'classnames'
import styled from 'styled-components'
import { createHash } from 'crypto'
import ReactMarkdown from 'react-remarkable'

import { PoiAlert } from './components/info/alert'
import { PoiToast } from './components/info/toast'
import { PoiMapReminder } from './components/info/map-reminder'
import { PoiControl } from './components/info/control'
import { fileUrl } from 'views/utils/tools'
import { CustomTag } from 'views/components/etc/custom-tag'
import { getRealSize, getYOffset } from 'views/services/utils'
import i18next from 'views/env-parts/i18next'

const config = remote.require('./lib/config')
const ipc = remote.require('./lib/ipc')
const poiControlHeight = 30
const ua = remote
  .getCurrentWebContents()
  .getUserAgent()
  .replace(/Electron[^ ]* /, '')
  .replace(/poi[^ ]* /, '')
const preloadUrl = fileUrl(require.resolve('assets/js/webview-preload'))

const PoiInfo = styled(CustomTag)`
  flex-basis: 0 0 ${poiControlHeight}px;
  flex-grow: 0;
  flex-shrink: 0;
  transform-origin: 0 0;
  align-items: stretch;
  display: flex;
`

const KanGame = styled(CustomTag)`
  display: flex;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
  overflow: hidden;
  width: 100%;

  .kancolle-webview {
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }

  .bp3-toast-container {
    overflow: hidden !important;
  }
`

@connect(state => ({
  configWebviewWidth: get(state, 'config.poi.webview.width', 1200),
  zoomLevel: get(state, 'config.poi.appearance.zoom', 1),
  isHorizontal: get(state, 'config.poi.layout.mode', 'horizontal') === 'horizontal',
  muted: get(state, 'config.poi.content.muted', false),
  useFixedResolution: get(state, 'config.poi.webview.useFixedResolution', true),
  horizontalRatio: get(state, 'config.poi.webview.ratio.horizontal', 60),
  verticalRatio: get(state, 'config.poi.webview.ratio.vertical', 50),
  editable: get(state, 'config.poi.layout.editable', false),
  windowSize: get(state, 'layout.window', { width: window.innerWidth, height: window.innerHeight }),
  overlayPanel: get(state, 'config.poi.layout.overlay', false),
  homepage: get(
    state,
    'config.poi.misc.homepage',
    'http://www.dmm.com/netgame/social/application/-/detail/=/app_id=854854/',
  ),
}))
export class KanGameWrapper extends Component {
  webview = React.createRef()

  state = {
    url: this.props.homepage,
    key: 0,
  }

  alignWebview = () => {
    try {
      this.webview.current.executeJavaScript('window.align()')
    } catch (e) {
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

  handleResize = entries => {
    entries.forEach(entry => {
      const { width, height } = entry.contentRect
      if (
        width !== getStore('layout.webview.width') ||
        height !== getStore('layout.webview.height')
      ) {
        this.props.dispatch({
          type: '@@LayoutUpdate',
          value: {
            webview: {
              width,
              height,
            },
          },
        })
        this.setProperWindowSize(width, height)
        ipc.register('WebView', {
          width,
        })
        this.alignWebview()
      }
    })
  }

  resizeObserver = new ResizeObserver(debounce(this.handleResize, 200))

  handleCertError = (event, url, error, certificate, callback) => {
    const trusted = config.get('poi.misc.trustedCert', [])
    const hash = createHash('sha256')
      .update(certificate.data)
      .digest('base64')
    if (!trusted.includes(hash)) {
      const title = i18next.t('others:Certificate error')
      const content = (
        <ReactMarkdown
          source={i18next.t('others:cert_error_markdown', {
            name: certificate.issuerName,
            value: hash,
          })}
        />
      )
      const footer = [
        {
          name: i18next.t('others:Trust'),
          func: () => this.setTrustedCert(hash),
          style: 'warning',
        },
      ]
      toggleModal(title, content, footer)
    }
  }

  setTrustedCert = hash => {
    const trusted = config.get('poi.misc.trustedCert', [])
    trusted.push(hash)
    config.set('poi.misc.trustedCert', trusted)
    this.webview.current.view.reload()
  }

  setProperWindowSize = (webviewWidth, webviewHeight) => {
    const current = remote.getCurrentWindow()
    if (!config.get('poi.layout.overlay', false) && !config.get('poi.layout.isolate', false)) {
      current.setMinimumSize(getRealSize(webviewWidth), getRealSize(webviewHeight + getYOffset()))
      // Dont set size on maximized
      if (current.isMaximized() || current.isFullScreen()) {
        return
      }
      const layout = config.get('poi.layout.mode', 'horizontal')
      const realWidth = getRealSize(webviewWidth)
      const realHeight = getRealSize(webviewHeight + getYOffset())
      if (layout === 'vertical' && realWidth > getRealSize(window.innerWidth)) {
        let [width, height] = current.getContentSize()
        width = realWidth
        current.setContentSize(width, height)
      }

      if (layout !== 'vertical' && realHeight > getRealSize(getStore('layout.window.height'))) {
        let [width, height] = current.getContentSize()
        height = realHeight
        current.setContentSize(width, height)
      }
    } else {
      current.setMinimumSize(1, 1)
    }
  }

  handleWebviewDestroyed = () => {
    console.warn('Webview crashed. reloading')
    const url = this.webview.current.view.src
    const key = this.state.key + 1
    this.handleWebviewUnmount()
    this.setState({
      url,
      key,
    })
  }

  handleWebviewMount = () => {
    this.props.dispatch({
      type: '@@LayoutUpdate/webview/UpdateWebviewRef',
      value: {
        ref: this.webview.current,
        ts: Date.now(),
      },
    })
    this.resizeObserver.observe(this.webview.current.view)
    this.setProperWindowSize(
      Number.isNaN(getStore('layout.webview.width')) ? 1200 : getStore('layout.webview.width'),
      Number.isNaN(getStore('layout.webview.height')) ? 720 : getStore('layout.webview.height'),
    )
    this.webview.current.view
      .getWebContents()
      .addListener('certificate-error', this.handleCertError)
  }

  handleWebviewUnmount = () => {
    this.props.dispatch({
      type: '@@LayoutUpdate/webview/UpdateWebviewRef',
      value: {
        ref: false,
        ts: Date.now(),
      },
    })
    this.resizeObserver.unobserve(this.webview.current.view)
  }

  componentWillUnmount = () => {
    this.handleWebviewUnmount()
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (prevState.key === this.state.key) {
      if (!this.props.windowMode) {
        this.resizableArea.setSize({
          width: this.resizableAreaWidth,
          height: this.resizableAreaHeight,
        })
      }
    }
  }

  render() {
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
      overlayPanel,
    } = this.props
    const getZoomedSize = value => Math.round(value / zoomLevel)
    if (this.props.windowMode) {
      return (
        <KanGame tag="kan-game">
          <div id="webview-wrapper" className="webview-wrapper">
            <WebView
              className="kancolle-webview"
              src={this.state.url}
              key={this.state.key}
              ref={this.webview}
              plugins
              disablewebsecurity
              webpreferences="allowRunningInsecureContent=no, backgroundThrottling=no"
              preload={preloadUrl}
              style={{
                width: '100%',
                paddingTop: '60%',
                position: 'relative',
              }}
              muted={muted}
              useragent={ua}
              onDidAttach={this.handleWebviewMount}
              onDestroyed={this.handleWebviewDestroyed}
            />
            <PoiToast />
          </div>
          <PoiInfo tag="poi-info">
            <PoiControl weview={this.webview} />
            <PoiAlert />
            <PoiMapReminder />
          </PoiInfo>
        </KanGame>
      )
    } else {
      const { width: windowWidth, height: windowHeight } = windowSize
      let webviewWidth = getZoomedSize(configWebviewWidth)
      let webviewHeight = getZoomedSize(configWebviewWidth * 0.6)
      if (!useFixedResolution && !overlayPanel) {
        if (isHorizontal) {
          webviewWidth = Math.floor((windowWidth * horizontalRatio) / 100)
          webviewHeight = Math.floor(webviewWidth * 0.6)
        } else {
          webviewHeight = Math.floor((windowHeight * verticalRatio) / 100)
          webviewWidth = Math.floor(webviewHeight / 0.6)
        }
      }

      const defaultWidth = useFixedResolution
        ? {
            px: getZoomedSize(1200),
            percent: 0,
          }
        : overlayPanel
        ? {
            px: 0,
            percent: 100,
          }
        : isHorizontal
        ? {
            px: 0,
            percent: ((windowHeight - poiControlHeight) * 500) / (windowWidth * 3),
          }
        : {
            px: windowWidth,
            percent: 0,
          }
      const defaultHeight = useFixedResolution
        ? {
            px: getZoomedSize(720) + poiControlHeight,
            percent: 0,
          }
        : overlayPanel
        ? {
            px: 0,
            percent: 100,
          }
        : isHorizontal
        ? {
            px: windowHeight,
            percent: 0,
          }
        : {
            px: poiControlHeight,
            percent: (windowWidth * 60) / windowHeight,
          }
      this.resizableAreaWidth = useFixedResolution
        ? {
            px: webviewWidth,
            percent: 0,
          }
        : overlayPanel
        ? {
            px: 0,
            percent: 100,
          }
        : isHorizontal
        ? {
            px: 0,
            percent: horizontalRatio,
          }
        : {
            px: 0,
            percent: 100,
          }
      this.resizableAreaHeight = useFixedResolution
        ? {
            px: webviewHeight + poiControlHeight,
            percent: 0,
          }
        : overlayPanel
        ? {
            px: 0,
            percent: 100,
          }
        : isHorizontal
        ? {
            px: 0,
            percent: 100,
          }
        : {
            px: poiControlHeight,
            percent: verticalRatio,
          }
      const disableWidth = !editable || useFixedResolution || overlayPanel || !isHorizontal
      const disableHeight = !editable || useFixedResolution || overlayPanel || isHorizontal

      return (
        <ResizableArea
          className={classnames('webview-resizable-area', {
            'width-resize': !disableWidth,
            'height-resize': !disableHeight,
          })}
          minimumWidth={!isHorizontal ? { px: 0, percent: 100 } : { px: 0, percent: 0 }}
          defaultWidth={defaultWidth}
          initWidth={this.resizableAreaWidth}
          minimumHeight={
            isHorizontal ? { px: 0, percent: 100 } : { px: poiControlHeight, percent: 0 }
          }
          defaultHeight={defaultHeight}
          initHeight={this.resizableAreaHeight}
          parentContainer={document.querySelector('poi-main')}
          disable={{
            width: disableWidth,
            height: disableHeight,
          }}
          onResized={this.setRatio}
          ref={r => (this.resizableArea = r)}
        >
          <KanGame tag="kan-game">
            <div
              id="webview-wrapper"
              className="webview-wrapper"
              style={{
                width: overlayPanel ? '100%' : webviewWidth,
              }}
            >
              <WebView
                className="kancolle-webview"
                src={this.state.url}
                key={this.state.key}
                ref={this.webview}
                plugins
                disablewebsecurity
                webpreferences="allowRunningInsecureContent=no, backgroundThrottling=no"
                preload={preloadUrl}
                style={{
                  width: '100%',
                  paddingTop: '60%',
                  position: 'relative',
                  display: webviewWidth > -0.00001 && webviewWidth < 0.00001 ? 'none' : null,
                }}
                useragent={ua}
                muted={muted}
                onDidAttach={this.handleWebviewMount}
                onDestroyed={this.handleWebviewDestroyed}
              />
              <PoiToast />
            </div>
            <PoiInfo tag="poi-info">
              <PoiControl weview={this.webview} />
              <PoiAlert />
              <PoiMapReminder />
            </PoiInfo>
          </KanGame>
        </ResizableArea>
      )
    }
  }
}
