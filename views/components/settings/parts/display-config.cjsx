path = require 'path-extra'
fs = require 'fs-extra'
{remote, shell} = require 'electron'
__ = i18n.setting.__.bind(i18n.setting)
__n = i18n.setting.__n.bind(i18n.setting)
{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Button, ButtonGroup, FormControl, Checkbox, Alert, OverlayTrigger, Tooltip} = ReactBootstrap
{config, toggleModal} = window
{APPDATA_PATH} = window
{showItemInFolder, openItem} = shell
Divider = require './divider'

ChangeLayoutConfig = React.createClass
  getInitialState: ->
    layout: config.get 'poi.layout', 'horizontal'
    enableDoubleTabbed: config.get 'poi.tabarea.double', false
  handleSetLayout: (layout) ->
    return if @state.layout == layout
    config.set 'poi.layout', layout
    window.layout = layout
    event = new CustomEvent 'layout.change',
      bubbles: true
      cancelable: true
      detail:
        layout: layout
    window.dispatchEvent event
    @setState {layout}
    toggleModal __('Layout settings'), __('Some plugins may not work before you refresh the page.')
  handleSetDoubleTabbed: ->
    enabled = @state.enableDoubleTabbed
    config.set 'poi.tabarea.double', !enabled
    config.set 'poi.layout', layout
    event = new CustomEvent 'doubleTabbed.change',
      bubbles: true
      cancelable: true
      detail:
        doubleTabbed: !enabled
    window.dispatchEvent event
    window.doubleTabbed = !enabled
    @setState
      enableDoubleTabbed: !enabled
    toggleModal __('Layout settings'), __('Some plugins may not work before you refresh the page.')
  render: ->
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
        <Checkbox checked={@state.enableDoubleTabbed} onChange={@handleSetDoubleTabbed} >
          {__ 'Split component and plugin panel'}
        </Checkbox>
      </Col>
    </Grid>

ChangeThemeConfig = React.createClass
  getInitialState: ->
    theme: config.get 'poi.theme', 'paperdark'
    enableSVGIcon: config.get 'poi.useSVGIcon', false
    enableTransition: config.get 'poi.transition.enable', true
  handleSetTheme: (e) ->
    theme = e.target.value
    if @state.theme != theme
      window.applyTheme theme
  onThemeChange: (e) ->
    @setState
      theme: e.detail.theme
  handleOpenCustomCss: (e) ->
    try
      d = path.join(EXROOT, 'hack', 'custom.css')
      fs.ensureFileSync d
      openItem d
    catch e
      toggleModal __('Edit custom CSS'), __("Failed. Perhaps you don't have permission to it.")
  handleSetSVGIcon: ->
    enabled = @state.enableSVGIcon
    config.set 'poi.useSVGIcon', !enabled
    window.useSVGIcon = !enabled
    @setState
      enableSVGIcon: !enabled
  handleSetTransition: ->
    enabled = @state.enableTransition
    config.set 'poi.transition.enable', !enabled
    window.dispatchEvent new Event('display.transition.change')
    @setState
      enableTransition: !enabled
  componentDidMount: ->
    window.addEventListener 'theme.change', @onThemeChange
  componentWillUnmount: ->
    window.removeEventListener 'theme.change', @onThemeChange
  render: ->
    <Grid>
      <Col xs={6}>
        <FormControl componentClass="select" value={@state.theme} onChange={@handleSetTheme}>
          {
            window.allThemes.map (theme, index) ->
              <option key={index} value={theme}>
                { if theme is '__default__' then 'Default' else (theme[0].toUpperCase() + theme.slice(1)) }
              </option>
          }
        </FormControl>
      </Col>
      <Col xs={6}>
        <Button bsStyle='primary' onClick={@handleOpenCustomCss} block>{__ 'Edit custom CSS'}</Button>
      </Col>
      <Col xs={12}>
        <Checkbox checked={@state.enableSVGIcon} onChange={@handleSetSVGIcon} >
          {__ 'Use SVG Icon'}
        </Checkbox>
      </Col>
      <Col xs={12}>
        <Checkbox checked={@state.enableTransition} onChange={@handleSetTransition} >
          {__ 'Enable Smooth Transition'}
        </Checkbox>
      </Col>
    </Grid>

