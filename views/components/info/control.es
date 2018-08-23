import fs from 'fs-extra'
import path from 'path-extra'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { shell, remote, clipboard, nativeImage } from 'electron'
import { Button, OverlayTrigger, Tooltip, Collapse } from 'react-bootstrap'
import { connect } from 'react-redux'
import { get } from 'lodash'
import FontAwesome from 'react-fontawesome'
import { gameRefreshPage, gameReloadFlash } from 'views/services/utils'
import { translate, Trans } from 'react-i18next'

import './assets/control.css'

const { config, toggleModal, getStore } = window
const { openExternal } = shell

const openItemAsync = (dir, source=null) => {
  openExternal(`file://${dir}`, {}, err => {
    if (err) {
      const prefix = (source && `${source}: `) || ''
      console.error(`${prefix}Failed to open item "${dir}" asynchronously`, err)
    }
  })
}

// Controller icon bar
// const {openFocusedWindowDevTools} = remote.require('./lib/window')

@translate()
@connect((state, props) => ({
  muted: get(state, 'config.poi.content.muted', false),
  editable: get(state, 'config.poi.layouteditable', false),
}))
export class PoiControl extends Component {
  static propTypes = {
    muted: PropTypes.bool,
  }
  state = {
    extend: false,
  }
  handleCapturePage = toClipboard => {
    const { width, height, windowWidth, windowHeight } = window.getStore('layout.webview')
    const isolate = config.get('poi.isolateGameWindow', false)
    const scWidth = isolate ? windowWidth : width
    const scHeight = isolate ? windowHeight : height
    const rect = {
      x: 0,
      y: 0,
      width: Math.floor(scWidth * devicePixelRatio),
      height: Math.floor(scHeight * devicePixelRatio),
    }
    const screenshotPath = config.get('poi.screenshotPath', remote.getGlobal('DEFAULT_SCREENSHOT_PATH'))
    const usePNG = config.get('poi.screenshotFormat', 'png') === 'png'
    getStore('layout.webview.ref').getWebContents().capturePage(rect, image => {
      image = image.resize({ width: Math.floor(scWidth), height: Math.floor(scHeight) })
      if (toClipboard) {
        clipboard.writeImage(nativeImage.createFromDataURL(image.toDataURL()))
        window.success(this.props.t('screenshot saved to clipboard'))
      } else {
        const buf = usePNG ? image.toPNG() : image.toJPEG(80)
        const now = new Date()
        const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}T${now.getHours()}.${now.getMinutes()}.${now.getSeconds()}`
        fs.ensureDirSync(screenshotPath)
        const filename = path.join(screenshotPath, `${date}.${usePNG ? 'png' : 'jpg'}`)
        fs.writeFile(filename, buf).then(() => {
          window.success(`${this.props.t('screenshot saved to')} ${filename}`)
        }).catch(err => {
          window.error(this.props.t('Failed to save the screenshot'))
        })
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
      openItemAsync(dir, 'handleOpenCacheFolder')
    }
    catch (e) {
      window.toggleModal(this.props.t('Open cache dir'), this.props.t('NoPermission'))
    }
  }
  handleOpenMakaiFolder = () => {
    let dir = config.get('poi.cachePath', remote.getGlobal('DEFAULT_CACHE_PATH'))
    dir = path.join(dir, 'KanColle', 'kcs2', 'resources', 'ship')
    try {
      fs.ensureDirSync(dir)
      openItemAsync(dir, 'handleOpenMakaiFolder')
    } catch (e) {
      window.toggleModal(this.props.t('Open makai dir'), this.props.t('NoPermission'))
    }
  }
  handleOpenScreenshotFolder = () => {
    try {
      const screenshotPath = config.get('poi.screenshotPath', remote.getGlobal('DEFAULT_SCREENSHOT_PATH'))
      fs.ensureDirSync(screenshotPath)
      openItemAsync(screenshotPath,'handleOpenScreenshotFolder')
    }
    catch (e) {
      window.toggleModal(this.props.t('Open screenshot dir'), this.props.t('NoPermission'))
    }
  }
  handleSetMuted = () => {
    config.set('poi.content.muted', !this.props.muted)
  }
  handleSetEditable = () => {
    config.set('poi.layouteditable', !this.props.editable)
  }
  handleOpenDevTools = () => {
    // openFocusedWindowDevTools()
    remote.getCurrentWindow().openDevTools()
  }
  handleOpenWebviewDevTools = () => {
    getStore('layout.webview.ref').openDevTools({mode: 'detach'})
  }
  handleJustifyLayout = (e) => {
    getStore('layout.webview.ref').executeJavaScript('window.align()')
    e.preventDefault()
  }
  handleUnlockWebview = () => {
    getStore('layout.webview.ref').executeJavaScript('window.unalign()')
  }
  handleRefreshGameDialog = (e) => {
    if (e.shiftKey) {
      gameRefreshPage()
      return
    }

    toggleModal(
      this.props.t('Confirm Refreshing'),
      <div>
        <Trans i18nKey="RefreshGameDialogTip">
          Are you sure to refresh the game?
          <ul>
            <li>Refresh page is the same as pressing F5.</li>
            <li>Reload Flash reloads only the Flash part, this is usually faster but could result in catbomb.</li>
          </ul>
          Tip: Right clicking on this button reloads Flash and Left clicking with Shift key pressed refreshes the page, both are <b>without confirmation</b>, use at your own risk.
        </Trans>
      </div>,
      [
        { name: this.props.t('Refresh page'),
          func: gameRefreshPage,
          style: "warning" },
        { name: this.props.t('Reload Flash'),
          func: gameReloadFlash,
          style: "danger" },
      ])
  }
  handleSetExtend = () => {
    this.setState({extend: !this.state.extend})
  }
  handleTouchbar = (props) => {
    //load Touchbar-related functions only when touchbar is triggered
    const {refreshconfirm, touchBarReset} = remote.require('./lib/touchbar')
    //workaround for the input event not defined
    switch (props) {
    case 'refresh':
      toggleModal(
        this.props.t('Confirm Refreshing'),
        <div>
          <Trans i18nKey="RefreshGameDialogTip">
            Are you sure to refresh the game?
            <ul>
              <li>Refresh page is the same as pressing F5.</li>
              <li>Reload Flash reloads only the Flash part, this is usually faster but could result in catbomb.</li>
            </ul>
            Tip: Right clicking on this button reloads Flash and Left clicking with Shift key pressed refreshes the page, both are <b>without confirmation</b>, use at your own risk.
          </Trans>
        </div>,
        [
          { name: this.props.t('Refresh page'),
            func: gameRefreshPage,
            style: "warning" },
          { name: this.props.t('Reload Flash'),
            func: gameReloadFlash,
            style: "danger" },
        ],
        () => {touchBarReset()}
      )
      refreshconfirm(this.props.t('Refresh page'), this.props.t('Reload Flash'))
      break
    case 'adjust':
      window.dispatchEvent(new Event('resize'))
      break
    case 'unlock':
      this.handleUnlockWebview()
      break
    case 'screenshotdir':
      this.handleOpenScreenshotFolder()
      break
    case 'cachedir':
      this.handleOpenCacheFolder()
      break
    case 'volume':
      this.handleSetMuted()
      break
    case 'screenshot':
      this.handleCapturePage()
      break
    case 'gameReloadFlash':
      gameReloadFlash()
      break
    case 'gameRefreshPage':
      gameRefreshPage()
      break
    case 'edit':
      this.handleSetEditable()
      break
    default:
    }
  }
  componentDidMount = () => {
    //Stateless touchbar input receiver
    if (process.platform === 'darwin') {
      require('electron').ipcRenderer.on('touchbar', (event, message) => {
        this.handleTouchbar(message)
      })
    }
  }
  render() {
    if (process.platform === 'darwin') {
      const { touchBarReInit } = remote.require('./lib/touchbar')
      touchBarReInit()
    }
    return (
      <div className='poi-control-container'>
        <OverlayTrigger placement='right' overlay={<Tooltip id='poi-developers-tools-button' className='poi-control-tooltip'>{this.props.t('Developer Tools')}</Tooltip>}>
          <Button onClick={this.handleOpenDevTools} onContextMenu={this.handleOpenWebviewDevTools} bsSize='small'><FontAwesome name='terminal' /></Button>
        </OverlayTrigger>
        <OverlayTrigger placement='right' overlay={<Tooltip id='poi-screenshot-button' className='poi-control-tooltip'>{this.props.t('Take a screenshot')}</Tooltip>}>
          <Button onClick={() => this.handleCapturePage(false)} onContextMenu={() => this.handleCapturePage(true)} bsSize='small'><FontAwesome name='camera-retro' /></Button>
        </OverlayTrigger>
        <OverlayTrigger placement='right' overlay={<Tooltip id='poi-volume-button' className='poi-control-tooltip'>{this.props.muted ? this.props.t('Volume on') : this.props.t('Volume off')}</Tooltip>}>
          <Button onClick={this.handleSetMuted} bsSize='small' className={this.props.muted ? 'active' : ''}><FontAwesome name={this.props.muted ? 'volume-off' : 'volume-up'} /></Button>
        </OverlayTrigger>
        <Collapse in={this.state.extend} dimension='width' className="poi-control-extender">
          <div>
            <OverlayTrigger placement='right' overlay={<Tooltip id='poi-cache-button' className='poi-control-tooltip'>{this.props.t('Open cache dir')}</Tooltip>}>
              <Button onClick={this.handleOpenCacheFolder}  onContextMenu={this.handleOpenMakaiFolder} bsSize='small'><FontAwesome name='bolt' /></Button>
            </OverlayTrigger>
            <OverlayTrigger placement='right' overlay={<Tooltip id='poi-screenshot-dir-button' className='poi-control-tooltip'>{this.props.t('Open screenshot dir')}</Tooltip>}>
              <Button onClick={this.handleOpenScreenshotFolder} bsSize='small'><FontAwesome name='photo' /></Button>
            </OverlayTrigger>
            <OverlayTrigger placement='right' overlay={<Tooltip id='poi-adjust-button' className='poi-control-tooltip'>{this.props.t('Auto adjust')}</Tooltip>}>
              <Button onClick={this.handleJustifyLayout} onContextMenu={this.handleUnlockWebview} bsSize='small'><FontAwesome name='arrows-alt' /></Button>
            </OverlayTrigger>
            <OverlayTrigger placement='right' overlay={<Tooltip id='poi-volume-button' className='poi-control-tooltip'>{this.props.t('Arrange panel')}</Tooltip>}>
              <Button onClick={this.handleSetEditable} bsSize='small'><FontAwesome name={this.props.editable ? 'pencil-square' : 'pencil-square-o'} /></Button>
            </OverlayTrigger>
            <OverlayTrigger placement='right' overlay={<Tooltip id='poi-refresh-button' className='poi-control-tooltip'>{this.props.t('Refresh game')}</Tooltip>}>
              <Button
                onClick={this.handleRefreshGameDialog}
                onContextMenu={gameReloadFlash}
                bsSize='small'><FontAwesome name='refresh' />
              </Button>
            </OverlayTrigger>
          </div>
        </Collapse>
        <Button onClick={this.handleSetExtend} bsSize='small' className={this.state.extend ? 'active' : ''}><FontAwesome name={this.state.extend ? 'angle-left' : 'angle-right'} /></Button>
      </div>
    )
  }
}
