path = require 'path-extra'
glob = require 'glob'
{ROOT, _, $, $$, React, ReactBootstrap} = window
{Button, TabbedArea, TabPane, Alert, OverlayMixin, Modal, DropdownButton} = ReactBootstrap
{config, proxy, log} = window

# Get components
components = glob.sync(path.join(ROOT, 'views', 'components', '*'))
# Discover plugins and remove unused plugins
plugins = glob.sync(path.join(ROOT, 'plugins', '*'))
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
    message: 'poi 正常运行中'
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

React.render <PoiAlert />, $('poi-alert')
React.render <ModalTrigger />, $('poi-modal-trigger')
React.render <ControlledTabArea />, $('poi-nav-tabs')

dontShowAgain = ->
  config.set('poi.first', POI_VERSION)
if config.get('poi.first', '0.0.0') != POI_VERSION
  title = 'README'
  content =
    <div>
      <p>诶嘿！欢迎使用 poi v{POI_VERSION}！poi 准备在 6 月 12 日发布正式版！在使用之前看看下面的东西吧！</p>
      <p>poi 支持岛风go缓存包，将岛风go缓存包中的cache文件夹放在poi目录下即可，.hack.swf 魔改文件也是支持的。</p>
      <p>poi 默认使用一个公共Shadowsocks代理连接，但是性能不是很好，并且不会长期维护，仅供测试使用。更改代理的设置在设置面板中可以找到。
      <ul>
        <li>使用岛风go的选择HTTP代理，地址是127.0.0.1，端口8099。（默认情况下）</li>
        <li>使用自己本地的Shadowsocks或者Socks5代理的选择Socks代理。</li>
        <li>使用Shadowsocks也可以用内置的Shadowsocks模块，不过性能不是很好。</li>
        <li>使用VPN的选择不使用代理就好了。</li>
      </ul></p>
      <p>poi 有的时候会出现flash无法正常缩放的情况，多拖拖窗口，或者过一会儿拖拖窗口。</p>
      <p>poi 对小分辨率不是特别友好……</p>
      <p>BUG 汇报 和 改进建议 - GitHub: https://github.com/yudachi/poi/issues </p>
    </div>
  footer = [
    name: '知道啦！'
    func: dontShowAgain
    style: 'success'
  ]
  window.toggleModal title, content, footer

window.addEventListener 'game.request', (e) ->
  {method, path} = e.detail
  log "正在请求 #{method} #{path}"
window.addEventListener 'game.response', (e) ->
  {method, path, body, postBody} = e.detail
  console.log [path, body, postBody] if process.env.DEBUG?
  success "获得数据 #{method} #{path}"
