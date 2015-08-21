path = require 'path-extra'
fs = require 'fs-extra'
glob = require 'glob'
remote = require 'remote'
{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Button, ButtonGroup, Input, Alert, OverlayTrigger, Tooltip} = ReactBootstrap
{config, toggleModal} = window
{APPDATA_PATH} = window
{showItemInFolder, openItem} = require 'shell'
Divider = require './divider'
NavigatorBar = require './navigator-bar'
themes = glob.sync(path.join(ROOT, 'assets', 'themes', '*')).map (filePath) ->
  path.basename filePath
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
    gameWidth: gameWidth
    useFixedResolution: config.get('poi.webview.width', -1) != -1
    enableConfirmQuit: config.get 'poi.confirm.quit', false
    tabbedLayout: config.get 'poi.tabarea', "horizontal"
    enableNotify: config.get 'poi.notify.enabled', true
    notifyVolume: config.get 'poi.notify.volume', true
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
  handleSetTabbed: (tabbed) ->
    config.set 'poi.tabarea', tabbed
    if tabbed = "L"
      layout = "L"
    event = new CustomEvent 'layout.change',
      bubbles: true
      cancelable: true
      detail:
        layout: layout
    window.dispatchEvent event
    @setState
      layout: layout
      enableLTabbed: !enabled
    toggleModal '布局设置', '设置成功，请重新打开软件使得布局生效。'
  handleSetDoubleTabbed: ->
    enabled = if @state.tabbedLayout == 'double' then true else false
    config.set 'poi.tabarea', 'double'
    @setState
      tabbedLayout: 'double'
    toggleModal '布局设置', '设置成功，请重新打开软件使得布局生效。'
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
      toggleModal '删除 Cookies', '删除成功。'
  handleClearCache: (e) ->
    remote.getCurrentWebContents().session.clearCache ->
      toggleModal '删除缓存', '删除成功。'
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
        <Divider text="通知" />
        <Grid>
          <Col xs={6}>
            <Button bsStyle={if @state.enableNotify then 'success' else 'danger'} onClick={@handleSetNotify} style={width: '100%'}>
              {if @state.enableNotify then '√ ' else ''}开启通知
            </Button>
          </Col>
          <Col xs={6}>
            <OverlayTrigger placement='top' overlay={
                <Tooltip>音量 <strong>{parseInt(@state.notifyVolume * 100)}%</strong></Tooltip>
              }>
              <Input type="range" ref="notifyVolume" onInput={@handleChangeNotifyVolume}
                min={0.0} max={1.0} step={0.05} defaultValue={@state.notifyVolume} />
            </OverlayTrigger>
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
          <Col xs={12}>
            <Button bsStyle={if @state.tabbedLayout == 'L' then 'success' else 'danger'} onClick={@handleSetTabbed.bind @, 'L'} style={width: '100%'}>
              {if @state.layout == 'L' then '√ ' else ''}使用L布局
            </Button>
          </Col>
          <Col xs={12}>
            <Button bsStyle={if @state.tabbedLayout == 'double' then 'success' else 'danger'} onClick={@handleSetTabbed.bind @, 'double'} style={width: '100%'}>
              {if @state.layout == 'double' then '√ ' else ''}使用双栏布局
            </Button>
          </Col>
        </Grid>
      </div>
      <div className="form-group" >
        <Divider text="出击检查" />
        <div style={display:"flex", flexFlow:"row nowrap"}>
          <div style={flex:2, margin:"0 15px"}>
            <Input type="checkbox" label="船位检查" checked={@state.mapStartCheckShip} onChange={@handleSetMapStartCheckShip} />
          </div>
          <div style={flex:2, margin:"0 15px"}>
            <Input type="checkbox" label="装备检查" checked={@state.mapStartCheckItem} onChange={@handleSetMapStartCheckItem} />
          </div>
        </div>
        <div style={flex:2, margin:"0 15px"}>
          <Input type="number" label="船位少于此数量时警告" ref="freeShipSlot" value={@state.freeShipSlot} onChange={@handleSetMapStartCheckFreeShipSlot} placeholder="船位警告触发数" />
        </div>
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
      <div className="form-group">
        <Divider text="游戏分辨率" />
        <div style={display: 'flex', marginLeft: 15, marginRight: 15}>
          <Input type='checkbox' ref="useFixedResolution" label='使用固定分辨率' checked={@state.useFixedResolution} onChange={@handleSetFixedResolution} />
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
