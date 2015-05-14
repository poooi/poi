path = require 'path-extra'
glob = require 'glob'
{ROOT, remote, _, $, $$, React, ReactBootstrap} = window
{Button, TabbedArea, TabPane, Alert} = ReactBootstrap
{config, proxy, log} = window

# Get components
components = glob.sync(path.join(ROOT, 'views', 'components', '*'))
# Discover plugins and remove unused plugins
plugins = glob.sync(path.join(ROOT, 'plugins', '*'))
plugins = plugins.filter (filePath) ->
  plugin = require filePath
  config.get "plugin.#{plugin.name}.enable", true

components = components.concat plugins
components = components.map (filePath) ->
  component = require path.join(filePath, 'index')
  window[component.name] = component.reactClass
  component.priority = 10000 unless component.priority?
  component
components = _.sortBy(components, 'priority')

ControlledTabArea = React.createClass
  getInitialState: ->
    key: 0
  handleSelect: (key) ->
    @setState {key}
  render: ->
    <TabbedArea activeKey={@state.key} onSelect={@handleSelect}>
      {
        components.map (component, index) ->
          <TabPane key={index} eventKey={index} tab={component.displayName}>
            {React.createElement(window[component.name])}
          </TabPane>
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

React.render <PoiAlert />, $('poi-alert')
React.render <ControlledTabArea />, $('poi-nav-tabs')

proxy.addListener 'game.request', (method, path) ->
  log "正在请求 #{method} #{path}"
proxy.addListener 'game.response', (method, path, body, postBody) ->
  console.log [path, body, postBody]
  success "获得数据 #{method} #{path}"
