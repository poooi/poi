path = require 'path-extra'
fs = require 'fs-extra'
{remote} = require 'electron'
{dialog} = remote.require 'electron'
__ = i18n.setting.__.bind(i18n.setting)
__n = i18n.setting.__n.bind(i18n.setting)
{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Row, Button, ButtonGroup, Input, Alert} = ReactBootstrap
{OverlayTrigger, Tooltip, Collapse, Well} = ReactBootstrap
{config, toggleModal} = window
{APPDATA_PATH} = window
{showItemInFolder, openItem} = require 'shell'
mousetrap = require 'mousetrap'
ipcRenderer = require("electron").ipcRenderer

Divider = require './divider'
NavigatorBar = require './navigator-bar'

language = navigator.language
if !(language in ['zh-CN', 'zh-TW', 'ja-JP', 'en-US'])
  switch language.substr(0,1).toLowerCase()
    when 'zh'
      language = 'zh-TW'
    when 'ja'
      language = 'ja-JP'
    else
      language = 'en-US'

SetNotifyIndividualConfig = React.createClass
  getInitialState: ->
    enableNotify: config.get 'poi.notify.enabled', true
    constructionNotify: config.get 'poi.notify.construction.enabled', 'true'
    expeditionNotify: config.get 'poi.notify.expedition.enabled', 'true'
    repairNotify: config.get 'poi.notify.repair.enabled', 'true'
    moraleNotify: config.get 'poi.notify.morale.enabled', 'true'
    othersNotify: config.get 'poi.notify.others.enabled', 'true'
    timeSettingShow: false
    moraleValue: window.notify.morale
    expeditionValue: window.notify.expedition
    notifyVolume: config.get 'poi.notify.volume', 0.8
  handleSetNotifyIndividual: (type) ->
    switch type
      when 'construction'
        enabled = @state.constructionNotify
        config.set "poi.notify.construction.enabled", !enabled
        @setState
          constructionNotify: !enabled
      when 'expedition'
        enabled = @state.expeditionNotify
        config.set "poi.notify.expedition.enabled", !enabled
        @setState
          expeditionNotify: !enabled
      when 'repair'
        enabled = @state.repairNotify
        config.set "poi.notify.repair.enabled", !enabled
        @setState
          repairNotify: !enabled
      when 'morale'
        enabled = @state.moraleNotify
        config.set "poi.notify.morale.enabled", !enabled
        @setState
          moraleNotify: !enabled
      when 'others'
        enabled = @state.othersNotify
        config.set "poi.notify.others.enabled", !enabled
        @setState
          othersNotify: !enabled
  handleSetNotify: ->
    enabled = @state.enableNotify
    config.set 'poi.notify.enabled', !enabled
    @setState
      enableNotify: !enabled
  handleChangeNotifyVolume: (e) ->
    volume = @refs.notifyVolume.getValue()
    volume = parseFloat(volume)
    return if volume is NaN
    config.set('poi.notify.volume', volume)
    @setState
      notifyVolume: volume
  handleEndChangeNotifyVolume: (e) ->
    window.notify null
  handleSetTimeSettingShow: ->
    timeSettingShow = !@state.timeSettingShow
    @setState {timeSettingShow}
  handleSetMorale: (e) ->
    value = parseInt(e.target.value) || 0
    return if isNaN(value) || value < 0
    window.notify.morale = value
    @setState
      moraleValue: value
  handleSetExpedition: (e) ->
    value = parseInt(e.target.value) || 0
    return if isNaN(value) || value < 0
    @setState
      expeditionValue: value
  saveNotifySetting: ->
    {moraleValue, expeditionValue} = @state
    config.set 'poi.notify.expedition.value', expeditionValue
    window.notify.expedition = expeditionValue
    config.set 'poi.notify.morale.value', moraleValue
    window.notify.morale = moraleValue
    @setState
      timeSettingShow: false
  selectInput: (id) ->
    document.getElementById(id).select()
  render: ->
    <Grid>
      <div>
        <Col xs={6}>
          <Button bsStyle={if @state.enableNotify then 'success' else 'danger'} onClick={@handleSetNotify} style={width: '100%'}>
            {if @state.enableNotify then '√ ' else ''}{__ 'Enable notification'}
          </Button>
        </Col>
        <Col xs={6}>
          <OverlayTrigger placement='top' overlay={
              <Tooltip id='poiconfig-volume'>{__ 'Volume'} <strong>{parseInt(@state.notifyVolume * 100)}%</strong></Tooltip>
            }>
            <Input type="range" ref="notifyVolume"
              onChange={@handleChangeNotifyVolume} onMouseUp={@handleEndChangeNotifyVolume}
              min={0.0} max={1.0} step={0.05} defaultValue={@state.notifyVolume} />
          </OverlayTrigger>
        </Col>
      </div>
      <div>
        <Col xs={12} style={marginTop: 10}>
          <ButtonGroup style={display: 'flex'}>
            <Button bsStyle={if @state.constructionNotify then 'success' else 'danger'}
                    onClick={@handleSetNotifyIndividual.bind this, 'construction'}
                    className='notif-button'>
              {__ 'Construction'}
            </Button>
            <Button bsStyle={if @state.expeditionNotify then 'success' else 'danger'}
                    onClick={@handleSetNotifyIndividual.bind this, 'expedition'}
                    className='notif-button'>
              {__ 'Expedition'}
            </Button>
            <Button bsStyle={if @state.repairNotify then 'success' else 'danger'}
                    onClick={@handleSetNotifyIndividual.bind this, 'repair'}
                    className='notif-button'>
              {__ 'Docking'}
            </Button>
            <Button bsStyle={if @state.moraleNotify then 'success' else 'danger'}
                    onClick={@handleSetNotifyIndividual.bind this, 'morale'}
                    className='notif-button'>
              {__ 'Morale'}
            </Button>
            <Button bsStyle={if @state.othersNotify then 'success' else 'danger'}
                    onClick={@handleSetNotifyIndividual.bind this, 'others'}
                    className='notif-button'>
              {__ 'Others'}
            </Button>
            <Button onClick={@handleSetTimeSettingShow} bsStyle='primary' style={width: 40}>
              <FontAwesome name="#{if @state.timeSettingShow then 'angle-up' else 'angle-down'}" />
            </Button>
          </ButtonGroup>
          <Collapse in={@state.timeSettingShow}>
            <div>
              <Well>
                <Row>
                  <Col xs={9} className='notif-container'>
                    <div className='notif-input-desc'>{__ 'Expedition'}: {__ 'Notify when expedition returns in'}</div>
                  </Col>
                  <Col xs={3} className='notif-container'>
                    <Input type="number" ref="expeditionValue" id="expeditionValue"
                           disabled={!@state.expeditionNotify}
                           value={@state.expeditionValue}
                           onChange={@handleSetExpedition}
                           onClick={@selectInput.bind @, "expeditionValue"}
                           bsSize='small'
                           addonAfter='S'
                           className='notif-input' />
                  </Col>
                </Row>
                <Row>
                  <Col xs={9} className='notif-container'>
                    <div className='notif-input-desc'>{__ 'Morale'}: {__ 'Notify when morale is greater than'}</div>
                  </Col>
                  <Col xs={3} className='notif-container'>
                    <Input type="number" ref="moraleValue" id="moraleValue"
                           disabled={!@state.moraleNotify}
                           value={@state.moraleValue}
                           onChange={@handleSetMorale}
                           onClick={@selectInput.bind @, "moraleValue"}
                           bsSize='small'
                           className='notif-input' />
                  </Col>
                </Row>
                <Row>
                  <Col xs={2} xsOffset={10}>
                    <Button bsSize='small' onClick={@saveNotifySetting}>{__ 'Save'}</Button>
                  </Col>
                </Row>
              </Well>
            </div>
          </Collapse>
        </Col>
      </div>
    </Grid>

