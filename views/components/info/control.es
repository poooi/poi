/* global config, toggleModal, getStore, toast */
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
const ipc = remote.require('./lib/ipc')

import './assets/control.css'

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
  editable: get(state, 'config.poi.layout.editable', false),
}))
export class PoiControl extends Component {
  static propTypes = {
    muted: PropTypes.bool,
  }
  state = {
    extend: false,
  }
  handleCapturePage = toClipboard => {
    getStore('layout.webview.ref').executeJavaScript(`(function() {
      const canvas = document.querySelector('#game_frame') ? document.querySelector('#game_frame').contentDocument.querySelector('#htmlWrap').contentDocument.querySelector('canvas')
        : document.querySelector('#htmlWrap') ? document.querySelector('#htmlWrap').contentDocument.querySelector('canvas')
          : document.querySelector('canvas') ? document.querySelector('canvas') : null
      if (!canvas || !ImageCapture) return false
      new ImageCapture(canvas.captureStream(0).getVideoTracks()[0]).grabFrame().then((imageBitmap) => {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = imageBitmap.width
        tempCanvas.height = imageBitmap.height
        tempCanvas.getContext('2d').drawImage(imageBitmap, 0, 0)
        return tempCanvas.toDataURL()
      }).then(dataURL => {
        const ss = ipc.access('screenshot');
        if (ss && ss.onScreenshotCaptured) ss.onScreenshotCaptured({dataURL, toClipboard: ${!!toClipboard}})
        return true
      }).catch(() => false)
    })()`)
  }
  handleScreenshotCaptured = ({dataURL, toClipboard}) => {
    const screenshotPath = config.get('poi.screenshotPath', remote.getGlobal('DEFAULT_SCREENSHOT_PATH'))
    const usePNG = config.get('poi.screenshotFormat', 'png') === 'png'

    const image = nativeImage.createFromDataURL(dataURL)
    if (toClipboard) {
      clipboard.writeImage(image)
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
  }
  handleOpenCacheFolder = () => {
    try {
      const dir = config.get('poi.misc.cache.path', remote.getGlobal('DEFAULT_CACHE_PATH'))
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
    let dir = config.get('poi.misc.cache.path', remote.getGlobal('DEFAULT_CACHE_PATH'))
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
      const screenshotPath = config.get('poi.misc.screenshot.path', remote.getGlobal('DEFAULT_SCREENSHOT_PATH'))
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
  editableTimeout = 0
  editableConfigList = [
    'poi.mainpanel.layout',
    'poi.webview.ratio.horizontal',
    'poi.webview.ratio.vertical',
    'poi.tabarea.overlaypanelwidth',
    'poi.tabarea.mainpanelwidth',
    'poi.tabarea.mainpanelheight',
  ]
  enableEditableMsg() {
    toast(this.props.t('If no changes, panel will be locked automatically in 1 minute'), {
      title: this.props.t('Panel unlocked'),
    })
    this.disableEditableMsg()
  }
  disableEditableMsg() {
    clearTimeout(this.editableTimeout)
    this.editableTimeout = setTimeout(() => {
      config.set('poi.layout.editable', false)
      toast(this.props.t('You can unlock it manually'), {
        title: this.props.t('Panel locked'),
      })
    }, 60000)
  }
  handleConfigChange = (path, value) => {
    if (this.editableConfigList.includes(path)) {
      if (this.props.editable) {
        this.disableEditableMsg()
      }
    }
  }
  handleSetEditable = () => {
    if (!this.props.editable) {
      this.enableEditableMsg()
    } else {
      clearTimeout(this.editableTimeout)
    }
    config.set('poi.layout.editable', !this.props.editable)
  }
  handleOpenDevTools = () => {
    // openFocusedWindowDevTools()
    remote.getCurrentWindow().openDevTools({mode: 'detach'})
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
          style: 'warning' },
        { name: this.props.t('Reload Flash'),
          func: gameReloadFlash,
          style: 'danger' },
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
            style: 'warning' },
          { name: this.props.t('Reload Flash'),
            func: gameReloadFlash,
            style: 'danger' },
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
  touchbarListener = (event, message) => {
    this.handleTouchbar(message)
  }
  componentDidMount = () => {
    if (this.props.editable) {
      this.disableEditableMsg()
    }
    config.addListener('config.set', this.handleConfigChange)
    //Stateless touchbar input receiver
    if (process.platform === 'darwin') {
      require('electron').ipcRenderer.addListener('touchbar', this.touchbarListener)
    }
    // Add Screenshot handler
    if (!ipc.access('screenshot')) {
      ipc.register('screenshot', {
        onScreenshotCaptured: this.handleScreenshotCaptured,
      })
    }
  }
  componentWillUnmount = () => {
    config.removeListener('config.set', this.handleConfigChange)
    if (process.platform === 'darwin') {
      require('electron').ipcRenderer.removeListener('touchbar', this.touchbarListener)
    }
  }
  render() {
    if (process.platform === 'darwin') {
      const { touchBarReInit } = remote.require('./lib/touchbar')
      touchBarReInit()
    }
    return (
      <div className="poi-control-container">
        <OverlayTrigger placement="right" overlay={<Tooltip id="poi-developers-tools-button" className="poi-control-tooltip">{this.props.t('Developer Tools')}</Tooltip>}>
          <Button onClick={this.handleOpenDevTools} onContextMenu={this.handleOpenWebviewDevTools} bsSize="small"><FontAwesome name="terminal" /></Button>
        </OverlayTrigger>
        <OverlayTrigger placement="right" overlay={<Tooltip id="poi-screenshot-button" className="poi-control-tooltip">{this.props.t('Take a screenshot')}</Tooltip>}>
          <Button onClick={() => this.handleCapturePage(false)} onContextMenu={() => this.handleCapturePage(true)} bsSize="small"><FontAwesome name="camera-retro" /></Button>
        </OverlayTrigger>
        <OverlayTrigger placement="right" overlay={<Tooltip id="poi-volume-button" className="poi-control-tooltip">{this.props.muted ? this.props.t('Volume on') : this.props.t('Volume off')}</Tooltip>}>
          <Button onClick={this.handleSetMuted} bsSize="small" className={this.props.muted ? 'active' : ''}><FontAwesome name={this.props.muted ? 'volume-off' : 'volume-up'} /></Button>
        </OverlayTrigger>
        <Collapse in={this.state.extend} dimension="width" className="poi-control-extender">
          <div>
            <OverlayTrigger placement="right" overlay={<Tooltip id="poi-cache-button" className="poi-control-tooltip">{this.props.t('Open cache dir')}</Tooltip>}>
              <Button onClick={this.handleOpenCacheFolder}  onContextMenu={this.handleOpenMakaiFolder} bsSize="small"><FontAwesome name="bolt" /></Button>
            </OverlayTrigger>
            <OverlayTrigger placement="right" overlay={<Tooltip id="poi-screenshot-dir-button" className="poi-control-tooltip">{this.props.t('Open screenshot dir')}</Tooltip>}>
              <Button onClick={this.handleOpenScreenshotFolder} bsSize="small"><FontAwesome name="photo" /></Button>
            </OverlayTrigger>
            <OverlayTrigger placement="right" overlay={<Tooltip id="poi-adjust-button" className="poi-control-tooltip">{this.props.t('Auto adjust')}</Tooltip>}>
              <Button onClick={this.handleJustifyLayout} onContextMenu={this.handleUnlockWebview} bsSize="small"><FontAwesome name="arrows-alt" /></Button>
            </OverlayTrigger>
            <OverlayTrigger placement="right" overlay={<Tooltip id="poi-volume-button" className="poi-control-tooltip">{this.props.editable ? this.props.t('Lock panel') : this.props.t('Unlock panel')}</Tooltip>}>
              <Button onClick={this.handleSetEditable} bsSize="small"><FontAwesome name={this.props.editable ? 'pencil-square' : 'pencil-square-o'} /></Button>
            </OverlayTrigger>
            <OverlayTrigger placement="right" overlay={<Tooltip id="poi-refresh-button" className="poi-control-tooltip">{this.props.t('Refresh game')}</Tooltip>}>
              <Button
                onClick={this.handleRefreshGameDialog}
                onContextMenu={gameReloadFlash}
                bsSize="small"><FontAwesome name="refresh" />
              </Button>
            </OverlayTrigger>
          </div>
        </Collapse>
        <Button onClick={this.handleSetExtend} bsSize="small" className={this.state.extend ? 'active' : ''}><FontAwesome name={this.state.extend ? 'angle-left' : 'angle-right'} /></Button>
      </div>
    )
  }
}
