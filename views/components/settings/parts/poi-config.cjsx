path = require 'path-extra'
glob = require 'glob'
{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Button, ButtonGroup, Input} = ReactBootstrap
{config} = window
Divider = require './divider'
NavigatorBar = require './navigator-bar'
themes = glob.sync(path.join(ROOT, 'assets', 'themes', '*')).map (filePath) ->
  path.basename filePath
PoiConfig = React.createClass
  getInitialState: ->
    layout: config.get 'poi.layout', 'horizonal'
    theme: config.get 'poi.theme', '__default__'
    gameWidth: config.get('poi.scale', window.gameScale) * window.innerWidth
    useFixedResolution: if config.get('poi.scale') then true else false
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
  handleSetTheme: (theme) ->
    theme = @refs.theme.getValue()
    return if @state.theme == theme
    config.set 'poi.theme', theme
    event = new CustomEvent 'theme.change',
      bubbles: true
      cancelable: true
      detail:
        theme: theme
    window.dispatchEvent event
    @setState {theme}
  handleSetScale: (e) ->
    @setState
      gameWidth: @refs.scale.getValue()
    width = parseInt @refs.scale.getValue()
    return if isNaN(width) || width < 0 || !@state.useFixedResolution
    scale = width / window.innerWidth
    window.gameScale = scale
    window.dispatchEvent new Event('scale.change')
    config.set 'poi.scale', scale
  handleResize: ->
    {gameWidth} = @state
    width = parseInt gameWidth
    return if isNaN(width) || width < 0
    if @state.useFixedResolution
      scale = width / window.innerWidth
      window.gameScale = scale
      window.dispatchEvent new Event('scale.change')
      config.set 'poi.scale', scale
    else
      @setState
        gameWidth: window.innerWidth * window.gameScale
  handleSetFixedResolution: (e) ->
    current = @state.useFixedResolution
    if current
      config.set 'poi.scale', null
      @setState
        useFixedResolution: false
    else
      @setState
        useFixedResolution: true
      @handleResize()
  componentDidMount: ->
    window.addEventListener 'resize', @handleResize
  componentWillUnmount: ->
    window.removeEventListener 'resize', @handleResize
  render: ->
    <form id="poi-config">
      <div className="form-group" id='navigator-bar'>
        <Divider text="导航" />
        <NavigatorBar />
      </div>
      <div className="form-group">
        <Divider text="布局" />
        <Grid>
          <Col xs={6}>
            <Button bsStyle={if @state.layout == 'horizonal' then 'success' else 'danger'} onClick={@handleSetLayout.bind @, 'horizonal'} style={width: '100%'}>
              {if @state.layout == 'horizonal' then '√ ' else ''}使用横版布局
            </Button>
          </Col>
          <Col xs={6}>
            <Button bsStyle={if @state.layout == 'vertical' then 'success' else 'danger'} onClick={@handleSetLayout.bind @, 'vertical'} style={width: '100%'}>
              {if @state.layout == 'vertical' then '√ ' else ''}使用纵版布局
            </Button>
          </Col>
        </Grid>
      </div>
      <div className="form-group">
        <Divider text="主题" />
        <Grid>
          <Col xs={12}>
            <Input type="select" ref="theme" value={@state.theme} onChange={@handleSetTheme}>
              {
                themes.map (theme, index) ->
                  <option key={index} value={theme}>{theme[0].toUpperCase() + theme.slice(1)}</option>
              }
              <option key={-1} value="__default__">Default</option>
            </Input>
          </Col>
        </Grid>
      </div>
      {
        if window.layout == 'horizonal'
          <div className="form-group">
            <Divider text="游戏分辨率" />
            <Grid>
              <Col xs={12}>
                <Input type='checkbox' ref="useFixedResolution" label='使用固定分辨率' checked={@state.useFixedResolution} onChange={@handleSetFixedResolution} />
              </Col>
            </Grid>
            <Grid id="poi-resolutionr-config">
              <Col xs={5}>
                <Input type="number" ref="scale" value={@state.gameWidth} onChange={@handleSetScale} readOnly={!@state.useFixedResolution} />
              </Col>
              <Col xs={1}>
                x
              </Col>
              <Col xs={5}>
                <Input type="number" value={@state.gameWidth * 480 / 800} readOnly />
              </Col>
              <Col xs={1}>
                px
              </Col>
            </Grid>
          </div>
      }
    </form>

module.exports = PoiConfig
