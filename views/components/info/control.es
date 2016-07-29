import fs from 'fs-extra'
import path from 'path-extra'
import React from 'react'
import { shell, remote } from 'electron'
import { Button, OverlayTrigger, Tooltip, Collapse } from 'react-bootstrap'
import { connect } from 'react-redux'
import { get } from 'lodash'
import FontAwesome from 'react-fontawesome'

const {$, i18n, config, APPDATA_PATH} = window
const {openItem} = shell
const __ = i18n.others.__.bind(i18n.others)

// Controller icon bar
const {capturePageInMainWindow} = remote.require('./lib/utils')
const {openFocusedWindowDevTools} = remote.require('./lib/window')

config.on('config.set', (path, value) => {
  switch (path) {
  case 'poi.content.muted':
    $('kan-game webview').setAudioMuted(value)
    break
  default:
  }
})

const PoiControl = connect((state, props) => ({
  muted: get(state, 'config.poi.content.muted', false),
}))(class poiControl extends React.Component {
  static propTypes = {
    muted: React.PropTypes.bool,
  }
  state = {
    extend: false,
  }
  handleCapturePage = () => {
    const bound = $('kan-game webview').getBoundingClientRect()
    const rect = {
      x: Math.ceil(bound.left),
      y: Math.ceil(bound.top),
      width: Math.floor(bound.width),
      height: Math.floor(bound.height),
    }
    const d = process.platform == 'darwin' ? path.join(path.homedir(), 'Pictures', 'Poi') : path.join(APPDATA_PATH, 'screenshots')
    const screenshotPath = config.get('poi.screenshotPath', d)
    capturePageInMainWindow( rect, screenshotPath , (err, filename) => {
      if (err) {
        window.error(__('Failed to save the screenshot'))
      } else {
        window.success(`${__('screenshot saved to')} ${filename}`)
      }
    })
  }
  handleOpenCacheFolder = () => {
    try {
      const dir = config.get('poi.cachePath', remote.getGlobal('DEFAULT_CACHE_PATH'))
      fs.ensureDirSync(dir)
      fs.ensureDirSync(path.join(dir, 'KanColle'))
      fs.ensureDirSync(path.join(dir, 'ShiroPro'))
      fs.ensureDirSync(path.join(dir, 'Shinken'))
      fs.ensureDirSync(path.join(dir, 'Kanpani'))
      fs.ensureDirSync(path.join(dir, 'FlowerKnightGirls'))
      fs.ensureDirSync(path.join(dir, 'ToukenRanbu'))
      openItem(dir)
    }
    catch (e) {
      window.toggleModal(__('Open cache dir'), __("Failed. Perhaps you don't have permission to it."))
    }
  }
  handleOpenMakaiFolder = () => {
    let dir = config.get('poi.cachePath', remote.getGlobal('DEFAULT_CACHE_PATH'))
    dir = path.join(dir, 'kancolle', 'kcs', 'resources', 'swf', 'ships')
    try {
      fs.ensureDirSync(dir)
      openItem(dir)
    } catch (e) {
      window.toggleModal(__('Open makai dir'), __("Failed. Perhaps you don't have permission to it."))
    }
  }
  handleOpenScreenshotFolder = () => {
    try {
      const d = process.platform == 'darwin' ? path.join(path.homedir(), 'Pictures', 'Poi') : path.join(APPDATA_PATH, 'screenshots')
      const screenshotPath = config.get('poi.screenshotPath', d)
      fs.ensureDirSync(screenshotPath)
      openItem(screenshotPath)
    }
    catch (e) {
      window.toggleModal(__('Open screenshot dir'), __("Failed. Perhaps you don't have permission to it."))
    }
  }
  handleSetMuted = () => {
    config.set('poi.content.muted', !this.props.muted)
  }
  handleOpenDevTools = () => {
    openFocusedWindowDevTools()
  }
  handleOpenWebviewDevTools = () => {
    $('kan-game webview').openDevTools({detach: true})
  }
  handleJustifyLayout = (e) => {
    window.dispatchEvent(new Event('resize'))
    e.preventDefault()
  }
  handleUnlockWebview = () => {
    $('kan-game webview').executeJavaScript('window.unalign()')
  }
  handleSetExtend = () => {
    this.setState({extend: !this.state.extend})
  }
  sendEvent = (isExtend) => {
    const event = new CustomEvent('alert.change', {
      bubbles: true,
      cancelable: true,
      detail: {
        isExtend: isExtend,
      },
    })
    window.dispatchEvent(event)
  }
  render() {
    return (
      <div className='poi-control-container'>
        <OverlayTrigger placement='right' overlay={<Tooltip id='poi-developers-tools-button' className='poi-control-tooltip'>{__('Developer Tools')}</Tooltip>}>
          <Button onClick={this.handleOpenDevTools} onContextMenu={this.handleOpenWebviewDevTools} bsSize='small'><FontAwesome name='gears' /></Button>
        </OverlayTrigger>
        <OverlayTrigger placement='right' overlay={<Tooltip id='poi-screenshot-button' className='poi-control-tooltip'>{__('Take a screenshot')}</Tooltip>}>
          <Button onClick={this.handleCapturePage} bsSize='small'><FontAwesome name='camera-retro' /></Button>
        </OverlayTrigger>
        <OverlayTrigger placement='right' overlay={<Tooltip id='poi-volume-button' className='poi-control-tooltip'>{this.props.muted ? __('Volume on') : __('Volume off')}</Tooltip>}>
          <Button onClick={this.handleSetMuted} bsSize='small' className={this.props.muted ? 'active' : ''}><FontAwesome name={this.props.muted ? 'volume-off' : 'volume-up'} /></Button>
        </OverlayTrigger>
        <Collapse in={this.state.extend} onExited={this.sendEvent.bind(this, false)} onEntered={this.sendEvent.bind(this, true)} dimension='width' className="poi-control-extender">
          <div>
            <OverlayTrigger placement='right' overlay={<Tooltip id='poi-cache-button' className='poi-control-tooltip'>{__('Open cache dir')}</Tooltip>}>
              <Button onClick={this.handleOpenCacheFolder}  onContextMenu={this.handleOpenMakaiFolder} bsSize='small'><FontAwesome name='bolt' /></Button>
            </OverlayTrigger>
            <OverlayTrigger placement='right' overlay={<Tooltip id='poi-screenshot-dir-button' className='poi-control-tooltip'>{__('Open screenshot dir')}</Tooltip>}>
              <Button onClick={this.handleOpenScreenshotFolder} bsSize='small'><FontAwesome name='photo' /></Button>
            </OverlayTrigger>
            <OverlayTrigger placement='right' overlay={<Tooltip id='poi-adjust-button' className='poi-control-tooltip'>{__('Auto adjust')}</Tooltip>}>
              <Button onClick={this.handleJustifyLayout} onContextMenu={this.handleUnlockWebview} bsSize='small'><FontAwesome name='arrows-alt' /></Button>
            </OverlayTrigger>
          </div>
        </Collapse>
        <Button onClick={this.handleSetExtend} bsSize='small' className={this.state.extend ? 'active' : ''}><FontAwesome name={this.state.extend ? 'angle-left' : 'angle-right'} /></Button>
      </div>
    )
  }
})

export { PoiControl }
