import React from 'react'
import FontAwesome from 'react-fontawesome'
import { Button, ButtonGroup, FormControl, InputGroup, FormGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { translate } from 'react-i18next'

import { gameRefreshPage, gameReloadFlash } from 'views/services/utils'

const { config, getStore } = window
const wvStatus = {
  Loading: 0,
  Loaded: 1,
  Failed: 2,
}

import '../assets/navigator-bar.css'

@translate(['setting'])
export class NavigatorBar extends React.Component {
  constructor() {
    super()
    config.setDefault('poi.homepage', 'http://www.dmm.com/netgame/social/application/-/detail/=/app_id=854854/')
    this.state = {
      status: 1,
      url: config.get('poi.homepage'),
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
      } catch (e) {
        setTimeout(load, 1000)
      }
    }
    load()
  }
  componentWillUnmount() {
    try {
      const webview = getStore('layout.webview.ref')
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
      url: webview.getURL(),
    })
  }
  onFailLoad = (e) => {
    this.setState({
      status: wvStatus.Failed,
    })
  }
  onWillNavigate = (e) => {
    this.setState({
      url: e.url,
    })
  }
  // UI Interaction
  navigate(url) {
    const webview = getStore('layout.webview.ref')
    if (!(url.startsWith('http://') || url.startsWith('https://'))) {
      url = `http://${this.state.url}`
    }
    webview.loadURL(url)
    this.setState({
      url: url,
    })
  }
  onChangeUrl = (e) => {
    this.setState({
      url: e.target.value,
    })
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
    config.set('poi.homepage', this.state.url)
  }
  onRightClickHomepage = (e) => {
    this.navigate(config.get('poi.homepage'))
  }

  render() {
    const { status } = this.state
    const { t } = this.props

    let statusIcon
    if (status === wvStatus.Loading) {
      statusIcon = <div><FontAwesome name='spinner' pulse /></div>
    }
    if (status === wvStatus.Failed) {
      statusIcon = <div><FontAwesome name='times' /></div>
    }

    let navigateAction, navigateIcon
    if (status === wvStatus.Loading) {
      navigateAction = this.onClickStop
      navigateIcon   = <FontAwesome name='times' />
    } else {
      navigateAction = this.onClickNavigate
      navigateIcon   = <FontAwesome name='arrow-right' />
    }

    return (
      <div className='navigator'>
        <div className='navigator-url'>
          <FormGroup>
            <InputGroup bsSize='small' style={{width: '100%'}}>
              <FormControl type='text'
                placeholder={t('setting:Input address')}
                className={statusIcon? 'navigator-status' : 'navigator-no-status'}
                value={this.state.url}
                onChange={this.onChangeUrl}
                onKeyDown={this.onKeydown} />
              {statusIcon ? <FormControl.Feedback>
                {statusIcon}
              </FormControl.Feedback> : null}
            </InputGroup>
          </FormGroup>
        </div>
        <div className='navigator-btn'>
          <ButtonGroup>
            <Button bsSize='small' bsStyle='primary' onClick={navigateAction}>{navigateIcon}</Button>
            <Button bsSize='small' bsStyle='warning' onClick={gameRefreshPage} onContextMenu={gameReloadFlash}><FontAwesome name='refresh' /></Button>
          </ButtonGroup>
          <ButtonGroup style={{marginLeft: 5}}>
            <OverlayTrigger placement='top' overlay={<Tooltip id='nav-homepage'>{t('setting:Set as homepage')}</Tooltip>}>
              <Button bsSize='small' onClick={this.onClickHomepage} onContextMenu={this.onRightClickHomepage}><FontAwesome name='bookmark' /></Button>
            </OverlayTrigger>
          </ButtonGroup>
        </div>
      </div>
    )
  }
}
