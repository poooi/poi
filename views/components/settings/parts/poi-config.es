import { join } from 'path-extra'
import { statSync, ensureDirSync } from 'fs-extra'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { Component } from 'react'
import { Grid, Col, Row, Button, ButtonGroup, Input, Alert, OverlayTrigger, Tooltip, Collapse, Well } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { remote, shell, ipcRenderer } from 'electron'
import mousetrap from 'mousetrap'
import { get, set } from 'lodash'
import Divider from './divider'
import NavigatorBar from './navigator-bar'


const { dialog } = remote.require('electron')
const { ROOT, config, toggleModal, APPDATA_PATH } = window
const __ = i18n.setting.__.bind(i18n.setting)
const __n = i18n.setting.__n.bind(i18n.setting)
const { showItemInFolder, openItem } = shell

const defaultAs = (stateVal, defaultVal) =>
  ((typeof stateVal === "undefined") ? defaultVal : stateVal)


const confGet = (target, path, value) =>
  ((typeof get(target, path) === "undefined") ? value : get(target, path))

let language = navigator.language
if (!(language in ['zh-CN', 'zh-TW', 'ja-JP', 'en-US', 'ko-KR'])) {
  switch (language.substr(0, 1).toLowerCase()) {
    case 'zh':
      language = 'zh-TW';
      break;
    case 'ja':
      language = 'ja-JP';
      break;
    case 'ko':
      language = 'ko-KR';
      break;
    default:
      language = 'en-US';
  }
}


config.on('config.set', (path, value) => {
  switch(path) {
    case 'poi.notify.expedition.value':
      window.notify.expedition = value
      break
    case 'poi.notify.morale.value':
      window.notify.morale = value
      break
    case 'poi.language':
      for (let namespace in window.i18n) {
        window.i18n[namespace].setLocale(value)
      }
      window.language = value
      break
  }
})

