path = require 'path-extra'
fs = require 'fs-extra'
remote = require 'remote'
i18n = require 'i18n'
{__, __n} = i18n
{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Button, ButtonGroup, Input, Alert, OverlayTrigger, Tooltip} = ReactBootstrap
{config, toggleModal} = window
{APPDATA_PATH} = window
{showItemInFolder, openItem} = require 'shell'

Divider = require './divider'
NavigatorBar = require './navigator-bar'
PoiConfig = React.createClass
  getInitialState: ->
    gameWidth =
      if (config.get 'poi.webview.width', -1) == -1
        if config.get('poi.layout', 'horizonal') == 'horizonal'
          window.innerWidth * (if window.doubleTabbed then 4.0 / 7.0 else 5.0 / 7.0)
        else
          window.innerWidth
      else
        config.get 'poi.webview.width', -1
    layout: config.get 'poi.layout', 'horizonal'
    theme: config.get 'poi.theme', '__default__'
    language: config.get 'poi.language', navigator.language
    gameWidth: gameWidth
    useFixedResolution: config.get('poi.webview.width', -1) != -1
    enableConfirmQuit: config.get 'poi.confirm.quit', false
    enableDoubleTabbed: config.get 'poi.tabarea.double', false
    enableNotify: config.get 'poi.notify.enabled', true
    notifyVolume: config.get 'poi.notify.volume', 1.0
    zoomLevel: config.get 'poi.zoomLevel', 1
    mapStartCheckShip: config.get 'poi.mapstartcheck.ship', false
    freeShipSlot: config.get 'poi.mapstartcheck.freeShipSlot', 4
    mapStartCheckItem: config.get 'poi.mapstartcheck.item', true
  handleSetConfirmQuit: ->
    enabled = @state.enableConfirmQuit
    config.set 'poi.confirm.quit', !enabled
    @setState
      enableConfirmQuit: !enabled
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
  handleChangeZoomLevel: (e) ->
    zoomLevel = @refs.zoomLevel.getValue()
    zoomLevel = parseFloat(zoomLevel)
    return if @state.zoomLevel == zoomLevel
    document.getElementById('poi-app-container').style.transformOrigin = '0 0'
    document.getElementById('poi-app-container').style.WebkitTransform = "scale(#{zoomLevel})"
    document.getElementById('poi-app-container').style.width = "#{Math.floor(100 / zoomLevel)}%"
    poiappHeight = parseInt(document.getElementsByTagName('poi-app')[0].style.height)
    [].forEach.call $$('poi-app div.poi-app-tabpane'), (e) ->
      e.style.height = "#{poiappHeight / zoomLevel - 40}px"
      e.style.overflowY = "scroll"
    config.set('poi.zoomLevel', zoomLevel)
    @setState
      zoomLevel: zoomLevel
  handleSetMapStartCheckShip: ->
    enabled = @state.mapStartCheckShip
    config.set 'poi.mapstartcheck.ship', !enabled
    @setState
      mapStartCheckShip: !enabled
  handleSetMapStartCheckFreeShipSlot: (e) ->
    freeShipSlot = parseInt @refs.freeShipSlot.getValue()
    config.set 'poi.mapstartcheck.freeShipSlot', freeShipSlot
    @setState
      freeShipSlot: freeShipSlot
  handleSetMapStartCheckItem: ->
    enabled = @state.mapStartCheckItem
    config.set 'poi.mapstartcheck.item', !enabled
    @setState
      mapStartCheckItem: !enabled
  handleSetDoubleTabbed: ->
    enabled = @state.enableDoubleTabbed
    config.set 'poi.tabarea.double', !enabled
    @setState
      enableDoubleTabbed: !enabled
    toggleModal __('Layout settings'), __('You must reboot the app for the changes to take effect.')
  handleSetLayout: (layout) ->
    return if @state.layout == layout
    config.set 'poi.layout', layout
    event = new CustomEvent 'layout.change',
      bubbles: true
      cancelable: true
      detail:
        layout: layout
    window.dispatchEvent event
    @setState {layout}
  handleSetLanguage: (language) ->
    language = @refs.language.getValue()
    return if @state.language == language
    config.set 'poi.language', language
    i18n.setLocale language
    @setState {language}
  handleSetTheme: (theme) ->
    theme = @refs.theme.getValue()
    if @state.theme != theme
      window.applyTheme theme
  onThemeChange: (e) ->
    @setState
      theme: e.detail.theme
  handleSetWebviewWidth: (e) ->
    @setState
      gameWidth: @refs.webviewWidth.getValue()
    width = parseInt @refs.webviewWidth.getValue()
    return if isNaN(width) || width < 0 || !@state.useFixedResolution || (config.get('poi.layout', 'horizonal') == 'horizonal' && width > window.innerWidth - 150)
    window.webviewWidth = width
    window.dispatchEvent new Event('webview.width.change')
    config.set 'poi.webview.width', width
  handleResize: ->
    {gameWidth} = @state
    width = parseInt gameWidth
    return if isNaN(width) || width < 0 || (config.get('poi.layout', 'horizonal') == 'horizonal' && width > window.innerWidth - 150)
    if !@state.useFixedResolution
      if config.get('poi.layout', 'horizonal') == 'horizonal'
        @setState
          gameWidth: window.innerWidth * (if window.doubleTabbed then 4.0 / 7.0 else 5.0 / 7.0)
      else
        @setState
          gameWidth: window.innerWidth
  handleSetFixedResolution: (e) ->
    current = @state.useFixedResolution
    if current
      config.set 'poi.webview.width', -1
      @setState
        useFixedResolution: false
      @handleResize()
      window.webviewWidth = -1
      window.dispatchEvent new Event('webview.width.change')
    else
      @state.useFixedResolution = true
      @setState
        useFixedResolution: true
      @handleSetWebviewWidth()
  handleClearCookie: (e) ->
    remote.getCurrentWebContents().session.clearStorageData {storages: ['cookies']}, ->
      toggleModal __('Delete cookies'), __('Success!')
  handleClearCache: (e) ->
    remote.getCurrentWebContents().session.clearCache ->
      toggleModal __('Delete cache'), __('Success!')
  handleOpenCustomCss: (e) ->
    try
      d = path.join(EXROOT, 'hack', 'custom.css')
      fs.ensureFileSync d
      openItem d
    catch e
      toggleModal __('Edit custom CSS'), __("Failed. Perhaps you don't have permission to it.")
  componentDidMount: ->
    window.addEventListener 'resize', @handleResize
    window.addEventListener 'theme.change', @onThemeChange
  componentWillUnmount: ->
    window.removeEventListener 'resize', @handleResize
    window.removeEventListener 'theme.change', @onThemeChange
  render: ->
    <form id="poi-config">
      <div className="form-group" id='navigator-bar'>
        <Divider text={__ 'Browser'} />
        <NavigatorBar />
        <Grid>
          <Col xs={12}>
            <Input type="checkbox" label={__ 'Confirm before exit'} checked={@state.enableConfirmQuit} onChange={@handleSetConfirmQuit} />
          </Col>
        </Grid>
      </div>
      <div className="form-group">
        <Divider text={__ 'Notification'} />
        <Grid>
          <Col xs={6}>
            <Button bsStyle={if @state.enableNotify then 'success' else 'danger'} onClick={@handleSetNotify} style={width: '100%'}>
              {if @state.enableNotify then '√ ' else ''}{__ 'Enable notification'}
            </Button>
          </Col>
          <Col xs={6}>
            <OverlayTrigger placement='top' overlay={
                <Tooltip>{__ 'Volume'} <strong>{parseInt(@state.notifyVolume * 100)}%</strong></Tooltip>
              }>
              <Input type="range" ref="notifyVolume" onInput={@handleChangeNotifyVolume}
                min={0.0} max={1.0} step={0.05} defaultValue={@state.notifyVolume} />
            </OverlayTrigger>
          </Col>
        </Grid>
      </div>
      <div className="form-group" >
        <Divider text={__ 'Slot check'} />
        <div style={display: "flex", flexFlow: "row nowrap"}>
          <div style={flex: 2, margin: "0 15px"}>
            <Input type="checkbox" label={__ 'Ship slots'} checked={@state.mapStartCheckShip} onChange={@handleSetMapStartCheckShip} />
          </div>
          <div style={flex: 2, margin: "0 15px"}>
            <Input type="checkbox" label={__ 'Item slots'} checked={@state.mapStartCheckItem} onChange={@handleSetMapStartCheckItem} />
          </div>
        </div>
        <div style={flex: 2, margin: "0 15px"}>
          <Input type="number" label={__ 'Warn when the number of empty ship slots is less than'} ref="freeShipSlot" value={@state.freeShipSlot} onChange={@handleSetMapStartCheckFreeShipSlot} placeholder="船位警告触发数" />
        </div>
      </div>
      <div className="form-group">
        <Divider text={__("Layout")} />
        <Grid>
          <Col xs={6}>
            <Button bsStyle={if @state.layout == 'horizonal' then 'success' else 'danger'} onClick={@handleSetLayout.bind @, 'horizonal'} style={width: '100%'}>
              {if @state.layout == 'horizonal' then '√ ' else ''}{__ 'Use horizontal layout'}
            </Button>
          </Col>
          <Col xs={6}>
            <Button bsStyle={if @state.layout == 'vertical' then 'success' else 'danger'} onClick={@handleSetLayout.bind @, 'vertical'} style={width: '100%'}>
              {if @state.layout == 'vertical' then '√ ' else ''}{__ 'Use vertical layout'}
            </Button>
          </Col>
          <Col xs={12}>
            <Input type="checkbox" label={__ 'Split component and plugin panel'} checked={@state.enableDoubleTabbed} onChange={@handleSetDoubleTabbed} />
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
        <Divider text={__ 'Themes'} />
        <Grid>
          <Col xs={6}>
            <Input type="select" ref="theme" value={@state.theme} onChange={@handleSetTheme}>
              {
                window.allThemes.map (theme, index) ->
                  <option key={index} value={theme}>
                    { if theme is '__default__' then 'Default' else (theme[0].toUpperCase() + theme.slice(1)) }
                  </option>
              }
            </Input>
          </Col>
          <Col xs={6}>
            <Button bsStyle='primary' onClick={@handleOpenCustomCss} block>{__ 'Edit custom CSS'}</Button>
          </Col>
        </Grid>
      </div>
      <div className="form-group">
        <Divider text={__ 'Zoom'} />
        <Grid>
          <Col xs={6}>
            <OverlayTrigger placement='top' overlay={
                <Tooltip>{__ 'Zoom level'} <strong>{parseInt(@state.zoomLevel * 100)}%</strong></Tooltip>
              }>
              <Input type="range" ref="zoomLevel" onInput={@handleChangeZoomLevel}
                min={0.5} max={2.0} step={0.05} defaultValue={@state.zoomLevel} />
            </OverlayTrigger>
          </Col>
        </Grid>
      </div>
      <div className="form-group">
        <Divider text={__ 'Game resoultion'} />
        <div style={display: 'flex', marginLeft: 15, marginRight: 15}>
          <Input type='checkbox' ref="useFixedResolution" label={__ 'Use fixed resoultion'} checked={@state.useFixedResolution} onChange={@handleSetFixedResolution} />
        </div>
        <div id="poi-resolution-config" style={display: 'flex', marginLeft: 15, marginRight: 15, alignItems: 'center'}>
          <div style={flex: 1}>
            <Input type="number" ref="webviewWidth" value={@state.gameWidth} onChange={@handleSetWebviewWidth} readOnly={!@state.useFixedResolution} />
          </div>
          <div style={flex: 'none', width: 15, paddingLeft: 5}>
            x
          </div>
          <div style={flex: 1}>
            <Input type="number" value={@state.gameWidth * 480 / 800} readOnly />
          </div>
          <div style={flex: 'none', width: 15, paddingLeft: 5}>
            px
          </div>
        </div>
      </div>
    </form>

module.exports = PoiConfig
