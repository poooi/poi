import React from 'react'
import FontAwesome from 'react-fontawesome'
import { Button, ButtonGroup, FormControl, InputGroup, FormGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import i18next from 'views/env-parts/i18next'

import { gameRefreshPage, gameReloadFlash } from 'views/services/utils'

const { config, $ } = window
const wvStatus = {
  Loading: 0,
  Loaded: 1,
  Failed: 2,
}

import '../assets/navigator-bar.css'

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
    const webview = $('kan-game webview')
    webview.addEventListener('did-start-loading', this.onStartLoading)
    webview.addEventListener('did-stop-loading', this.onStopLoading)
    webview.addEventListener('did-fail-load', this.onFailLoad)
    webview.addEventListener('will-navigate', this.onWillNavigate)
  }
  componentWillUnmount() {
    const webview = $('kan-game webview')
    webview.removeEventListener('did-start-loading', this.onStartLoading)
    webview.removeEventListener('did-stop-loading', this.onStopLoading)
    webview.removeEventListener('did-fail-load', this.onFailLoad)
    webview.removeEventListener('will-navigate', this.onWillNavigate)
  }
  // Webview Event
  onStartLoading = (e) => {
    this.setState({
      status: wvStatus.Loading,
    })
  }
  onStopLoading = (e) => {
    const webview = $('kan-game webview')
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
    const webview = $('kan-game webview')
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
    const webview = $('kan-game webview')
    webview.stop()
  }
  onClickHomepage = (e) => {
    config.set('poi.homepage', this.state.url)
  }
  onRightClickHomepage = (e) => {
    this.navigate(config.get('poi.homepage'))
  }

  render() {
    const {status} = this.state

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
                placeholder={i18next.t('setting:Input address')}
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
            <OverlayTrigger placement='top' overlay={<Tooltip id='nav-homepage'><Trans>setting:Set as homepage</Trans></Tooltip>}>
              <Button bsSize='small' onClick={this.onClickHomepage} onContextMenu={this.onRightClickHomepage}><FontAwesome name='bookmark' /></Button>
            </OverlayTrigger>
          </ButtonGroup>
        </div>
      </div>
    )
  }
}
