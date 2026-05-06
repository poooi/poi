import type * as Utils from 'lib/utils'
import type { ResizableAreaHandle, SizeState } from 'react-resizable-area'
import type { Dispatch, AnyAction } from 'redux'
import type { ButtonData } from 'views/components/etc/modal'
import type { ExtendedWebviewTag } from 'views/components/etc/webview'
import type { RootState } from 'views/redux/reducer-factory'

import * as remote from '@electron/remote'
import classnames from 'classnames'
import { createHash, X509Certificate } from 'crypto'
import fs from 'fs-extra'
import { get, memoize } from 'lodash'
import React, { Component, createRef } from 'react'
import { connect } from 'react-redux'
import ReactMarkdown from 'react-remarkable'
import { ResizableArea } from 'react-resizable-area'
import { styled } from 'styled-components'
import { CustomTag } from 'views/components/etc/custom-tag'
import ElectronWebView from 'views/components/etc/webview'
import { getStore } from 'views/create-store'
import i18next from 'views/env-parts/i18next'
import { toggleModal } from 'views/env-parts/modal'
import {
  createLayoutUpdateAction,
  createLayoutWebviewUpdateWebviewRefAction,
} from 'views/redux/actions/layout'
import { getRealSize, getYOffset } from 'views/services/utils'
import { fileUrl } from 'views/utils/tools'

import type { ConfigInstance } from './env'

import { PoiAlert } from './components/info/alert'
import { PoiControl } from './components/info/control'
import { PoiMapReminder } from './components/info/map-reminder'
import { PoiToast } from './components/info/toast'
import { ipc } from './env'

const config: ConfigInstance = remote.require('./lib/config')
const { error }: typeof Utils = remote.require('./lib/utils')
const poiControlHeight = 30
const preloadUrl = fileUrl(require.resolve('assets/js/webview-preload'))

let caCert: X509Certificate | null = null
let caCertError = false

const ensureCACert = () => {
  if (caCertError || caCert) {
    return
  }
  const customCertificateAuthority = config.get('poi.network.customCertificateAuthority', '')
  if (customCertificateAuthority) {
    try {
      const ca = fs.readFileSync(customCertificateAuthority, 'utf8')
      caCert = new X509Certificate(ca)
    } catch (e) {
      error('CA error', e)
      caCertError = true
    }
  }
}

const verifyCACert = memoize((data: string | Buffer) => {
  ensureCACert()
  if (!caCert) {
    return false
  }
  const cert = new X509Certificate(data)
  const caPublicKey = caCert.publicKey
  return cert.verify(caPublicKey)
})

const PoiInfo = styled(
  CustomTag as React.ComponentType<{
    tag?: string
    className?: string
    children?: React.ReactNode
  }>,
)`
  flex: 0 0 ${poiControlHeight}px;
  transform-origin: 0 0;
  align-items: stretch;
  display: flex;
`

const KanGame = styled(
  CustomTag as React.ComponentType<{
    tag?: string
    className?: string
    children?: React.ReactNode
  }>,
)`
  display: flex;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
  overflow: hidden;
  width: 100%;

  .bp6-toast-container {
    overflow: hidden !important;
  }
`

const KanGameWebview = styled(ElectronWebView)`
  width: 100%;
  padding-top: 60%;
  position: relative;

  webview {
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }
`

interface AreaSize {
  px: number
  percent: number
}

interface KanGameWrapperOwnProps {
  windowMode?: boolean
}

interface KanGameWrapperStateProps {
  configWebviewWidth: number
  actualWindowWidth: number
  zoomLevel: number
  isHorizontal: boolean
  muted: boolean
  useFixedResolution: boolean
  horizontalRatio: number
  verticalRatio: number
  editable: boolean
  windowSize: { width: number; height: number }
  overlayPanel: boolean
  bypassGoogleRestriction: boolean
  homepage: string
}

interface KanGameWrapperDispatchProps {
  dispatch: Dispatch<AnyAction>
}

type KanGameWrapperProps = KanGameWrapperOwnProps &
  KanGameWrapperStateProps &
  KanGameWrapperDispatchProps

interface KanGameWrapperState {
  url: string
  key: number
}

class KanGameWrapperInner extends Component<KanGameWrapperProps, KanGameWrapperState> {
  webview = createRef<ExtendedWebviewTag>()

  state: KanGameWrapperState = {
    url: this.props.homepage,
    key: 0,
  }

  resizableArea: ResizableAreaHandle | null = null
  resizableAreaWidth: AreaSize = { px: 0, percent: 0 }
  resizableAreaHeight: AreaSize = { px: 0, percent: 0 }
  enableAudioMutePolyfill = false

