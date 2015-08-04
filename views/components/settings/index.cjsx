glob = require 'glob'
path = require 'path-extra'
i18n = require 'i18n'
{ROOT, _, $, $$, React, ReactBootstrap} = window
{Grid, Col, Input, TabbedArea, TabPane, Alert} = ReactBootstrap
{PoiConfig, NetworkConfig, PluginConfig, Others} = require './parts'
{__, __n} = i18n

# Discover plugins and remove unused plugins or no setting ui plugins
plugins = glob.sync(path.join(ROOT, 'plugins', '*'))
plugins = plugins.filter (filePath) ->
  plugin = require filePath
  enabled = config.get "plugin.#{plugin.name}.enable", true
  enabled && settingsClass?
plugins = plugins.map (filePath) ->
  plugin = require filePath
  plugin.priority = 10000 unless plugin.priority?
  plugin
plugins = _.sortBy(plugins, 'priority')
module.exports =
  name: 'SettingsView'
  priority: 10001
  displayName: <span><FontAwesome key={0} name='cog' />{__ " Settings"}</span>
  description: '功能设置界面'
  reactClass: React.createClass
    shouldComponentUpdate: (nextProps, nextState)->
      false
    render: ->
      <TabbedArea bsStyle="pills" defaultActiveKey={0} animation={true}>
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'settings.css')} />
        <TabPane key={0} eventKey={0} tab={__ "Common"} id='poi-config' className='poi-settings-tabpane'>
          <PoiConfig />
        </TabPane>
        <TabPane key={1} eventKey={1} tab={__ "Proxy"} id='proxy-config' className='poi-settings-tabpane'>
          <NetworkConfig />
        </TabPane>
        <TabPane key={2} eventKey={2} tab={__ "Plugins"} id='plugin-config' className='poi-settings-tabpane'>
          <PluginConfig />
        </TabPane>
        {
          plugins.map (plugin, index) ->
            <TabPane key={index + 3}  eventKey={index + 3} tab={plugin.displayName} id={plugin.name} className='poi-settings-tabpane'>
            {
              React.createElement(plugin.settingsClass)
            }
            </TabPane>
        }
        <TabPane key={-1} eventKey={-1} tab={__ "About"} id='others' className='poi-settings-tabpane'>
          <Others />
        </TabPane>
      </TabbedArea>
