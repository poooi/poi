fs = require 'fs-extra'
path = require 'path-extra'
glob = require 'glob'
{showItemInFolder, openItem, openExternal} = require 'shell'
{ROOT, EXROOT, _, $, $$, React, ReactBootstrap} = window
{Button, Alert, OverlayMixin, Modal, OverlayTrigger, Tooltip} = ReactBootstrap
{config, proxy, remote, log, success, warn, error, toggleModal} = window


# Hackable panels
window.hack = {}

# poi menu
if process.platform == 'darwin'
  template = [
    {
      label: 'Poi'
      submenu: [
        {
          label: 'About'
          selector: 'orderFrontStandardAboutPanel:'
        },
        { type: 'separator' },
        {
          label: 'Services'
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Hide Poi'
          accelerator: 'CmdOrCtrl+H'
          selector: 'hide:'
        },
        {
          label: 'Hide Others'
          accelerator: 'CmdOrCtrl+Shift+H'
          selector: 'hideOtherApplications:'
        },
        {
          label: 'Show All'
          selector: 'unhideAllApplications:'
        },
        { type: 'separator' },
        {
          label: 'Quit'
          accelerator: 'CmdOrCtrl+Q'
          selector: 'terminate:'
        }
      ]
    },
    {
      label: 'Edit'
      submenu: [
        {
          label: 'Undo'
          accelerator: 'CmdOrCtrl+Z'
          selector: 'undo:'
        },
        {
          label: 'Redo'
          accelerator: 'Shift+CmdOrCtrl+Z'
          selector: 'redo:'
        },
        { type: 'separator' },
        {
          label: 'Cut'
          accelerator: 'CmdOrCtrl+X'
          selector: 'cut:'
        },
        {
          label: 'Copy'
          accelerator: 'CmdOrCtrl+C'
          selector: 'copy:'
        },
        {
          label: 'Paste'
          accelerator: 'CmdOrCtrl+V'
          selector: 'paste:'
        },
        {
          label: 'Select All'
          accelerator: 'CmdOrCtrl+A'
          selector: 'selectAll:'
        }
      ]
    },
    {
      label: 'View'
      submenu: [
        {
          label: 'Reload'
          accelerator: 'CmdOrCtrl+R'
          click: ->
            $('kan-game webview').reload()
        },
        {
          label: 'Stop'
          accelerator: 'CmdOrCtrl+.'
          click: ->
            $('kan-game webview').stop()
        },
        {
          label: 'Open Developer Tools'
          accelerator: 'Alt+CmdOrCtrl+I'
          click: ->
            remote.getCurrentWindow().openDevTools({detach: true})
        },
        {
          label: 'Open Developer Tools of WebView'
          click: ->
            $('kan-game webview').openDevTools({detach: true})
        }
      ]
    },
    {
      label: 'Window'
      submenu: [
        {
          label: 'Minimize'
          accelerator: 'CmdOrCtrl+M'
          selector: 'performMiniaturize:'
        },
        { type: 'separator' },
        {
          label: 'Bring All to Front'
          selector: 'arrangeInFront:'
        }
      ]
    },
    {
      label: 'Help'
      submenu: [
        {
          label: 'Wiki'
          click: ->
            openExternal 'https://github.com/poooi/poi/wiki'
        },
        {
          label: 'Poi Statistics'
          click: ->
            openExternal 'http://db.kcwiki.moe/'
        },
        { type: 'separator' },
        {
          label: 'Report Issue'
          click: ->
            openExternal 'https://github.com/poooi/poi/issues'
        },
        {
          label: 'Search Issues'
          click: ->
            openExternal 'https://github.com/issues?q=+is%3Aissue+user%3Apoooi'
        }
      ]
    }
  ]
  Menu = remote.require('menu')
  menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

# Main tabbed area
layout =
  if config.get('poi.tabarea', false) == 'double'
    ControlledTabArea = require './double-tabareas'
    'double'
  else if config.get('poi.tabarea', false) == 'L'
    {ControlledTabArea, AdditionalTabArea, PlusTabArea} = require './L-tabareas'
    'L'
  else
    ControlledTabArea = require './single-tabarea'
    'single'

# Alert info
PoiAlert = React.createClass
  getInitialState: ->
    message: 'poi 等待游戏数据中……'
    type: 'success'
  handleAlert: (e) ->
    @setState
      message: e.detail.message
      type: e.detail.type
  componentDidMount: ->
    window.addEventListener 'poi.alert', @handleAlert
  componentWillUnmount: ->
    window.removeEventListener 'poi.alert', @handleAlert
  render: ->
    <Alert bsStyle={@state.type}>{@state.message}</Alert>

