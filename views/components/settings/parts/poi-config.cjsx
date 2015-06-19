path = require 'path-extra'
fs = require 'fs-extra'
glob = require 'glob'
rimraf = require 'rimraf'
{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Button, ButtonGroup, Input, Alert} = ReactBootstrap
{config, toggleModal} = window
{APPDATA_PATH} = window
{openItem} = require 'shell'
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
    enableConfirmQuit: config.get 'poi.confirm.quit', false
  handleSetConfirmQuit: ->
    enabled = @state.enableConfirmQuit
    config.set 'poi.confirm.quit', !enabled
    @setState
      enableConfirmQuit: !enabled
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
  handleClearCookie: (e) ->
    rimraf path.join(APPDATA_PATH, 'Cookies'), (err) ->
      if err?
        toggleModal '删除 Cookies', "删除失败，你可以手动删除 #{path.join(APPDATA_PATH, 'Cookies')}"
      else
        toggleModal '删除 Cookies', '删除成功，请立刻重启软件。'
  handleClearCache: (e) ->
    error = null
    rimraf path.join(APPDATA_PATH, 'Cache'), (err) ->
      error = error || err
      rimraf path.join(APPDATA_PATH, 'Pepper Data'), (err) ->
        error = error || err
        if error
          toggleModal '删除浏览器缓存', "删除失败，你可以手动删除 #{path.join(APPDATA_PATH, 'Cache')} 和 #{path.join(APPDATA_PATH, 'Pepper Data')}"
        else
          toggleModal '删除浏览器缓存', '删除成功，请立刻重启软件。'
  handleOpenCustomCss: (e) ->
    try
      d = path.join(EXROOT, 'hack', 'custom.css')
      fs.ensureFileSync d
      openItem d
    catch e
      toggleModal '编辑自定义 CSS', '打开失败，可能没有创建文件的权限'
  componentDidMount: ->
    window.addEventListener 'resize', @handleResize
  componentWillUnmount: ->
    window.removeEventListener 'resize', @handleResize
  render: ->
    <form id="poi-config">
      <div className="form-group" id='navigator-bar'>
        <Divider text="浏览器" />
        <NavigatorBar />
        <Grid>
          <Col xs={12}>
            <Input type="checkbox" label="关闭前弹出确认窗口" checked={@state.enableConfirmQuit} onChange={@handleSetConfirmQuit} />
          </Col>
        </Grid>
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
        <Divider text="Cookies 和缓存" />
        <Grid>
          <Col xs={6}>
            <Button bsStyle="danger" onClick={@handleClearCookie} style={width: '100%'}>
              删除 Cookies
            </Button>
          </Col>
          <Col xs={6}>
            <Button bsStyle="danger" onClick={@handleClearCache} style={width: '100%'}>
              删除浏览器缓存
            </Button>
          </Col>
          <Col xs={12}>
            <Alert bsStyle='warning' style={marginTop: '10px'}>
              如果经常猫，删除以上两项。
            </Alert>
          </Col>
        </Grid>
      </div>
      <div className="form-group">
        <Divider text="主题" />
        <Grid>
          <Col xs={6}>
            <Input type="select" ref="theme" value={@state.theme} onChange={@handleSetTheme}>
              {
                themes.map (theme, index) ->
                  <option key={index} value={theme}>{theme[0].toUpperCase() + theme.slice(1)}</option>
              }
              <option key={-1} value="__default__">Default</option>
            </Input>
          </Col>
          <Col xs={6}>
            <Button bsStyle='primary' onClick={@handleOpenCustomCss} block>编辑自定义 CSS</Button>
          </Col>
        </Grid>
      </div>
      {
        if @state.layout == 'horizonal'
          <div className="form-group">
            <Divider text="游戏分辨率" />
            <div style={display: 'flex', marginLeft: 15, marginRight: 15}>
              <Input type='checkbox' ref="useFixedResolution" label='使用固定分辨率' checked={@state.useFixedResolution} onChange={@handleSetFixedResolution} />
            </div>
            <div id="poi-resolution-config" style={display: 'flex', marginLeft: 15, marginRight: 15, alignItems: 'center'}>
              <div style={flex: 1}>
                <Input type="number" ref="scale" value={@state.gameWidth} onChange={@handleSetScale} readOnly={!@state.useFixedResolution} />
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
      }
    </form>

module.exports = PoiConfig