# Parameters:
#   label       String  The text to display
#   configName  String  Where you store in config
#   defaultVal  Bool    The default value for config. False if not given
#   onNewVal    Function(val)  Called when a new value is set.
#   undecided   Bool    Disable the checkbox and replace with a "?"
CheckboxLabelConfig = React.createClass
  getInitialState: ->
    myval: if @props.undecided
        false
      else
        config.get @props.configName, (@props.defaultVal || false)
  handleChange: ->
    enabled = @state.myval
    config.set @props.configName, !enabled
    @setState
      myval: !enabled
    @props.onNewVal @state.myval if @props.onNewVal
  render: ->
    <Row className={if @props.undecided then 'undecided-checkbox-inside'} >
      <Col xs={12} >
        <Grid>
          <Col xs={12} >
            <Input
              type="checkbox"
              label={@props.label}
              disabled={@props.undecided}
              checked={if @props.undecided then false else @state.myval}
              onChange={if @props.undecided then null else @handleChange} />
          </Col>
        </Grid>
      </Col>
    </Row>

# Parameters:
#   label       String         The title to display
#   configName  String         Where you store in config
#   defaultVal  Bool           The default value for config
#   onNewVal    Function(val)  Called when a new value is set.
FolderPickerConfig = React.createClass
  getInitialState: ->
    myval: config.get @props.configName, @props.defaultVal
  onDrag: (e) ->
    e.preventDefault()
  synchronize: (callback) ->
    return if @lock
    @lock = true
    callback()
    @lock = false
  setPath: (val) ->
    @props.onNewVal(val) if @props.onNewVal
    config.set @props.configName, val
    @setState
      myval: val
  folderPickerOnDrop: (e) ->
    e.preventDefault()
    droppedFiles = e.dataTransfer.files
    isDirectory = fs.statSync(droppedFiles[0].path).isDirectory()
    @setPath droppedFiles[0].path if isDirectory
  folderPickerOnClick: ->
    @synchronize =>
      fs.ensureDirSync @state.myval
      filenames = dialog.showOpenDialog
        title: @props.label
        defaultPath: @state.myval
        properties: ['openDirectory', 'createDirectory']
      @setPath filenames[0] if filenames isnt undefined
  render: ->
    <Grid>
      <Col xs={12}>
        <div className="folder-picker"
             onClick={@folderPickerOnClick}
             onDrop={@folderPickerOnDrop}
             onDragEnter={@onDrag}
             onDragOver={@onDrag}
             onDragLeave={@onDrag}>
          {@state.myval}
        </div>
      </Col>
    </Grid>