  alignWebview = () => {
    try {
      this.webview.current?.executeJavaScript('window.align()')
    } catch (_) {
      return
    }
  }

  setRatio = ({ width, height }: SizeState) => {
    if (this.props.isHorizontal) {
      config.set('poi.webview.ratio.horizontal', width.percent ?? 0)
    } else {
      config.set('poi.webview.ratio.vertical', height.percent ?? 0)
    }
  }

  handleResize = (entries: ResizeObserverEntry[]) => {
    entries.forEach((entry) => {
      const { width, height } = entry.contentRect
      if (
        width !== getStore('layout.webview.width') ||
        height !== getStore('layout.webview.height')
      ) {
        this.props.dispatch(createLayoutUpdateAction({ webview: { width, height } }))
        this.setProperWindowSize(width, height)
        ipc.register('WebView', {
          width,
        })
        this.alignWebview()
      }
    })
  }

  handleCertError = (
    _event: unknown,
    url: string,
    _error: unknown,
    certificate: { data: string | Buffer; issuerName: string },
    _callback: unknown,
  ) => {
    const isSignedByCA = verifyCACert(certificate.data)
    if (isSignedByCA) {
      return
    }

    const trusted: string[] = config.get('poi.misc.trustedCerts', []) ?? []
    const untrusted: string[] = config.get('poi.misc.untrustedCerts', []) ?? []
    const hash = createHash('sha256').update(certificate.data).digest('base64')
    if (!trusted.includes(hash) && !untrusted.includes(hash)) {
      const title = i18next.t('others:Certificate error')
      const content = (
        <ReactMarkdown
          source={i18next.t('others:cert_error_markdown', {
            name: certificate.issuerName,
            url: url,
            value: hash,
          })}
        />
      )
      const footer: ButtonData[] = [
        {
          name: i18next.t('others:Ignore'),
          func: () => this.setUntrustedCerts(hash),
          style: 'warning',
        },
        {
          name: i18next.t('others:Trust'),
          func: () => this.setTrustedCerts(hash),
          style: 'warning',
        },
      ]
      toggleModal(title, content, footer)
    }
  }

  setTrustedCerts = (hash: string) => {
    const trusted: string[] = config.get('poi.misc.trustedCerts', []) ?? []
    const newTrusted = [...trusted, hash]
    config.set('poi.misc.trustedCerts', newTrusted)
    this.webview.current?.reload()
  }

  setUntrustedCerts = (hash: string) => {
    const untrusted: string[] = config.get('poi.misc.untrustedCerts', []) ?? []
    const newUntrusted = [...untrusted, hash]
    config.set('poi.misc.untrustedCerts', newUntrusted)
  }

  setProperWindowSize = (webviewWidth: number, webviewHeight: number) => {
    const current = remote.getCurrentWindow()
    if (!config.get('poi.layout.overlay', false) && !config.get('poi.layout.isolate', false)) {
      current.setMinimumSize(getRealSize(webviewWidth), getRealSize(webviewHeight + getYOffset()))
      if (current.isMaximized() || current.isFullScreen()) {
        return
      }
      const layout = config.get('poi.layout.mode', 'horizontal')
      const realWidth = getRealSize(webviewWidth)
      const realHeight = getRealSize(webviewHeight + getYOffset())
      if (layout === 'vertical' && realWidth > getRealSize(window.innerWidth)) {
        const [_, height] = current.getContentSize()
        current.setContentSize(realWidth, height)
      }

      if (layout !== 'vertical' && realHeight > getRealSize(getStore('layout.window.height'))) {
        const [width, _] = current.getContentSize()
        current.setContentSize(width, realHeight)
      }
    } else {
      current.setMinimumSize(1, 1)
    }
  }

  handleWebviewDestroyed = () => {
    console.warn('Webview crashed. reloading')
    const url = this.webview.current?.src ?? ''
    const key = this.state.key + 1
    this.handleWebviewUnmount()
    this.setState({
      url,
      key,
    })
  }

  handleWebviewMount = () => {
    this.props.dispatch(
      createLayoutWebviewUpdateWebviewRefAction({ ref: this.webview.current, ts: Date.now() }),
    )
    this.setProperWindowSize(
      Number.isNaN(getStore('layout.webview.width')) ? 1200 : getStore('layout.webview.width'),
      Number.isNaN(getStore('layout.webview.height')) ? 720 : getStore('layout.webview.height'),
    )
    this.webview.current?.getWebContents().addListener('certificate-error', this.handleCertError)
  }

  handleWebviewUnmount = () => {
    this.props.dispatch(createLayoutWebviewUpdateWebviewRefAction({ ref: null, ts: Date.now() }))
  }

  handleDidFrameFinishLoad = () => {
    this.enableAudioMutePolyfill = true
  }

