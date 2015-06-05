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
    @setState
      isModalOpen: false
  handleModal: (e) ->
    @setState
      isModalOpen: true
      title: e.detail.title
      content: e.detail.content
  componentDidMount: ->
    window.addEventListener 'poi.modal', @handleModal
  componentWillUnmount: ->
    window.removeEventListener 'poi.modal', @handleModal
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
        </div>
      </Modal>

React.render <PoiAlert />, $('poi-alert')
React.render <ModalTrigger />, $('poi-modal-trigger')
React.render <ControlledTabArea />, $('poi-nav-tabs')

window.addEventListener 'game.request', (e) ->
  {method, path} = e.detail
  log "正在请求 #{method} #{path}"
window.addEventListener 'game.response', (e) ->
  {method, path, body, postBody} = e.detail
  console.log [path, body, postBody] if process.env.DEBUG?
  success "获得数据 #{method} #{path}"