ClearCacheCookieConfig = React.createClass
  handleClearCookie: (e) ->
    remote.getCurrentWebContents().session.clearStorageData {storages: ['cookies']}, ->
      toggleModal __('Delete cookies'), __('Success!')
  handleClearCache: (e) ->
    remote.getCurrentWebContents().session.clearCache ->
      toggleModal __('Delete cache'), __('Success!')
  render: ->
    <Grid>
      <Col xs={6}>
        <Button bsStyle="danger" onClick={@handleClearCookie} style={width: '100%'}>
          {__ 'Delete cookies'}
        </Button>
      </Col>
      <Col xs={6}>
        <Button bsStyle="danger" onClick={@handleClearCache} style={width: '100%'}>
          {__ 'Delete cache'}
        </Button>
      </Col>
      <Col xs={12}>
        <Alert bsStyle='warning' style={marginTop: '10px'}>
          {__ 'If connection error occurs frequently, delete both of them.'}
        </Alert>
      </Col>
    </Grid>

SelectLanguageConfig = React.createClass
  getInitialState: ->
    language: config.get 'poi.language', language
  handleSetLanguage: (language) ->
    language = @refs.language.getValue()
    return if @state.language == language
    config.set 'poi.language', language
    for namespace of window.i18n
      console.log namespace
      window.i18n[namespace].setLocale language
    window.language = language
    @setState {language}
  render: ->
    <Grid>
      <Col xs={6}>
        <Input type="select" ref="language" value={@state.language} onChange={@handleSetLanguage}>
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">正體中文</option>
          <option value="ja-JP">日本語</option>
          <option value="en-US">English</option>
        </Input>
      </Col>
    </Grid>