  handleWebviewMediaStartedPlaying = () => {
    if (this.props.muted && this.enableAudioMutePolyfill) {
      this.enableAudioMutePolyfill = false
      this.webview.current?.setAudioMuted(false)
      setImmediate(() => {
        this.webview.current?.setAudioMuted(true)
      })
    }
  }

  componentWillUnmount = () => {
    this.handleWebviewUnmount()
  }

  componentDidUpdate = (_prevProps: KanGameWrapperProps, prevState: KanGameWrapperState) => {
    if (prevState.key === this.state.key) {
      if (!this.props.windowMode) {
        this.resizableArea?.setSize({
          width: this.resizableAreaWidth,
          height: this.resizableAreaHeight,
        })
      }
    }
  }

  render() {
    const {
      configWebviewWidth,
      actualWindowWidth,
      zoomLevel,
      isHorizontal,
      muted,
      useFixedResolution,
      horizontalRatio,
      verticalRatio,
      editable,
      windowSize,
      overlayPanel,
      windowMode,
      bypassGoogleRestriction,
    } = this.props
    const getZoomedSize = (value: number) => Math.round(value / zoomLevel)
    const webviewZoomFactor = Math.round((actualWindowWidth * zoomLevel) / 0.012) / 100000
    const ua = remote
      .getCurrentWebContents()
      .userAgent.replace(/Electron[^ ]* /, '')
      .replace(/poi[^ ]* /, '')
      .replace(bypassGoogleRestriction ? /Chrome[^ ]* / : '', '')
    const webview = (
      <KanGameWebview
        webviewTagClassName="kancolle-webview"
        src={this.state.url}
        key={this.state.key}
        ref={this.webview}
        disablewebsecurity
        allowpopups
        nodeintegrationinsubframes
        webpreferences="allowRunningInsecureContent=no, backgroundThrottling=no, contextIsolation=no, sandbox=no, nodeIntegrationInSubFrames=yes"
        preload={preloadUrl}
        audioMuted={muted}
        useragent={ua}
        zoomFactor={webviewZoomFactor}
        onDidAttach={this.handleWebviewMount}
        onDestroyed={this.handleWebviewDestroyed}
        onDidFrameFinishLoad={this.handleDidFrameFinishLoad}
        onMediaStartedPlaying={this.handleWebviewMediaStartedPlaying}
        onResize={this.handleResize}
      />
    )

    if (windowMode) {
      return (
        <KanGame tag="kan-game">
          <div id="webview-wrapper" className="webview-wrapper">
            {webview}
            <PoiToast />
          </div>
          <PoiInfo tag="poi-info">
            <PoiControl />
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

      const defaultWidth: AreaSize = useFixedResolution
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
      const defaultHeight: AreaSize = useFixedResolution
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
          parentContainer={document.querySelector('poi-main') ?? undefined}
          disable={{
            width: disableWidth,
            height: disableHeight,
          }}
          onResized={this.setRatio}
          ref={(r: ResizableAreaHandle | null) => {
            this.resizableArea = r
          }}
        >
          <KanGame tag="kan-game">
            <div
              id="webview-wrapper"
              className="webview-wrapper"
              style={{
                width: overlayPanel ? '100%' : webviewWidth,
              }}
            >
              {webview}
              <PoiToast />
            </div>
            <PoiInfo tag="poi-info">
              <PoiControl />
              <PoiAlert />
              <PoiMapReminder />
            </PoiInfo>
          </KanGame>
        </ResizableArea>
      )
    }
  }
}

export const KanGameWrapper = connect((state: RootState) => ({
  configWebviewWidth: get(state, 'config.poi.webview.width', 1200),
  actualWindowWidth: get(state, 'layout.webview.width', 1200),
  zoomLevel: get(state, 'config.poi.appearance.zoom', 1),
  isHorizontal: get(state, 'config.poi.layout.mode', 'horizontal') === 'horizontal',
  muted: get(state, 'config.poi.content.muted', false),
  useFixedResolution: get(state, 'config.poi.webview.useFixedResolution', true),
  horizontalRatio: get(state, 'config.poi.webview.ratio.horizontal', 60),
  verticalRatio: get(state, 'config.poi.webview.ratio.vertical', 50),
  editable: get(state, 'config.poi.layout.editable', false),
  windowSize: get(state, 'layout.window', { width: window.innerWidth, height: window.innerHeight }),
  overlayPanel: get(state, 'config.poi.layout.overlay', false),
  bypassGoogleRestriction: get(state, 'config.poi.misc.bypassgooglerestriction', false),
  homepage: get(state, 'config.poi.misc.homepage', 'https://play.games.dmm.com/game/kancolle'),
}))(KanGameWrapperInner)
