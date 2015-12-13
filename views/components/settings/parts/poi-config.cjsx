path = require 'path-extra'
fs = require 'fs-extra'
{remote} = require 'electron'
{dialog} = remote.require 'electron'
i18n = require 'i18n'
{__, __n} = i18n
{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Row, Button, ButtonGroup, Input, Alert} = ReactBootstrap
{OverlayTrigger, Tooltip, Collapse, Well} = ReactBootstrap
{config, toggleModal} = window
{APPDATA_PATH} = window
{showItemInFolder, openItem} = require 'shell'

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
    console.log @props.type + JSON.stringify(config.get @cfgEntry) if process.env.DEBUG?
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
    console.log @props.type + JSON.stringify(config.get @cfgEntry) if process.env.DEBUG?
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
                ref={(r) => this.textInput = r}
                onChange={@handleChange}
                buttonAfter={submitBtn} />
            </Well>
          </div>
        </Collapse>
      </form>
    </div>

PoiConfig = React.createClass
  getInitialState: ->
    timeSettingShow: false
    language: config.get 'poi.language', language
    enableConfirmQuit: config.get 'poi.confirm.quit', false
    enableNotify: config.get 'poi.notify.enabled', true
    constructionNotify: config.get 'poi.notify.construction.enabled', 'true'
    expeditionNotify: config.get 'poi.notify.expedition.enabled', 'true'
    repairNotify: config.get 'poi.notify.repair.enabled', 'true'
    moraleNotify: config.get 'poi.notify.morale.enabled', 'true'
    othersNotify: config.get 'poi.notify.others.enabled', 'true'
    notifyVolume: config.get 'poi.notify.volume', 0.8
    enableDMMcookie: config.get 'poi.enableDMMcookie', false
    disableNetworkAlert: config.get 'poi.disableNetworkAlert', false
    disableHA: config.get 'poi.disableHA', false
    screenshotPath: config.get 'poi.screenshotPath', window.screenshotPath
    cachePath: config.get 'poi.cachePath', remote.getGlobal('DEFAULT_CACHE_PATH')
    moraleValue: window.notify.morale
    expeditionValue: window.notify.expedition
  handleSetTimeSettingShow: ->
    timeSettingShow = !@state.timeSettingShow
    @setState {timeSettingShow}
  handleSetConfirmQuit: ->
    enabled = @state.enableConfirmQuit
    config.set 'poi.confirm.quit', !enabled
    @setState
      enableConfirmQuit: !enabled
  handleDisableHA: ->
    enabled = @state.disableHA
    config.set 'poi.disableHA', !enabled
    @setState
      disableHA: !enabled
  handleSetDMMcookie: ->
    enabled = @state.enableDMMcookie
    config.set 'poi.enableDMMcookie', !enabled
    @setState
      enableDMMcookie: !enabled
  handleSetNetworkAlert: ->
    disabled = @state.disableNetworkAlert
    config.set 'poi.disableNetworkAlert', !disabled
    @setState
      disableNetworkAlert: !enabled
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
  handleSetLanguage: (language) ->
    language = @refs.language.getValue()
    return if @state.language == language
    config.set 'poi.language', language
    i18n.setLocale language
    @setState {language}
  handleClearCookie: (e) ->
    remote.getCurrentWebContents().session.clearStorageData {storages: ['cookies']}, ->
      toggleModal __('Delete cookies'), __('Success!')
  handleClearCache: (e) ->
    remote.getCurrentWebContents().session.clearCache ->
      toggleModal __('Delete cache'), __('Success!')
  folderPickerOnDrop: (callback, e) ->
    e.preventDefault()
    droppedFiles = e.dataTransfer.files
    isDirectory = fs.statSync(droppedFiles[0].path).isDirectory()
    callback droppedFiles[0].path if isDirectory
  screenshotFolderPickerOnDrop: (e) ->
    @folderPickerOnDrop @setScreenshotPath, e
  screenshotFolderPickerOnClick: ->
    @synchronize =>
      fs.ensureDirSync @state.screenshotPath
      filenames = dialog.showOpenDialog
        title: __ 'Screenshot Folder'
        defaultPath: @state.screenshotPath
        properties: ['openDirectory', 'createDirectory']
      @setScreenshotPath filenames[0] if filenames isnt undefined
  cacheFolderPickerOnDrop: (e) ->
    @folderPickerOnDrop @setCachePath, e
  cacheFolderPickerOnClick: ->
    @synchronize =>
      fs.ensureDirSync @state.cachePath
      filenames = dialog.showOpenDialog
        title: __ 'Cache Folder'
        defaultPath: @state.cachePath
        properties: ['openDirectory', 'createDirectory']
      @setCachePath filenames[0] if filenames isnt undefined
  setScreenshotPath: (pathname) ->
    window.screenshotPath = pathname
    config.set 'poi.screenshotPath', pathname
    @setState
      screenshotPath: pathname
  setCachePath: (pathname) ->
    config.set 'poi.cachePath', pathname
    @setState
      cachePath: pathname
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
  onDrag: (e) ->
    e.preventDefault()
  selectInput: (id) ->
    document.getElementById(id).select()
  synchronize: (callback) ->
    return if @lock
    @lock = true
    callback()
    @lock = false
  render: ->
    <div>
      <form>
        <div className="form-group" id='navigator-bar'>
          <Divider text={__ 'Browser'} />
          <NavigatorBar />
          {
            if process.platform isnt 'darwin'
              <Grid>
                <Col xs={12}>
                  <Input type="checkbox" label={__ 'Confirm before exit'} checked={@state.enableConfirmQuit} onChange={@handleSetConfirmQuit} />
                </Col>
              </Grid>
          }
        </div>
        <div className="form-group">
          <Divider text={__ 'Notification'} />
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
        </div>
      </form>
      <div className="form-group" >
        <Divider text={__ 'Slot Check'} />
        <SlotCheckConfig type="ship" />
        <SlotCheckConfig type="item" />
      </div>
      <form>
        <div className="form-group">
          <Divider text={__ 'Cache and cookies'} />
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
        </div>
        <div className="form-group">
          <Divider text={__ 'Language'} />
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
        </div>
        <div className="form-group">
          <Divider text={__ 'Screenshot Folder'} />
          <Grid>
            <Col xs={12}>
              <div className="folder-picker"
                   onClick={@screenshotFolderPickerOnClick}
                   onDrop={@screenshotFolderPickerOnDrop}
                   onDragEnter={@onDrag}
                   onDragOver={@onDrag}
                   onDragLeave={@onDrag}>
                {@state.screenshotPath}
              </div>
            </Col>
          </Grid>
        </div>
        <div className="form-group">
          <Divider text={__ 'Cache Folder'} />
          <Grid>
            <Col xs={12}>
              <div className="folder-picker"
                   onClick={@cacheFolderPickerOnClick}
                   onDrop={@cacheFolderPickerOnDrop}
                   onDragEnter={@onDrag}
                   onDragOver={@onDrag}
                   onDragLeave={@onDrag}>
                {@state.cachePath}
              </div>
            </Col>
          </Grid>
        </div>
        <div className="form-group">
          <Divider text={__ 'Advanced'} />
          <Grid>
            <Col xs={12}>
              <Input type="checkbox" label={__ 'Disable Hardware Acceleration'} checked={@state.disableHA} onChange={@handleDisableHA} />
            </Col>
            <Col xs={12}>
              <Input type="checkbox" label={__ 'Editing DMM Cookie\'s Region Flag'} checked={@state.enableDMMcookie} onChange={@handleSetDMMcookie} />
            </Col>
            <Col xs={12}>
              <Input type="checkbox" label={__ 'Prevent DMM Network Change Popup'} checked={@state.disableNetworkAlert} onChange={@handleSetNetworkAlert} />
            </Col>
          </Grid>
        </div>
      </form>
    </div>

module.exports = PoiConfig