SlotCheckConfig = React.createClass
  preProcess: ->
    # Remove this method after some future releases
    old = config.get 'poi.mapstartcheck'
    if old?
      if old.ship?
        config.set 'poi.mapStartCheck.ship.enable', old.ship
      if old.freeShipSlot?
        config.set 'poi.mapStartCheck.ship.minFreeSlots', old.freeShipSlot
      if old.item?
        config.set 'poi.mapStartCheck.item.enable', old.item
      if old.freeItemSlot?
        config.set 'poi.mapStartCheck.item.minFreeSlots', old.freeItemSlot
      config.set 'poi.mapstartcheck'

  getInitialState: ->
    @preProcess()

    @cfgEntry = "poi.mapStartCheck.#{@props.type}"

    showInput: false
    enable: config.get "#{@cfgEntry}.enable", false
    value: ''
  CheckValid: (v) ->
    !isNaN(v) and !isNaN(n = parseInt v) and n >= 0
  handleToggleInput: ->
    if @state.showInput
      @handleDisable()
    else
      num = config.get "#{@cfgEntry}.minFreeSlots", -1
      @setState
        showInput: true
        value: if @CheckValid(num) then num else ''
    dbg.log @props.type + JSON.stringify(config.get @cfgEntry)
  handleChange: (e) ->
    @setState
      value: e.target.value
  handleSubmit: (e) ->
    e.preventDefault()
    if @CheckValid @state.value
      n = parseInt @state.value
      config.set @cfgEntry, {enable: true, minFreeSlots: n}
      @setState
        showInput: false
        enable: true
        value: n
    else
      @handleDisable()
    dbg.log @props.type + JSON.stringify(config.get @cfgEntry)
  handleDisable: ->
    config.set "#{@cfgEntry}.enable", false
    @setState
      showInput: false
      enable: false
  selectText: ->
    @textInput.getInputDOMNode().select()
  render: ->
    toggleBtnStyle = if @state.enable then 'success' else 'default'
    toggleBtnStyle = 'danger' if @state.showInput
    toggleBtnTxt = if @state.enable then 'ON' else 'OFF'
    toggleBtnTxt = __ 'Disable' if @state.showInput
    toggleBtn = <Button onClick={@handleToggleInput} bsSize='xs'
      bsStyle={toggleBtnStyle} style={verticalAlign: 'text-bottom'}>
      {toggleBtnTxt}</Button>
    inputValid = @CheckValid @state.value
    submitBtn = <Button type='submit'
      bsStyle={if inputValid then 'success' else 'danger'}>
      {if inputValid then __ 'Save' else __ 'Disable'}</Button>
    <div style={margin: '5px 15px'}>
      <form onSubmit={@handleSubmit}>
        <div>
          {__ "#{@props.type} slots"} {toggleBtn}
        </div>
        <Collapse in={@state.showInput} onEntered={@selectText}>
          <div>
            <Well>
              <Input type="text" bsSize='small'
                bsStyle={if inputValid then 'success' else 'error'}
                label={__ "Warn if the number of free #{@props.type} slots is less than"}
                value={@state.value}
                ref={(r) => @textInput = r}
                onChange={@handleChange}
                buttonAfter={submitBtn} />
            </Well>
          </div>
        </Collapse>
      </form>
    </div>

# Parameters:
#   label       String         The title to display
#   configName  String         Where you store in config
#   defaultVal  String         Default key. Use '' (empty) if not given
#   active      Bool           If false, config value is used if configName != '' else defaultVal
#   onNewVal    function(val)  Called when a new value is set. val=null for disabled.
# State table
#   [Disabled] --(Click "Record")--> [Recording]
#   [Enabled]  --(Click "Record")--> [Recording]
#              --(Click "Disable")-> [Disabled]
#   [Recording]--(Press Esc)-------> [Previous]
#              --(Click Anywhere)--> [Previous]
#              --(A valid key)-----> [Enabled]
ShortcutConfig = React.createClass
  getInitialState: ->
    initVal = if @active() || @props.configName
        config.get @props.configName, (@props.defaultVal || '')
      else
        @props.defaultVal
    myval: initVal
    recording: false
  displayText: ->
    if @recording()
      __ 'Press the key, or Esc to cancel'
    else if @enabled()
      "<#{@state.myval}>"
    else
      __ 'Disabled'
  active: ->
    if typeof @props.active == "undefined" then true else @props.active
  showDisableButton: ->
    @active() && @enabled() && !@recording()
  recording: ->
    @state.recording
  enabled: ->
    !!@state.myval
  handleClickAnywhere: (e) ->
    document.removeEventListener 'mousedown', @handleClickAnywhere
    @abortRecording()
  keyShouldIgnore: (character, modifiers) ->
    if character.length == 0
      return true
    # Test if the first character is a control byte
    if character.charCodeAt(0) < 32
      return true
    return false
  handleClickRecord: (e) ->
    this.constructor.prototype.listener = (character, modifiers, e) =>
      if @keyShouldIgnore character, modifiers
        return
      this.constructor.prototype.listener = null
      if character == 'esc' && modifiers.length == 0
        @abortRecording()
      else
        @setKey character, modifiers
    document.addEventListener 'mousedown', @handleClickAnywhere
    @setState
      recording: true
  handleDisable: ->
    @setState
      myval: null
      recording: false
    @newVal ''
  abortRecording: ->
    @setState
      recording: false
  transformKeyStr: (character, modifiers) ->
    # Translate from mousetrap to electron accelerator
    # Differentiate meta from ctrl only when they both appears
    # Incompatibilities on special keys may still exist (only solved 'del' here)
    mapping =
      shift: 'Shift'
      alt: 'Alt'
      ctrl: 'Ctrl'
      meta: if 'ctrl' in modifiers then 'Cmd' else 'CmdOrCtrl'
      Del: 'Delete'
      Ins: 'Insert'
    str_modifiers = (mapping[m] for m in modifiers)
    # Capitalize the first letter just to make it prettier
    character = character[0].toUpperCase() + character.substr 1
    s = (str_modifiers.concat [mapping[character] || character]).join '+'
    s
  setKey: (character, modifiers) ->
    s = @transformKeyStr character, modifiers
    @setState
      myval: s
      recording: false
    @newVal s
  newVal: (val) ->
    config.set @props.configName, val
    @props.onNewVal val if @props.onNewVal
  render: ->
    <div>
      <Col xs={12}>
        <ButtonGroup justified>
          <Button
            active={false}
            bsStyle="link"
            style={width: '25%', align: 'left', cursor: 'default'} >
            {@props.label}
          </Button>
          <Button
            active={@active()}
            disabled={!@active() || @recording()}
            bsStyle={if !@active() then 'default' else if @enabled() then "success" else "danger"}
            onClick={if @recording() || !@active() then null else @handleClickRecord}
            style={width: '60%'}>
            {@displayText()}
          </Button>
          {
            if @showDisableButton()
              <Button bsStyle="danger"
                onMouseDown={@handleDisable}
                style={width: '15%'}>
                <i className="fa fa-times"></i>
              </Button>
          }
        </ButtonGroup>
      </Col>
    </div>