const SetNotifyIndividualConfig = connect(() => {
  return (state, props) =>
    confGet(state.config, 'poi.notify', {})
})(class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      timeSettingShow: false,
      moraleValue: confGet(props, 'morale.value', 49),
      expeditionValue: confGet(props, 'expedition.value', 60),
    }
  }
  handleSetNotify = (path) => {
    config.set(`poi.notify.${path}`, !confGet(this.props, path, true))
  }
  handleChangeNotifyVolume = (e) => {
    let volume = this.refs.notifyVolume.getValue()
    volume = parseFloat(volume)
    if (isNaN(volume)) {
      return
    }
    config.set('poi.notify.volume', volume)
  }
  handleEndChangeNotifyVolume = (e) => {
    window.notify(null)
  }
  handleSetTimeSettingShow = () => {
    let timeSettingShow = !this.state.timeSettingShow
    this.setState({timeSettingShow})
  }
  selectInput = (id) => {
    document.getElementById(id).select()
  }
  handleSetExpedition = (e) => {
    let value = parseInt(e.target.value) || 0
    if (isNaN(value) || value < 0) {
      return
    }
    this.setState({expeditionValue: value})
  }
  handleSetMorale = (e) => {
    let value = parseInt(e.target.value) || 0
    if (isNaN(value) || value < 0) {
      return
    }
    this.setState({moraleValue: value})
  }
  saveNotifySetting = () => {
    let {moraleValue, expeditionValue} = this.state
    config.set('poi.notify.expedition.value', expeditionValue)
    config.set('poi.notify.morale.value', moraleValue)
    this.setState({timeSettingShow: false})
  }
  render () {
    return (
      <Grid>
        <div>
          <Col xs={6}>
            <Button
              bsStyle={(confGet(this.props, 'enabled', true)) ? 'success' : 'danger'}
              onClick={this.handleSetNotify.bind(this, 'enabled')}
              style={{width: '100%'}}>
              {notify.enabled ? '√ ' : ''}{__('Enable notification')}
            </Button>
          </Col>
          <Col xs={6}>
            <OverlayTrigger placement='top' overlay={
                <Tooltip id='poiconfig-volume'>{__('Volume')} <strong>{parseInt(notify.volume * 100)}%</strong></Tooltip>
              }>
              <Input type="range" ref="notifyVolume"
                onChange={this.handleChangeNotifyVolume} onMouseUp={this.handleEndChangeNotifyVolume}
                min={0.0} max={1.0} step={0.05} defaultValue={notify.volume} />
            </OverlayTrigger>
          </Col>
        </div>
        <div>
          <Col xs={12} style={{marginTop: 10}}>
            <ButtonGroup style={{display: 'flex'}}>
              <Button bsStyle={(confGet(this.props, 'construction.enabled', true)) ? 'success' : 'danger'}
                      onClick={this.handleSetNotify.bind(this, 'construction.enabled')}
                      className='notif-button'>
                {__('Construction')}
              </Button>
              <Button bsStyle={(confGet(this.props, 'expedition.enabled', true)) ? 'success' : 'danger'}
                      onClick={this.handleSetNotify.bind(this, 'expedition.enabled')}
                      className='notif-button'>
                {__('Expedition')}
              </Button>
              <Button bsStyle={(confGet(this.props, 'repair.enabled', true)) ? 'success' : 'danger'}
                      onClick={this.handleSetNotify.bind(this, 'repair.enabled')}
                      className='notif-button'>
                {__('Docking')}
              </Button>
              <Button bsStyle={(confGet(this.props, 'morale.enabled', true)) ? 'success' : 'danger'}
                      onClick={this.handleSetNotify.bind(this, 'morale.enabled')}
                      className='notif-button'>
                {__('Morale')}
              </Button>
              <Button bsStyle={(confGet(this.props, 'others.enabled', true)) ? 'success' : 'danger'}
                      onClick={this.handleSetNotify.bind(this, 'others.enabled')}
                      className='notif-button'>
                {__('Others')}
              </Button>
              <Button onClick={this.handleSetTimeSettingShow} bsStyle='primary' style={{width: 40}}>
                <FontAwesome name={this.state.timeSettingShow ? 'angle-up' : 'angle-down'} />
              </Button>
            </ButtonGroup>
            <Collapse in={this.state.timeSettingShow}>
              <div>
                <Well>
                  <Row>
                    <Col xs={9} className='notif-container'>
                      <div className='notif-input-desc'>{__('Expedition')}: {__('Notify when expedition returns in')}</div>
                    </Col>
                    <Col xs={3} className='notif-container'>
                      <Input type="number" ref="expeditionValue" id="expeditionValue"
                             disabled={!(confGet(this.props, 'expedition.enabled', true))}
                             onChange={this.handleSetExpedition}
                             onClick={this.selectInput.bind(this, "expeditionValue")}
                             bsSize='small'
                             addonAfter='S'
                             className='notif-input' />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={9} className='notif-container'>
                      <div className='notif-input-desc'>{__('Morale')}: {__('Notify when morale is greater than')}</div>
                    </Col>
                    <Col xs={3} className='notif-container'>
                      <Input type="number" ref="moraleValue" id="moraleValue"
                             disabled={!(confGet(this.props, 'morale.enabled', true))}
                             onChange={this.handleSetMorale}
                             onClick={this.selectInput.bind(this, "moraleValue")}
                             bsSize='small'
                             className='notif-input' />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={2} xsOffset={10}>
                      <Button bsSize='small' onClick={this.saveNotifySetting}>{__('Save')}</Button>
                    </Col>
                  </Row>
                </Well>
              </div>
            </Collapse>
          </Col>
        </div>
      </Grid>
    )
  }
})

