import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Grid, Col, Row, Button, ButtonGroup, FormControl, FormGroup, InputGroup, ControlLabel, Alert, OverlayTrigger, Tooltip, Collapse, Well } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { remote, ipcRenderer } from 'electron'
import mousetrap from 'mousetrap'
import { get } from 'lodash'
import Divider from './divider'
import NavigatorBar from './navigator-bar'

import { CheckboxLabelConfig, RadioConfig, FolderPickerConfig } from './utils'

const { config, toggleModal, i18n } = window
const __ = i18n.setting.__.bind(i18n.setting)
const { session } = remote.require('electron')

let language = window.language
if (!(['zh-CN', 'zh-TW', 'ja-JP', 'en-US', 'ko-KR'].includes(language))) {
  switch (language.substr(0, 1).toLowerCase()) {
  case 'zh':
    language = 'zh-TW'
    break
  case 'ja':
    language = 'ja-JP'
    break
  case 'ko':
    language = 'ko-KR'
    break
  default:
    language = 'en-US'
  }
}

let keyListener

config.on('config.set', (path, value) => {
  switch(path) {
  case 'poi.shortcut.bosskey':
    ipcRenderer.send('refresh-shortcut')
    break
  }
})

const SetNotifyIndividualConfig = connect(() => {
  return (state, props) => ({
    enabled: get(state.config, 'poi.notify.enabled', true),
    expedition: get(state.config, 'poi.notify.expedition.enabled', true),
    expeditionValue: get(state.config, 'poi.notify.expedition.value', 60),
    construction: get(state.config, 'poi.notify.construction.enabled', true),
    repair: get(state.config, 'poi.notify.repair.enabled', true),
    morale: get(state.config, 'poi.notify.morale.enabled', true),
    moraleValue: get(state.config, 'poi.notify.morale.value', 49),
    others: get(state.config, 'poi.notify.others.enabled', true),
    volume: get(state.config, 'poi.notify.volume', 0.8),
  })
})(class setNotifyIndividualConfig extends Component {
  static propTypes = {
    enabled: PropTypes.bool,
  }
  constructor(props) {
    super(props)
    this.state = {
      timeSettingShow: false,
      moraleValue: props.moraleValue,
      expeditionValue: props.expeditionValue,
    }
  }
  handleSetNotify = (path) => {
    if (!path) {
      config.set(`poi.notify.enabled`, !this.props.enabled)
    } else {
      config.set(`poi.notify.${path}.enabled`, !get(this.props, path, true))
    }
  }
  handleChangeNotifyVolume = (e) => {
    let volume = e.target.value
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
    const timeSettingShow = !this.state.timeSettingShow
    this.setState({timeSettingShow})
  }
  selectInput = (id) => {
    document.getElementById(id).select()
  }
  handleSetExpedition = (e) => {
    const value = parseInt(e.target.value) || 0
    if (isNaN(value) || value < 0) {
      return
    }
    this.setState({expeditionValue: value})
  }
  handleSetMorale = (e) => {
    const value = parseInt(e.target.value) || 0
    if (isNaN(value) || value < 0) {
      return
    }
    this.setState({moraleValue: value})
  }
  saveNotifySetting = () => {
    const {moraleValue, expeditionValue} = this.state
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
              bsStyle={this.props.enabled ? 'success' : 'danger'}
              onClick={this.handleSetNotify.bind(this, null)}
              style={{width: '100%'}}>
              {(get(this.props, 'enabled', true)) ? '√ ' : ''}{__('Enable notification')}
            </Button>
          </Col>
          <Col xs={6}>
            <OverlayTrigger placement='top' overlay={
              <Tooltip id='poiconfig-volume'>{__('Volume')} <strong>{parseInt(this.props.volume * 100)}%</strong></Tooltip>
            }>
              <FormControl type="range"
                onChange={this.handleChangeNotifyVolume} onMouseUp={this.handleEndChangeNotifyVolume}
                min={0.0} max={1.0} step={0.05} defaultValue={this.props.volume} />
            </OverlayTrigger>
          </Col>
        </div>
        <div>
          <Col xs={12} style={{marginTop: 10}}>
            <ButtonGroup style={{display: 'flex'}}>
              <Button bsStyle={this.props.construction ? 'success' : 'danger'}
                onClick={this.handleSetNotify.bind(this, 'construction')}
                className='notif-button'>
                {__('Construction')}
              </Button>
              <Button bsStyle={this.props.expedition ? 'success' : 'danger'}
                onClick={this.handleSetNotify.bind(this, 'expedition')}
                className='notif-button'>
                {__('Expedition')}
              </Button>
              <Button bsStyle={this.props.repair ? 'success' : 'danger'}
                onClick={this.handleSetNotify.bind(this, 'repair')}
                className='notif-button'>
                {__('Docking')}
              </Button>
              <Button bsStyle={this.props.morale ? 'success' : 'danger'}
                onClick={this.handleSetNotify.bind(this, 'morale')}
                className='notif-button'>
                {__('Morale')}
              </Button>
              <Button bsStyle={this.props.others ? 'success' : 'danger'}
                onClick={this.handleSetNotify.bind(this, 'others')}
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
                      <FormGroup>
                        <InputGroup bsSize='small'>
                          <FormControl type="number" ref="expeditionValue" id="expeditionValue"
                            disabled={!this.props.expedition}
                            onChange={this.handleSetExpedition}
                            value={this.state.expeditionValue}
                            onClick={this.selectInput.bind(this, "expeditionValue")}
                            className='notif-input' />
                          <InputGroup.Addon>S</InputGroup.Addon>
                        </InputGroup>
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={9} className='notif-container'>
                      <div className='notif-input-desc'>{__('Morale')}: {__('Notify when morale is greater than')}</div>
                    </Col>
                    <Col xs={3} className='notif-container'>
                      <InputGroup bsSize='small'>
                        <FormControl type="number" ref="moraleValue" id="moraleValue"
                          disabled={!this.props.morale}
                          onChange={this.handleSetMorale}
                          value={this.state.moraleValue}
                          onClick={this.selectInput.bind(this, "moraleValue")}
                          className='notif-input' />
                      </InputGroup>
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

let t
const ClearCacheCookieConfig = connect(state => ({
  cacheSize: get(state.config, 'poi.cacheSize', 320),
}))(class clearCacheCookieConfig extends Component {
  state = {
    cacheSize: 0,
  }
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
  handleValueChange = e => {
    config.set('poi.cacheSize', e.target.value)
  }
  handleUpdateCacheSize = () => {
    session.defaultSession.getCacheSize(cacheSize => this.setState({ cacheSize }))
  }
  componentDidMount = () => {
    this.handleUpdateCacheSize()
    t = setInterval(this.handleUpdateCacheSize, 6000000)
  }
  componentWillUnmount = () => {
    clearInterval(t)
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <FormGroup>
            <ControlLabel>{__('Current cache size')}</ControlLabel>
            <InputGroup>
              <InputGroup.Button>
                <Button onClick={this.handleUpdateCacheSize}>{__('Update')}</Button>
              </InputGroup.Button>
              <FormControl type="number"
                disabled
                value={Math.round(this.state.cacheSize / 1048576)}
                className='' />
              <InputGroup.Addon>MB</InputGroup.Addon>
            </InputGroup>
          </FormGroup>
        </Col>
        <Col xs={6}>
          <FormGroup>
            <ControlLabel>{__('Maximum cache size')}</ControlLabel>
            <InputGroup>
              <FormControl type="number"
                onChange={this.handleValueChange}
                value={this.props.cacheSize}
                className='' />
              <InputGroup.Addon>MB</InputGroup.Addon>
            </InputGroup>
          </FormGroup>
        </Col>
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
})

const SelectLanguageConfig = connect(() => {
  return (state, props) => ({
    value: get(state.config, 'poi.language', language),
  })
})(class selectLanguageConfig extends Component {
  static propTypes = {
    value: PropTypes.string,
  }
  handleSetLanguage = (e) => {
    const language = e.target.value
    config.set('poi.language', language)
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <FormControl componentClass="select" ref="language" value={this.props.value} onChange={this.handleSetLanguage}>
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">正體中文</option>
            <option value="ja-JP">日本語</option>
            <option value="en-US">English</option>
            <option value="ko-KR">한국어</option>
          </FormControl>
        </Col>
      </Grid>
    )
  }
})

const SlotCheckConfig = connect(() => {
  return (state, props) => ({
    type: props.type,
    enable: get(state.config, `poi.mapStartCheck.${props.type}.enable`, false),
    minFreeSlots: get(state.config, `poi.mapStartCheck.${props.type}.minFreeSlots`, ''),
  })
})(class slotCheckConfig extends Component {
  static propTypes = {
    minFreeSlots: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    type: PropTypes.string,
    enable: PropTypes.bool,
  }
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
      const num = this.state.value
      this.setState({
        showInput: true,
        value: this.CheckValid(num) ? parseInt(num) : '',
      })
    }
  }
  handleChange = (e) => {
    this.setState({value: e.target.value})
  }
  handleSubmit = (e) => {
    e.preventDefault()
    if (this.CheckValid(this.state.value)) {
      const n = parseInt(this.state.value)
      config.set(`poi.mapStartCheck.${this.props.type}`, {
        enable: true,
        minFreeSlots: n,
      })
      this.setState({
        showInput: false,
        value: n,
      })
    } else {
      this.handleDisable()
    }
  }
  handleDisable = () => {
    config.set(`poi.mapStartCheck.${this.props.type}.enable`, false)
    this.setState({showInput: false})
  }
  render() {
    let toggleBtnStyle = this.props.enable ? 'success' : 'default'
    if (this.state.showInput) {
      toggleBtnStyle = 'danger'
    }
    let toggleBtnTxt = this.props.enable ? 'ON' : 'OFF'
    if (this.state.showInput) {
      toggleBtnTxt = __('Disable')
    }
    const toggleBtn = <Button onClick={this.handleToggleInput} bsSize='xs'
      bsStyle={toggleBtnStyle} style={{verticalAlign: 'text-bottom'}}>
      {toggleBtnTxt}
    </Button>
    const inputValid = this.CheckValid(this.state.value)
    const submitBtn = <Button type='submit'
      bsStyle={inputValid ? 'success' : 'danger'}>
      {inputValid ? __('Save') : __('Disable')}
    </Button>
    return (
      <div style={{margin: '5px 15px'}}>
        <form onSubmit={this.handleSubmit}>
          <div>
            {__(`${this.props.type} slots`)} {toggleBtn}
          </div>
          <Collapse in={this.state.showInput}>
            <div>
              <Well>
                <FormGroup>
                  <ControlLabel>{__(`Warn if the number of free ${this.props.type} slots is less than`)}</ControlLabel>
                  <InputGroup bsSize='small'>
                    <FormControl type="text"
                      bsStyle={inputValid ? 'success' : 'error'}
                      value={this.state.value}
                      onChange={this.handleChange}/>
                    <InputGroup.Button>
                      {submitBtn}
                    </InputGroup.Button>
                  </InputGroup>
                </FormGroup>
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
    value: get(state.config, props.configName, props.defaultVal),
    configName: props.configName,
  })
})(class shortcutConfig extends Component {
  static propTypes = {
    value: PropTypes.string,
    active: PropTypes.bool,
    configName: PropTypes.string,
    label: PropTypes.string,
  }
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
  active = () => ((typeof this.props.active === "undefined") ? true : this.props.active)
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
    keyListener = (character, modifiers, e) => {
      if (this.keyShouldIgnore(character, modifiers)) {
        return
      }
      keyListener = null
      if (character === 'esc' && modifiers.length === 0) {
        this.abortRecording()
      }
      else {
        this.setKey(character, modifiers)
      }
    }
    document.addEventListener('mousedown', this.handleClickAnywhere)
    this.setState({recording: true})
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
    const mapping = {
      shift: 'Shift',
      alt: 'Alt',
      ctrl: 'Ctrl',
      meta: ('ctrl' in modifiers) ? 'Cmd' : 'CmdOrCtrl',
      Del: 'Delete',
      Ins: 'Insert',
    }
    const str_modifiers = (() => {
      const results = []
      for (let i = 0; i < modifiers.length; i++) {
        results.push(mapping[modifiers[i]])
      }
      return results
    })()
    character = character[0].toUpperCase() + character.substr(1)
    const s = (str_modifiers.concat([mapping[character] || character])).join('+')
    return s
  }
  setKey = (character, modifiers) => {
    const s = this.transformKeyStr(character, modifiers)
    this.setState({
      recording: false,
    })
    this.newVal(s)
  }
  newVal = (val) =>{
    config.set(this.props.configName, val)
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
  if (e.type !== 'keydown' || ['shift', 'alt', 'ctrl', 'meta'].includes(character)) {
    return
  }
  const fn = keyListener
  if (typeof fn === 'function') {
    fn(character, modifiers, e)
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
          <Divider text={__('Screenshot Format')} />
          <RadioConfig
            label={__('Screenshot Format')}
            configName="poi.screenshotFormat"
            defaultVal='png'
            availableVal={[{name: 'PNG', value: 'png'}, {name: 'JPEG', value: 'jpg'}]} />
        </div>
        <div className="form-group">
          <Divider text={__('Screenshot Folder')} />
          <FolderPickerConfig
            label={__('Screenshot Folder')}
            configName="poi.screenshotPath"
            defaultVal={window.screenshotPath} />
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
            <Col xs={12}>
              {
                (process.platform !== 'darwin') ?
                  <ShortcutConfig
                    label={__('Boss key')}
                    configName="poi.shortcut.bosskey" />
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
              <CheckboxLabelConfig
                label={__('Display Final Stage Notification')}
                configName="poi.lastbattle.enabled"
                defaultVal={true} />
            </Col>
          </Grid>
        </div>
        <div className="form-group">
          <Divider text={__('Advanced functionalities')} />
          <Grid>
            <Col xs={12}>
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
              {
                (process.platform === 'linux') ?
                  <CheckboxLabelConfig
                    label={__('Display tray icon')}
                    configName="poi.linuxTrayIcon"
                    defaultVal={true} />
                  :
                  null
              }
              <CheckboxLabelConfig
                label={__('Enter safe mode on next startup')}
                configName="poi.enterSafeMode"
                defaultVal={false} />
              <CheckboxLabelConfig
                label={__('Send data to Google Analytics')}
                configName="poi.sendAnalytics"
                defaultVal={true} />
            </Col>
          </Grid>
        </div>
      </div>
    )
  }
}

export default PoiConfig
