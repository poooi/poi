fs = require 'fs-extra'
path = require 'path-extra'
glob = require 'glob'
i18n = require 'i18n'
{__, __n} = i18n
{showItemInFolder, openItem} = require 'shell'
{ROOT, EXROOT, _, $, $$, React, ReactBootstrap} = window
{Button, Alert, OverlayMixin, Modal, OverlayTrigger, Tooltip} = ReactBootstrap
{config, proxy, remote, log, success, warn, error, toggleModal} = window

# i18n configure
i18n.configure({
    locales:['en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
    defaultLocale: 'zh-CN',
    directory: path.join(__dirname, "..", "i18n"),
    updateFiles: false,
    indent: "\t",
    extension: '.json'
})
i18n.setLocale(window.language)

# Hackable panels
window.hack = {}

# Main tabbed area
ControlledTabArea =
  if config.get('poi.tabarea.double', false)
    require './double-tabareas'
  else
    require './single-tabarea'

# Alert info
PoiAlert = React.createClass
  getInitialState: ->
    message: __ 'Waiting response...'
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
    battling: __ 'not in a sortie'
  handleMapReminder: (e)->
    @setState
      battling: e.detail.mapArea
  componentDidMount: ->
    window.addEventListener 'poi.map.reminder', @handleMapReminder
  componentWillUnmount: ->
    window.removeEventListener 'poi.map.reminder', @handleMapReminder
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
        error __ 'Failed to save the screenshot'
      else
        success "#{__ 'screenshot saved to'} #{filename}"
  handleOpenCacheFolder: ->
    dir = 'cache'
    dir = 'MyCache' if process.platform == 'darwin'
    try
      fs.ensureDirSync path.join(window.EXROOT, dir)
      openItem path.join(window.EXROOT, dir)
    catch e
      toggleModal __ 'Open cache dir', __ "Failed. Perhaps you don't have permission to it."
  handleOpenScreenshotFolder: ->
    d = if process.platform == 'darwin' then path.join(path.homedir(), 'Pictures', 'Poi') else path.join(global.EXROOT, 'screenshots')
    try
      fs.ensureDirSync d
      openItem d
    catch e
      toggleModal __ 'Open screenshot dir', __ "Failed. Perhaps you don't have permission to it."
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
      <OverlayTrigger placement='left' overlay={<Tooltip>{__ "Developer Tools"}</Tooltip>}>
        <Button onClick={@handleOpenDevTools} onContextMenu={@handleOpenWebviewDevTools} bsSize='small'><FontAwesome name='gears' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>{__ "Open cache dir"}</Tooltip>}>
        <Button onClick={@handleOpenCacheFolder} bsSize='small'><FontAwesome name='bolt' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>{__ "Open screenshot dir"}</Tooltip>}>
        <Button onClick={@handleOpenScreenshotFolder} bsSize='small'><FontAwesome name='photo' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>{__ "Auto adjust"}</Tooltip>}>
        <Button onClick={@handleJustifyLayout} bsSize='small'><FontAwesome name='arrows-alt' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>{if @state.alwaysOnTop then __ "Dont always on top" else __ "Always on top"}</Tooltip>}>
        <Button onClick={@handleSetAlwaysOnTop} bsSize='small'><FontAwesome name={if @state.alwaysOnTop then 'arrow-down' else 'arrow-up'} /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>{__ "Take a screenshot"}</Tooltip>}>
        <Button onClick={@handleCapturePage} bsSize='small'><FontAwesome name='camera-retro' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>{if @state.muted then __ "Volume off" else __ "Volume on"}</Tooltip>}>
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
        <Button onClick={@handleToggle}>{__ "Cancel"}</Button>
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
    name: __ "I know"
    func: dontShowAgain
    style: 'success'
  ]
  window.toggleModal title, content, footer

# Confirm before quit
confirmExit = false
exitPoi = ->
  confirmExit = true
  window.close()
window.onbeforeunload = (e) ->
  if confirmExit || !config.get('poi.confirm.quit', false)
    return true
  else
    toggleModal __("Exit"), __('Confirm?'), [
      name: __ 'Confirm'
      func: exitPoi
      style: 'warning'
    ]
    return false

window.addEventListener 'game.request', (e) ->
  {method} = e.detail
  resPath = e.detail.path
  log "#{__ "Requesting"} #{method} #{resPath}"
window.addEventListener 'game.response', (e) ->
  {method, body, postBody} = e.detail
  resPath = e.detail.path
  console.log [resPath, body, postBody] if process.env.DEBUG?
  success "#{__ "Hit"} #{method} #{resPath}"
window.addEventListener 'network.error.retry', (e) ->
  {counter} = e.detail
  error __n "Connection failed after %s retry", "Connection failed after %s retries", counter
window.addEventListener 'network.invalid.code', (e) ->
  {code} = e.detail
  error __ "Network error: HTTP %s", code
window.addEventListener 'network.error', ->
  error __ 'Connection failed.'
