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
DisplayConfig = React.createClass
  getInitialState: ->
    gameWidth =
      if (config.get 'poi.webview.width', -1) == -1
        if config.get('poi.layout', 'horizontal') == 'horizontal'
          window.innerWidth * (if window.doubleTabbed then 4.0 / 7.0 else 5.0 / 7.0)
        else
          window.innerWidth
      else
        config.get 'poi.webview.width', -1
    layout: config.get 'poi.layout', 'horizontal'
    theme: config.get 'poi.theme', '__default__'
    gameWidth: gameWidth
    useFixedResolution: config.get('poi.webview.width', -1) != -1
    enableConfirmQuit: config.get 'poi.confirm.quit', false
    enableDoubleTabbed: config.get 'poi.tabarea.double', false
    zoomLevel: config.get 'poi.zoomLevel', 1
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
    toggleModal __('Layout settings'), __('You must reboot the app for the changes to take effect.')
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
    return if isNaN(width) || width < 0 || !@state.useFixedResolution || (config.get('poi.layout', 'horizontal') == 'horizontal' && width > window.innerWidth - 150)
    window.webviewWidth = width
    window.dispatchEvent new Event('webview.width.change')
    config.set 'poi.webview.width', width
  handleResize: ->
    {gameWidth} = @state
    width = parseInt gameWidth
    return if isNaN(width) || width < 0 || (config.get('poi.layout', 'horizontal') == 'horizontal' && width > window.innerWidth - 150)
    if !@state.useFixedResolution
      if config.get('poi.layout', 'horizontal') == 'horizontal'
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
      <div className="form-group">
        <Divider text={__("Layout")} />
        <Grid>
          <Col xs={6}>
            <Button bsStyle={if @state.layout == 'horizontal' then 'success' else 'danger'} onClick={@handleSetLayout.bind @, 'horizontal'} style={width: '100%'}>
              {if @state.layout == 'horizontal' then '√ ' else ''}{__ 'Use horizontal layout'}
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

module.exports = DisplayConfig