# Map Reminder
PoiMapReminder = React.createClass
  getInitialState: ->
    battling: '未出击'
  handleResponse: (e) ->
    reqPath = e.detail.path
    {body} = e.detail
    switch reqPath
      when '/kcsapi/api_port/port'
        @setState
          battling: '未出击'
      when '/kcsapi/api_req_map/start'
        @setState
          battling: '出击海域: ' + body.api_maparea_id + '-' + body.api_mapinfo_no
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  render: ->
    <Alert>{@state.battling}</Alert>

# Controller icon bar
{capturePageInMainWindow} = remote.require './lib/utils'
PoiControl = React.createClass
  getInitialState: ->
    muted: false
    alwaysOnTop: false
  handleCapturePage: ->
    bound = $('kan-game webview').getBoundingClientRect()
    rect =
      x: Math.ceil bound.left
      y: Math.ceil bound.top
      width: Math.floor bound.width
      height: Math.floor bound.height
    capturePageInMainWindow rect, (err, filename) ->
      if err?
        error '截图保存失败'
      else
        success "截图保存在 #{filename}"
  handleOpenCacheFolder: ->
    dir = 'cache'
    dir = 'MyCache' if process.platform == 'darwin'
    try
      fs.ensureDirSync path.join(window.EXROOT, dir)
      openItem path.join(window.EXROOT, dir)
    catch e
      toggleModal '打开缓存目录', '打开失败，可能没有创建文件夹的权限'
  handleOpenScreenshotFolder: ->
    d = if process.platform == 'darwin' then path.join(path.homedir(), 'Pictures', 'Poi') else path.join(global.EXROOT, 'screenshots')
    try
      fs.ensureDirSync d
      openItem d
    catch e
      toggleModal '打开截图目录', '打开失败，可能没有创建文件夹的权限'
  handleSetMuted: ->
    muted = !@state.muted
    config.set 'poi.content.muted', muted
    $('kan-game webview').setAudioMuted muted
    @setState {muted}
  handleSetAlwaysOnTop: ->
    alwaysOnTop = !@state.alwaysOnTop
    config.set 'poi.content.alwaysOnTop', alwaysOnTop
    remote.getCurrentWindow().setAlwaysOnTop alwaysOnTop
    @setState {alwaysOnTop}
  handleOpenDevTools: ->
    remote.getCurrentWindow().openDevTools
      detach: true
  handleOpenWebviewDevTools: ->
    $('kan-game webview').openDevTools
      detach: true
  handleJustifyLayout: ->
    window.dispatchEvent new Event('resize')
  componentDidMount: ->
    setTimeout =>
      try
        if config.get 'poi.content.muted', false
          @handleSetMuted()
        if config.get 'poi.content.alwaysOnTop', false
          @handleSetAlwaysOnTop()
      catch e
        false
    , 1000
  render: ->
    <div>
      <OverlayTrigger placement='left' overlay={<Tooltip>开发人员工具</Tooltip>}>
        <Button onClick={@handleOpenDevTools} onContextMenu={@handleOpenWebviewDevTools} bsSize='small'><FontAwesome name='gears' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>缓存目录</Tooltip>}>
        <Button onClick={@handleOpenCacheFolder} bsSize='small'><FontAwesome name='bolt' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>截图目录</Tooltip>}>
        <Button onClick={@handleOpenScreenshotFolder} bsSize='small'><FontAwesome name='photo' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>自动适配页面</Tooltip>}>
        <Button onClick={@handleJustifyLayout} bsSize='small'><FontAwesome name='arrows-alt' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>{if @state.alwaysOnTop then '取消置顶' else '窗口置顶'}</Tooltip>}>
        <Button onClick={@handleSetAlwaysOnTop} bsSize='small'><FontAwesome name={if @state.alwaysOnTop then 'arrow-down' else 'arrow-up'} /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>一键截图</Tooltip>}>
        <Button onClick={@handleCapturePage} bsSize='small'><FontAwesome name='camera-retro' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>{if @state.muted then '关闭游戏声音' else '打开游戏声音'}</Tooltip>}>
        <Button onClick={@handleSetMuted} bsSize='small'><FontAwesome name={if @state.muted then 'volume-off' else 'volume-up'} /></Button>
      </OverlayTrigger>
    </div>