const CheckboxLabelConfig = connect(() => {
  return (state, props) => ({
    value: confGet(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    undecided: props.undecided,
    label: props.label,
  })
})(class extends Component {
  handleChange = () => {
    config.set(this.props.configName, !this.props.value)
  }
  render () {
    return (
      <Row className={this.props.undecided ? 'undecided-checkbox-inside' : ''} >
        <Col xs={12} >
          <Grid>
            <Col xs={12} >
              <Input
                type="checkbox"
                label={this.props.label}
                disabled={this.props.undecided}
                checked={this.props.undecided ? false : this.props.value}
                onChange={this.props.undecided ? null : this.handleChange} />
            </Col>
          </Grid>
        </Col>
      </Row>
    )
  }
})

const FolderPickerConfig = connect(() => {
  return (state, props) => ({
    value: confGet(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    label: props.label
  })
})(class extends Component {
  onDrag = (e) => {
    e.preventDefault()
  }
  synchronize = (callback) => {
    if (this.lock) {
      return
    }
    this.lock = true
    callback()
    this.lock = false
  }
  setPath = (val) => {
    config.set(this.props.configName, val)
  }
  folderPickerOnDrop = (e) => {
    e.preventDefault()
    let droppedFiles = e.dataTransfer.files
    if (fs.statSync(droppedFiles[0].path).isDirectory()) {
      this.setPath(droppedFiles[0].path)
    }
  }
  folderPickerOnClick = () => {
    this.synchronize(() => {
      ensureDirSync(this.props.value)
      let filenames = dialog.showOpenDialog({
        title: this.props.label,
        defaultPath: this.props.value,
        properties: [
          'openDirectory',
          'createDirectory'
        ],
      })
      if (filenames !== undefined) {
        this.setPath(filenames[0])
      }
    })
  }
  render() {
    return (
      <Grid>
        <Col xs={12}>
          <div className="folder-picker"
               onClick={this.folderPickerOnClick}
               onDrop={this.folderPickerOnDrop}
               onDragEnter={this.onDrag}
               onDragOver={this.onDrag}
               onDragLeave={this.onDrag}>
            {this.props.value}
          </div>
        </Col>
      </Grid>
    )
  }
})

class ClearCacheCookieConfig extends Component {
  handleClearCookie = (e) => {
    remote.getCurrentWebContents().session.clearStorageData({storages: ['cookies']}, () => {
      toggleModal(__('Delete cookies'), __('Success!'))
    })
  }
  handleClearCache = (e) => {
    remote.getCurrentWebContents().session.clearCache(()=> {
      toggleModal(__('Delete cache'), __('Success!'))
    })
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <Button bsStyle="danger" onClick={this.handleClearCookie} style={{width: '100%'}}>
            {__('Delete cookies')}
          </Button>
        </Col>
        <Col xs={6}>
          <Button bsStyle="danger" onClick={this.handleClearCache} style={{width: '100%'}}>
            {__('Delete cache')}
          </Button>
        </Col>
        <Col xs={12}>
          <Alert bsStyle='warning' style={{marginTop: '10px'}}>
            {__('If connection error occurs frequently, delete both of them.')}
          </Alert>
        </Col>
      </Grid>
    )
  }
}

const SelectLanguageConfig = connect(() => {
  return (state, props) => ({
    value: confGet(state.config, 'poi.language', language)
  })
})(class extends Component {
  handleSetLanguage = () => {
    let language = this.refs.language.getValue()
    config.set('poi.language', language)
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <Input type="select" ref="language" value={this.props.value} onChange={this.handleSetLanguage}>
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">正體中文</option>
            <option value="ja-JP">日本語</option>
            <option value="en-US">English</option>
            <option value="ko-KR">한국어</option>
          </Input>
        </Col>
      </Grid>
    )
  }
})

const SlotCheckConfig = connect(() => {
  return (state, props) => ({
    type: props.type,
    conf: (confGet(state.config, `poi.mapStartCheck.${props.type}`, {
      enable: false,
      minFreeSlots: '',
    })),
  })
})(class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showInput: false,
      value: props.minFreeSlots,
    }
  }
  CheckValid = (v) =>
    (!isNaN(parseInt(v)) && parseInt(v) >= 0)
  handleToggleInput = () => {
    if (this.state.showInput) {
      this.handleDisable()
    } else {
      let num = this.state.value
      this.setState({
        showInput: true,
        value: this.CheckValid(num) ? num : ''
      })
    }
  }
  handleChange = (e) => {
    this.setState({value: e.target.value})
  }
  handleSubmit = (e) => {
    e.preventDefault()
    if (this.CheckValid(this.state.value)) {
      let n = parseInt(this.state.value)
      config.set(`poi.mapStartCheck.${this.props.type}`, {
        enable: true,
        minFreeSlots: n
      })
      this.setState({
        showInput: false,
        value: n
      })
    } else {
      this.handleDisable()
    }
  }
  handleDisable = () => {
    config.set(`poi.mapStartCheck.${this.props.type}.enable`, false)
    this.setState({showInput: false})
  }
  selectText = () => {
    this.textInput.getInputDOMNode().select()
  }
  render() {
    let toggleBtnStyle = this.props.conf.enable ? 'success' : 'default'
    if (this.state.showInput) {
      toggleBtnStyle = 'danger'
    }
    let toggleBtnTxt = this.props.conf.enable ? 'ON' : 'OFF'
    if (this.state.showInput) {
      toggleBtnTxt = __('Disable')
    }
    let toggleBtn = <Button onClick={this.handleToggleInput} bsSize='xs'
      bsStyle={toggleBtnStyle} style={{verticalAlign: 'text-bottom'}}>
      {toggleBtnTxt}
    </Button>
    let inputValid = this.CheckValid(this.state.value)
    let submitBtn = <Button type='submit'
      bsStyle={inputValid ? 'success' : 'danger'}>
      {inputValid ? __('Save') : __('Disable')}
    </Button>
    return (
      <div style={{margin: '5px 15px'}}>
        <form onSubmit={this.handleSubmit}>
          <div>
            {__(`${this.props.type} slots`)} {toggleBtn}
          </div>
          <Collapse in={this.state.showInput} onEntered={this.selectText}>
            <div>
              <Well>
                <Input type="text" bsSize='small'
                  bsStyle={inputValid ? 'success' : 'error'}
                  label={__(`Warn if the number of free ${this.props.type} slots is less than`)}
                  value={this.state.value}
                  ref={(r) => {this.textInput = r}}
                  onChange={this.handleChange}
                  buttonAfter={submitBtn} />
              </Well>
            </div>
          </Collapse>
        </form>
      </div>
    )
  }
})