ZoomingConfig = React.createClass
  getInitialState: ->
    zoomLevel: config.get 'poi.zoomLevel', 1
  handleChangeZoomLevel: (e) ->
    zoomLevel = e.target.value
    zoomLevel = parseFloat(zoomLevel)
    return if @state.zoomLevel == zoomLevel
    window.zoomLevel = zoomLevel
    window.dispatchEvent new Event('resize')
    config.set('poi.zoomLevel', zoomLevel)
    @setState
      zoomLevel: zoomLevel
  render: ->
    <Grid>
      <Col xs={6}>
        <OverlayTrigger placement='top' overlay={
            <Tooltip id='displayconfig-zoom'>{__ 'Zoom level'} <strong>{parseInt(@state.zoomLevel * 100)}%</strong></Tooltip>
          }>
          <FormControl type="range" onInput={@handleChangeZoomLevel}
            min={0.5} max={2.0} step={0.05} defaultValue={@state.zoomLevel} />
        </OverlayTrigger>
      </Col>
    </Grid>

ChangeResolutionConfig = React.createClass
  getInitialState: ->
    gameWidth =
      if (config.get 'poi.webview.width', -1) == -1
        if config.get('poi.layout', 'horizontal') == 'horizontal'
          window.innerWidth * (if window.doubleTabbed then 4.0 / 7.0 else 5.0 / 7.0)
        else
          window.innerWidth
      else
        config.get 'poi.webview.width', -1
    gameWidth: gameWidth
    useFixedResolution: config.get('poi.webview.width', -1) != -1
  handleSetWebviewWidth: (value, useFixedResolution) ->
    @setState
      gameWidth: value
    width = parseInt value
    return if isNaN(width) || width < 0 || !useFixedResolution
    if window.layout == 'horizontal'
      width = Math.min(width, window.innerWidth - 150)
    # Avoid setting a huge size by mistake
    max_height = window.screen.availHeight
    max_width = window.screen.availWidth
    zoomLevel = window.zoomLevel
    if window.layout == 'horizontal'
      max_width = max_width - (if window.doubleTabbed then 500 else 375) * zoomLevel
    else
      max_height = max_height - (200 * zoomLevel)
      max_width = max_height / 480 * 800
    width = Math.min(max_width, width)
    window.webviewWidth = width
    window.dispatchEvent new Event('webview.width.change')
    config.set 'poi.webview.width', width
  handleResize: ->
    width = Math.ceil window.webviewFactor * 800
    @setState
      gameWidth: width
  handleSetFixedResolution: (e) ->
    current = Object.clone @state.useFixedResolution
    @setState
      useFixedResolution: !current
    if current
      config.set 'poi.webview.width', -1
      @handleResize()
      window.webviewWidth = -1
      window.dispatchEvent new Event('webview.width.change')
    else
      @handleSetWebviewWidth(@state.gameWidth, !current)
  handleSetWebviewWidthWithEvent: (e) ->
    @handleSetWebviewWidth e.target.value, @state.useFixedResolution
  componentDidMount: ->
    window.addEventListener 'resize', @handleResize
  componentWillUnmount: ->
    window.removeEventListener 'resize', @handleResize
  render: ->
    <Grid>
      <Col xs=8>
        <Checkbox checked={!@state.useFixedResolution} onChange={@handleSetFixedResolution} >
          {__ 'Adaptive resolution based on the window'}
        </Checkbox>
      </Col>
      <Col xs=4>
        <FormControl componentClass="select"
         value={@state.gameWidth}
         onChange={@handleSetWebviewWidthWithEvent}
         disabled={!@state.useFixedResolution} >
          <option key={-1} value={@state.gameWidth} hidden>{Math.round(@state.gameWidth/800*100)}%</option>
          {
            i = 0
            while i < 4
              i++
              <option key={i} value={i * 400}>
                {i * 50}%
              </option>
          }
        </FormControl>
      </Col>
      <Col id="poi-resolution-config" xs=12 style={display: 'flex', alignItems: 'center'}>
        <div style={flex: 1}>
          <FormControl type="number"
            value={Math.round(@state.gameWidth)}
            onChange={@handleSetWebviewWidthWithEvent}
            readOnly={!@state.useFixedResolution} />
        </div>
        <div style={flex: 'none', width: 15, paddingLeft: 5}>
          x
        </div>
        <div style={flex: 1}>
          <FormControl type="number" value={Math.round(@state.gameWidth * 480 / 800)} readOnly />
        </div>
        <div style={flex: 'none', width: 15, paddingLeft: 5}>
          px
        </div>
      </Col>
    </Grid>

DisplayConfig = React.createClass
  render: ->
    <form>
      <div className="form-group">
        <Divider text={__("Layout")} />
        <ChangeLayoutConfig />
      </div>
      <div className="form-group">
        <Divider text={__ 'Themes'} />
        <ChangeThemeConfig />
      </div>
      <div className="form-group">
        <Divider text={__ 'Zoom'} />
        <ZoomingConfig />
      </div>
      <div className="form-group">
        <Divider text={__ 'Game resoultion'} />
        <ChangeResolutionConfig />
      </div>
    </form>

module.exports = DisplayConfig
