path = require 'path-extra'
glob = require 'glob'
{ROOT, EXROOT, _, $, $$, React, ReactBootstrap} = window
{Button, ButtonToolbar, TabbedArea, TabPane, Alert, OverlayMixin, Modal, DropdownButton, OverlayTrigger, Tooltip} = ReactBootstrap
{config, proxy, remote, log, success, warn, error} = window

# Get components
components = glob.sync(path.join(ROOT, 'views', 'components', '*'))
# Discover plugins and remove unused plugins
plugins = glob.sync(path.join(ROOT, 'plugins', '*'))
exPlugins = glob.sync(path.join(EXROOT, 'plugins', '*'))
plugins = plugins.concat(exPlugins)
plugins = plugins.filter (filePath) ->
  # Every plugin will be required
  try
    plugin = require filePath
    return config.get "plugin.#{plugin.name}.enable", true
  catch e
    return false

components = components.map (filePath) ->
  component = require filePath
  component.priority = 10000 unless component.priority?
  component
components = components.filter (component) ->
  component.show isnt false and component.name != 'SettingsView'
components = _.sortBy(components, 'priority')

plugins = plugins.map (filePath) ->
  plugin = require filePath
  plugin.priority = 10000 unless plugin.priority?
  plugin
plugins = plugins.filter (plugin) ->
  plugin.show isnt false
plugins = _.sortBy(plugins, 'priority')

settings = require path.join(ROOT, 'views', 'components', 'settings')

ControlledTabArea = React.createClass
  getInitialState: ->
    key: 0
  handleSelect: (key) ->
    @setState {key}
  render: ->
    ### FIXME
    # Animation disabled
    # Relate to https://github.com/react-bootstrap/react-bootstrap/issues/287
    ###
    <TabbedArea activeKey={@state.key} onSelect={@handleSelect} animation={false}>
    {
      [
        components.map (component, index) ->
          <TabPane key={index} eventKey={index} tab={component.displayName} id={component.name} className='poi-app-tabpane'>
          {
            React.createElement(component.reactClass)
          }
          </TabPane>
        <DropdownButton key={components.length} eventKey={components.length} tab='插件' navItem={true}>
        {
          plugins.map (plugin, index) ->
            if plugin.handleClick
              <div key={components.length + 1 + index} tab={plugin.displayName} id={plugin.name} onClick={plugin.handleClick} />
            else
              <TabPane key={components.length + 1 + index} eventKey={components.length + 1 + index} tab={plugin.displayName} id={plugin.name} className='poi-app-tabpane'>
              {
                React.createElement(plugin.reactClass)
              }
              </TabPane>
        }
        </DropdownButton>
        <TabPane key={1000} eventKey={1000} tab={settings.displayName} id={settings.name} className='poi-app-tabpane'>
        {
          React.createElement(settings.reactClass)
        }
        </TabPane>
      ]
    }
    </TabbedArea>

PoiAlert = React.createClass
  getInitialState: ->
    message: 'poi 连接网络中'
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

{capturePageInMainWindow} = remote.require './lib/utils'
PoiControl = React.createClass
  getInitialState: ->
    muted: false
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
  handleSetMuted: ->
    muted = !@state.muted
    if $('kan-game webview').setAudioMuted?
      $('kan-game webview').setAudioMuted muted
    else
      error '当前版本不支持静音功能'
    @setState {muted}
  render: ->
    <div>
      <OverlayTrigger placement='left' overlay={<Tooltip>截屏</Tooltip>}>
        <Button onClick={@handleCapturePage} bsSize='small'><FontAwesome name="camera-retro" /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='left' overlay={<Tooltip>{if @state.muted then '取消静音' else '点我静音'}</Tooltip>}>
        <Button onClick={@handleSetMuted} bsSize='small'><FontAwesome name={if @state.muted then 'bell-slash-o' else 'bell-o'} /></Button>
      </OverlayTrigger>
    </div>

ModalTrigger = React.createClass
  mixins: [OverlayMixin]
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
    footer.map (button) ->
      <Button onClick={
        (e) ->
          self.handleToggle()
          button.func()
      } bsStyle={button.style}>{button.name}</Button>
  render: ->
    <span />
  renderOverlay: ->
    if !@state.isModalOpen
      <span />
    else
      <Modal title={@state.title} onRequestHide={@handleToggle}>
        <div className='modal-body'>
          {@state.content}
        </div>
        <div className='modal-footer'>
          <Button onClick={@handleToggle}>关闭</Button>
          {@renderFooter @state.footer}
        </div>
      </Modal>

React.render <PoiAlert id="poi-alert" />, $('poi-alert')
React.render <PoiControl />, $('poi-control')
React.render <ModalTrigger />, $('poi-modal-trigger')
React.render <ControlledTabArea />, $('poi-nav-tabs')

dontShowAgain = ->
  config.set('poi.first', POI_VERSION)
if config.get('poi.first', '0.0.0') != POI_VERSION
  title = 'README'
  content =
    <div>
      <p>诶嘿！欢迎使用 poi v{POI_VERSION}！使用之前看看下面！</p>
      <p style={color: 'red'}>poi 不能在含有中文或者全角字符的文件目录下正常运行！</p>
      <p style={color: 'red'}>poi 不会修改任何游戏内的发包与收包，但是请使用可信的 poi 版本和可信的插件！</p>
      <p>poi 支持岛风go缓存包，将岛风go缓存包中的cache文件夹放在poi目录下即可，.hack.swf 魔改文件也是支持的。</p>
      <p>poi 默认使用一个公共Shadowsocks代理连接，仅供测试使用。更改代理的设置在设置面板中可以找到。
      <ul>
        <li>使用岛风go的选择HTTP代理，地址是127.0.0.1，端口8099。（默认情况下）</li>
        <li>使用自己本地的Shadowsocks或者Socks5代理的选择Socks代理。</li>
        <li>使用Shadowsocks也可以用内置的Shadowsocks模块，不过性能不是很好。</li>
        <li>使用VPN的选择不使用代理就好了。</li>
      </ul></p>
      <p>poi 如果有显示错误，可以手动调整一下内容大小，布局会自动适配。</p>
      <p>如果 poi 的运行不流畅，可以在设置中关闭一部分插件，对插件的操作重启后生效。</p>
      <p>poi 交流群：378320628</p>
      <p>为 poi 贡献代码和编写插件 - GitHub: https://github.com/yudachi/poi </p>
    </div>
  footer = [
    name: '知道啦！'
    func: dontShowAgain
    style: 'success'
  ]
  window.toggleModal title, content, footer

confirmExit = false
exitPoi = ->
  confirmExit = true
  window.close()
window.onbeforeunload = (e) ->
  if confirmExit
    return true
  else
    toggleModal '关闭 poi', '确认退出？', [
      name: '确定退出'
      func: exitPoi
      style: 'warning'
    ]
    return false

window.addEventListener 'game.request', (e) ->
  {method, path} = e.detail
  log "正在请求 #{method} #{path}"
window.addEventListener 'game.response', (e) ->
  {method, path, body, postBody} = e.detail
  console.log [path, body, postBody] if process.env.DEBUG?
  success "获得数据 #{method} #{path}"
window.addEventListener 'network.error.retry', (e) ->
  {counter} = e.detail
  error "网络连接错误，正在进行第#{counter}次重试"
window.addEventListener 'network.invalid.code', (e) ->
  {code} = e.detail
  error "服务器返回非正常的 HTTP 状态码，HTTP #{code}"