const ShortcutConfig = connect(() => {
  return (state, props) => ({
    value: confGet(state.conf, 'poi.shortcut.bosskey', props.defaultVal),
    configName: props.configName,
  })
})(class extends Component {
  constructor (props) {
    super(props)
    this.state = {
      recording: false,
    }
  }
  displayText = () => {
    if (this.recording()) {
      return __('Press the key, or Esc to cancel')
    }
    else if (this.enabled()) {
      return `<${this.props.value}>`
    } else {
      return __('Disabled')
    }
  }
  active = () => ((typeof this.props.active == "undefined") ? true : this.props.active)
  showDisableButton = () => (this.active() && this.enabled() && !this.recording())
  recording = () => (this.state.recording)
  enabled = () => (!!this.props.value)
  handleClickAnywhere = (e) => {
    document.removeEventListener('mousedown', this.handleClickAnywhere)
    this.abortRecording()
  }
  keyShouldIgnore = (character, modifiers) => {
    if (character.length === 0) {
      return true
    }
    if (character.charCodeAt(0) < 32) {
      return true
    }
    return false
  }
  handleClickRecord = (e) => {
    this.constructor.prototype.listener = (character, modifiers, e) => {
      if (this.keyShouldIgnore(character, modifiers)) {
        return
      }
      this.constructor.prototype.listener = null
      if (character === 'esc' && modifiers.length === 0) {
        this.abortRecording()
      }
      else {
        this.setKey(character, modifiers)
      }
      document.addEventListener('mousedown', this.handleClickAnywhere)
      this.setState({recording: true})
    }
  }
  handleDisable = () => {
    this.setState({
      myval: null,
      recording: false,
    })
    this.newVal('')
  }
  abortRecording = () => {
    this.setState({recording: false})
  }
  transformKeyStr = (character, modifiers) => {
    let mapping = {
      shift: 'Shift',
      alt: 'Alt',
      ctrl: 'Ctrl',
      meta: ('ctrl' in modifiers) ? 'Cmd' : 'CmdOrCtrl',
      Del: 'Delete',
      Ins: 'Insert',
    }
    let str_modifiers = (() => {
      let i, len, results;
      results = []
      for (i = 0, len = modifiers.length; i < len; i++) {
        m = modifiers[i]
        results.push(mapping[m])
      }
      return results
    })()
    character = character[0].toUpperCase() + character.substr(1)
    let s = (str_modifiers.concat [mapping[character] || character]).join('+')
    return s
  }
  setKey = (character, modifiers) => {
    let s = this.transformKeyStr(character, modifiers)
    this.setState({
      myval: s,
      recording: false,
    })
    this.newVal(s)
  }
  newVal = (val) =>{
    config.set(this.props.configName, val)
    if (this.props.onNewVal) {
      this.props.onNewVal(val)
    }
  }
  render() {
    return (
      <div>
        <Col xs={12}>
          <ButtonGroup justified>
            <Button
              active={false}
              bsStyle="link"
              style={{width: '25%', align: 'left', cursor: 'default'}} >
              {this.props.label}
            </Button>
            <Button
              active={this.active()}
              disabled={!this.active() || this.recording()}
              bsStyle={!this.active() ? 'default' : (this.enabled() ? "success" : "danger")}
              onClick={this.recording() || (!this.active() ? null : this.handleClickRecord)}
              style={{width: '60%'}} >
              {this.displayText()}
            </Button>
            {
              this.showDisableButton() ?
                <Button bsStyle="danger"
                  onMouseDown={this.handleDisable}
                  style={{width: '15%'}}>
                  <i className="fa fa-times"></i>
                </Button>
              :
              null
            }
          </ButtonGroup>
        </Col>
      </div>
    )
  }
})