# Notification modal
ModalTrigger = React.createClass
  getInitialState: ->
    isModalOpen: false
    title: null
    content: null
  handleToggle: ->
    window.modalLocked = false
    @setState
      isModalOpen: false
    window.showModal()
  handleModal: (e) ->
    window.modalLocked = true
    @setState
      isModalOpen: true
      title: e.detail.title
      content: e.detail.content
      footer: e.detail.footer
  componentDidMount: ->
    window.addEventListener 'poi.modal', @handleModal
  componentWillUnmount: ->
    window.removeEventListener 'poi.modal', @handleModal
  renderFooter: (footer) ->
    return unless footer? and footer.length? and footer.length > 0
    self = @
    footer.map (button, index) ->
      <Button key={index} onClick={
        (e) ->
          self.handleToggle()
          button.func()
      } bsStyle={button.style}>{button.name}</Button>
  render: ->
    <Modal autoFocus={true}
           animation={true}
           show={@state.isModalOpen}
           onHide={@handleToggle}>
      <Modal.Header closeButton>
        <Modal.Title>{@state.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {@state.content}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={@handleToggle}>关闭</Button>
        {@renderFooter @state.footer}
      </Modal.Footer>
    </Modal>

# Custom css injector
CustomCssInjector = React.createClass
  render: ->
    <link rel='stylesheet' href={path.join(window.EXROOT, 'hack', 'custom.css')} />

React.render <PoiAlert id='poi-alert' />, $('poi-alert')
React.render <PoiMapReminder id='poi-map-reminder'/>, $('poi-map-reminder')
React.render <PoiControl />, $('poi-control')
React.render <ModalTrigger />, $('poi-modal-trigger')
React.render <ControlledTabArea />, $('poi-nav-tabs')
React.render <CustomCssInjector />, $('poi-css-injector')
if layout == 'L'
  React.render <AdditionalTabArea />, $('poi-additional-tabs')
  React.render <PlusTabArea />, $('poi-tab-plus')

# Readme contents
dontShowAgain = ->
  config.set('poi.first', POI_VERSION)
if config.get('poi.first', '0.0.0') != POI_VERSION
  title = 'README'
  content =
    <div>
      <p>诶嘿！欢迎使用 poi v{POI_VERSION}！使用之前看看下面！</p>
      <p style={color: 'red'}>poi 不能在含有中文或者全角字符的文件目录下正常运行！</p>
      <p style={color: 'red'}>poi 不会修改任何游戏内的发包与收包，但是请使用可信的 poi 版本和可信的插件！</p>
      <p>poi 默认不使用代理。更改代理的设置在设置面板中可以找到。
      <ul>
        <li>使用岛风go的选择HTTP代理，地址是127.0.0.1，端口8099。（默认情况下）</li>
        <li>使用自己本地的Shadowsocks或者Socks5代理的选择Socks代理。</li>
        <li>使用Shadowsocks也可以用内置的Shadowsocks模块，不过性能不是很好。</li>
        <li>使用VPN的选择不使用代理就好了。</li>
      </ul></p>
      <p>poi 如果有显示错误，可以手动调整一下内容大小，布局会自动适配。</p>
      <p>如果 poi 的运行不流畅，可以在设置中关闭一部分插件，对插件的操作重启后生效。</p>
      <p>更多帮助参考 poi wiki - https://github.com/poooi/poi/wiki </p>
      <p>poi 交流群：378320628</p>
      <p>为 poi 贡献代码和编写插件 - GitHub: https://github.com/poooi/poi </p>
    </div>
  footer = [
    name: '知道啦！'
    func: dontShowAgain
    style: 'success'
  ]
  window.toggleModal title, content, footer

# F5 & Ctrl+F5
window.addEventListener 'keydown', (e) ->
  if process.platform == 'darwin' and e.keyCode is 82 and e.metaKey
    if e.shiftKey # cmd + shift + r
      $('kan-game webview').reloadIgnoringCache()
    else # cmd + r
      # Catched by menu
      # $('kan-game webview').reload()
      false
  else if e.keyCode is 116
    if e.ctrlKey # ctrl + f5
      $('kan-game webview').reloadIgnoringCache()
    else # f5
      $('kan-game webview').reload()

# Confirm before quit
confirmExit = false
exitPoi = ->
  confirmExit = true
  window.close()
window.onbeforeunload = (e) ->
  if confirmExit || !config.get('poi.confirm.quit', false)
    e.returnValue = true
  else
    toggleModal '关闭 poi', '确认退出？', [
      name: '确定退出'
      func: exitPoi
      style: 'warning'
    ]
    e.returnValue = false

window.addEventListener 'game.request', (e) ->
  {method} = e.detail
  resPath = e.detail.path
  log "正在请求 #{method} #{resPath}"
window.addEventListener 'game.response', (e) ->
  {method, body, postBody} = e.detail
  resPath = e.detail.path
  console.log [resPath, body, postBody] if process.env.DEBUG?
  success "获得数据 #{method} #{resPath}"
window.addEventListener 'network.error.retry', (e) ->
  {counter} = e.detail
  error "网络连接错误，正在进行第#{counter}次重试"
window.addEventListener 'network.invalid.code', (e) ->
  {code} = e.detail
  error "服务器返回非正常的 HTTP 状态码，HTTP #{code}"
window.addEventListener 'network.error', ->
  error '网络连接失败，请检查网络与代理设置'