mousetrap.prototype.handleKey = (character, modifiers, e) ->
  return if e.type != 'keydown'
  return if character in ['shift', 'alt', 'ctrl', 'meta']
  fn = ShortcutConfig.prototype.listener
  fn.apply this, arguments if fn

PoiConfig = React.createClass
  render: ->
    <div>
      <div className="form-group" id='navigator-bar'>
        <Divider text={__ 'Browser'} />
        <NavigatorBar />
      </div>
      <div className="form-group">
        <Divider text={__ 'Notification'} />
        <SetNotifyIndividualConfig />
      </div>
      <div className="form-group" >
        <Divider text={__ 'Slot Check'} />
        <SlotCheckConfig type="ship" />
        <SlotCheckConfig type="item" />
      </div>
      <div className="form-group">
        <Divider text={__ 'Cache and cookies'} />
        <ClearCacheCookieConfig />
      </div>
      <div className="form-group">
        <Divider text={__ 'Language'} />
        <SelectLanguageConfig />
      </div>
      <div className="form-group">
        <Divider text={__ 'Screenshot Folder'} />
        <FolderPickerConfig
          label={__ 'Screenshot Folder'}
          configName="poi.screenshotPath"
          defaultVal={window.screenshotPath}
          onNewVal={(pathname) -> window.screenshotPath = pathname} />
      </div>
      <div className="form-group">
        <Divider text={__ 'Cache Folder'} />
        <FolderPickerConfig label={__ 'Cache Folder'} configName="poi.cachePath" defaultVal={remote.getGlobal('DEFAULT_CACHE_PATH')} />
      </div>
      <div className="form-group">
        <Divider text={__ 'Other settings'} />
        <Grid>
          {
            if process.platform isnt 'darwin'
              <ShortcutConfig
                label={__ 'Boss key'}
                configName="poi.shortcut.bosskey"
                onNewVal={-> ipcRenderer.send 'refresh-shortcut'} />
            else
              <ShortcutConfig
                label={__ 'Boss key'}
                defaultVal="Cmd+H"
                active={false} />
          }
          {
            if process.platform isnt 'darwin'
              <CheckboxLabelConfig
                label={__ 'Confirm before exit'}
                configName="poi.confirm.quit"
                defaultVal=true />
            else
              <OverlayTrigger placement="top"
                overlay={
                    <Tooltip id="tooltip-confirm-before-exit">
                      {__ 'Set this in the OS X App Menu'}
                    </Tooltip>} >
                <div>
                  <CheckboxLabelConfig
                    label={__ 'Confirm before exit'}
                    undecided=true />
                </div>
              </OverlayTrigger>
          }
          <CheckboxLabelConfig
            label={__ 'Display \"Tips\"'}
            configName="poi.doyouknow.enabled"
            defaultVal=true />
        </Grid>
      </div>
      <div className="form-group">
        <Divider text={__ 'Advanced functionalities'} />
        <Grid>
          <CheckboxLabelConfig
            label={__ 'Editing DMM Cookie\'s Region Flag'}
            configName="poi.enableDMMcookie"
            defaultVal=false />
          <CheckboxLabelConfig
            label={__ 'Prevent DMM Network Change Popup'}
            configName="poi.disableNetworkAlert"
            defaultVal=false />
          {
            if process.platform == 'win32'
              <CheckboxLabelConfig
                label={__ 'Create shortcut on startup (Notification may not be working without shortcut)'}
                configName="poi.createShortcut"
                defaultVal=true />
          }
        </Grid>
      </div>
    </div>

module.exports = PoiConfig