mousetrap.prototype.handleKey = (character, modifiers, e) => {
  if (e.type != 'keydown' || character in ['shift', 'alt', 'ctrl', 'meta']) {
    return
  }
  let fn = ShortcutConfig.prototype.listener
  if (fn) {
    fn.apply(this, argument)
  }
}

class PoiConfig extends Component {
  render() {
    return (
      <div>
        <div className="form-group" id='navigator-bar'>
          <Divider text={__('Browser')} />
          <NavigatorBar />
        </div>
        <div className="form-group">
          <Divider text={__('Notification')} />
          <SetNotifyIndividualConfig />
        </div>
        <div className="form-group" >
          <Divider text={__('Slot Check')} />
          <SlotCheckConfig type="ship" />
          <SlotCheckConfig type="item" />
        </div>
        <div className="form-group">
          <Divider text={__('Cache and cookies')} />
          <ClearCacheCookieConfig />
        </div>
        <div className="form-group">
          <Divider text={__('Language')} />
          <SelectLanguageConfig />
        </div>
        <div className="form-group">
          <Divider text={__('Screenshot Folder')} />
          <FolderPickerConfig
            label={__('Screenshot Folder')}
            configName="poi.screenshotPath"
            defaultVal={window.screenshotPath}
            onNewVal={(pathname) => {
              window.screenshotPath = pathname
            }} />
        </div>
        <div className="form-group">
          <Divider text={__('Cache Folder')} />
          <FolderPickerConfig
            label={__('Cache Folder')}
            configName="poi.cachePath"
            defaultVal={remote.getGlobal('DEFAULT_CACHE_PATH')} />
        </div>
        <div className="form-group">
          <Divider text={__('Other settings')} />
          <Grid>
            {
              (process.platform !== 'darwin') ?
                <ShortcutConfig
                  label={__('Boss key')}
                  configName="poi.shortcut.bosskey"
                  onNewVal={()=> ipcRenderer.send('refresh-shortcut')} />
              :
                <ShortcutConfig
                  label={__('Boss key')}
                  defaultVal="Cmd+H"
                  active={false} />
            }
            {
              (process.platform !== 'darwin') ?
                <CheckboxLabelConfig
                  label={__('Confirm before exit')}
                  configName="poi.confirm.quit"
                  defaultVal={false} />
              :
                <OverlayTrigger placement="top"
                  overlay={
                      <Tooltip id="tooltip-confirm-before-exit">
                        {__('Set this in the OS X App Menu')}
                      </Tooltip>} >
                  <div>
                    <CheckboxLabelConfig
                      label={__('Confirm before exit')}
                      undecided={true} />
                  </div>
                </OverlayTrigger>
            }
            <CheckboxLabelConfig
              label={__('Display \"Tips\"')}
              configName="poi.doyouknow.enabled"
              defaultVal={true} />
          </Grid>
        </div>
        <div className="form-group">
          <Divider text={__('Advanced functionalities')} />
          <Grid>
            <CheckboxLabelConfig
              label={__('Disable Hardware Acceleration')}
              configName="poi.disableHA"
              defaultVal={false} />
            <CheckboxLabelConfig
              label={__('Editing DMM Cookie\'s Region Flag')}
              configName="poi.enableDMMcookie"
              defaultVal={false} />
            <CheckboxLabelConfig
              label={__('Prevent DMM Network Change Popup')}
              configName="poi.disableNetworkAlert"
              defaultVal={false} />
            <CheckboxLabelConfig
              label={__('Show network status in notification bar')}
              configName="poi.showNetworkLog"
              defaultVal={true} />
            {
              (process.platform === 'win32') ?
              <CheckboxLabelConfig
                label={__('Create shortcut on startup (Notification may not be working without shortcut)')}
                configName="poi.createShortcut"
                defaultVal={true} />
              :
              null
            }
          </Grid>
        </div>
      </div>
    )
  }
}

export default PoiConfig
