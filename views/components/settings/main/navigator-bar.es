/* global config, getStore */
import React from 'react'
import FontAwesome from 'react-fontawesome'
import { withNamespaces } from 'react-i18next'
import { styled } from 'styled-components'
import {
  Button,
  ButtonGroup,
  InputGroup,
  Tooltip,
  Intent,
  Position,
  FormGroup,
} from '@blueprintjs/core'

import { gameRefreshPage, gameReload } from 'views/services/utils'
import ContextButtonTooltip from 'views/components/etc/context-button-tooltip'

import { Section } from '../components/section'

const wvStatus = {
  Loading: 0,
  Loaded: 1,
  Failed: 2,
}

const Wrapper = styled.div`
  display: flex;
`

const URL = styled.div`
  flex: 1;

  svg {
    z-index: 16;
    top: 30%;
    left: 10px;
    position: absolute;
  }

  input {
    font-size: 12px;
  }
`

const Control = styled.div`
  margin-left: 1em;
`

@withNamespaces(['setting'])
export class NavigatorBar extends React.Component {
  constructor() {
    super()
    config.setDefault(
      'poi.misc.homepage',
      'http://www.dmm.com/netgame/social/application/-/detail/=/app_id=854854/',
    )
    this.state = {
      status: 1,
      url: config.get('poi.misc.homepage'),
    }
  }

  componentDidMount() {
    const load = () => {
      const webview = getStore('layout.webview.ref')
      try {
        webview.getWebContents().addListener('did-start-loading', this.onStartLoading)
        webview.getWebContents().addListener('did-stop-loading', this.onStopLoading)
        webview.getWebContents().addListener('did-fail-load', this.onFailLoad)
        webview.getWebContents().addListener('will-navigate', this.onWillNavigate)
        this.webview = webview
      } catch (e) {
        setTimeout(load, 1000)
      }
    }
    load()
  }

  componentWillUnmount() {
    try {
      const { webview } = this
      webview.getWebContents().removeListener('did-start-loading', this.onStartLoading)
      webview.getWebContents().removeListener('did-stop-loading', this.onStopLoading)
      webview.getWebContents().removeListener('did-fail-load', this.onFailLoad)
      webview.getWebContents().removeListener('will-navigate', this.onWillNavigate)
    } catch (e) {
      return
    }
  }
  // Webview Event
  onStartLoading = (e) => {
    this.setState({
      status: wvStatus.Loading,
    })
  }

  onStopLoading = (e) => {
    const webview = getStore('layout.webview.ref')
    this.setState({
      status: wvStatus.Loaded,
      url: webview.getURL() || this.state.url,
    })
  }

  onFailLoad = (e) => {
    this.setState({
      status: wvStatus.Failed,
    })
  }

  onWillNavigate = (e) => {
    this.setState({
      url: e.url || this.state.url,
    })
  }

  // UI Interaction
  navigate = (url) => {
    if (!url) {
      return
    }
    const webview = getStore('layout.webview.ref')
    if (!(url.startsWith('http://') || url.startsWith('https://'))) {
      url = `http://${this.state.url}`
    }
    webview.loadURL(url)
    this.setState({
      url: url || this.state.url,
    })
  }

  onChangeUrl = (e) => {
    if (typeof e.currentTarget.value === 'string') {
      this.setState({
        url: e.currentTarget.value,
      })
    }
  }

  onKeydown = (e) => {
    if (e.keyCode === 13) {
      this.navigate(this.state.url)
    }
  }

  onClickNavigate = (e) => {
    this.navigate(this.state.url)
  }

  onClickStop = (e) => {
    const webview = getStore('layout.webview.ref')
    webview.stop()
  }

  onClickHomepage = (e) => {
    config.set('poi.misc.homepage', this.state.url)
  }

  onRightClickHomepage = (e) => {
    this.navigate(config.get('poi.misc.homepage'))
  }

  render() {
    const { status } = this.state
    const { t } = this.props

    let statusIcon
    if (status === wvStatus.Loading) {
      statusIcon = <FontAwesome name="spinner" pulse />
    }
    if (status === wvStatus.Failed) {
      statusIcon = <FontAwesome name="times" />
    }

    let navigateAction, navigateIcon
    if (status === wvStatus.Loading) {
      navigateAction = this.onClickStop
      navigateIcon = <FontAwesome name="times" />
    } else {
      navigateAction = this.onClickNavigate
      navigateIcon = <FontAwesome name="arrow-right" />
    }

    return (
      <Section className="navigator" title={t('setting:Browser')}>
        <Wrapper>
          <URL className="navigator-url">
            <FormGroup>
              <InputGroup
                type="text"
                placeholder={t('setting:Input address')}
                className={statusIcon ? 'navigator-with-status' : 'navigator-without-status'}
                value={this.state.url}
                onChange={this.onChangeUrl}
                onKeyDown={this.onKeydown}
                leftIcon={statusIcon}
              />
            </FormGroup>
          </URL>
          <Control className="navigator-control">
            <ButtonGroup>
              <Button intent={Intent.PRIMARY} onClick={navigateAction}>
                {navigateIcon}
              </Button>
              <Tooltip
                position={Position.TOP}
                content={
                  <ContextButtonTooltip
                    left={t('others:Refresh page')}
                    right={t('others:Reload game')}
                  />
                }
              >
                <Button
                  intent={Intent.WARNING}
                  onClick={gameRefreshPage}
                  onContextMenu={gameReload}
                >
                  <FontAwesome name="refresh" />
                </Button>
              </Tooltip>
            </ButtonGroup>
            <Tooltip
              position={Position.TOP}
              content={
                <ContextButtonTooltip left={t('Set as homepage')} right={t('Load homepage')} />
              }
            >
              <ButtonGroup style={{ marginLeft: 5 }}>
                <Button onClick={this.onClickHomepage} onContextMenu={this.onRightClickHomepage}>
                  <FontAwesome name="bookmark" />
                </Button>
              </ButtonGroup>
            </Tooltip>
          </Control>
        </Wrapper>
      </Section>
    )
  }
}
