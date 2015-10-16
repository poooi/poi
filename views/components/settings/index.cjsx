glob = require 'glob'
path = require 'path-extra'
i18n = require 'i18n'
{ROOT, _, $, $$, React, ReactBootstrap} = window
{Grid, Col, Input, Tabs, Tab, Alert} = ReactBootstrap
{PoiConfig, DisplayConfig, NetworkConfig, PluginConfig, Others} = require './parts'
{__, __n} = i18n

# Discover plugins and remove unused plugins or no setting ui plugins
plugins = glob.sync(path.join(ROOT, 'plugins', '*'))
plugins = plugins.filter (filePath) ->
  plugin = require filePath
  enabled = config.get "plugin.#{plugin.name}.enable", true
  enabled && plugin.settingsClass? && false
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
      <Tabs bsStyle="pills" defaultActiveKey={0} animation={false}>
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'settings.css')} />
        <Tab key={0} eventKey={0} title={__ "Common"} id='poi-config' className='poi-settings-Tab'>
          <PoiConfig />
        </Tab>
        <Tab key={1} eventKey={1} title={__ "Display"} id='display-config' className='poi-settings-Tab'>
          <DisplayConfig />
        </Tab>
        <Tab key={2} eventKey={2} title={__ "Proxy"} id='proxy-config' className='poi-settings-Tab'>
          <NetworkConfig />
        </Tab>
        <Tab key={3} eventKey={3} title={__ "Plugins"} id='plugin-config' className='poi-settings-Tab'>
          <PluginConfig />
        </Tab>
        {
          plugins.map (plugin, index) ->
            <Tab key={index + 4}  eventKey={index + 4} title={plugin.displayName} id={plugin.name} className='poi-settings-Tab'>
            {
              React.createElement(plugin.settingsClass)
            }
            </Tab>
        }
        <Tab key={-1} eventKey={-1} title={__ "About"} id='others' className='poi-settings-Tab'>
          <Others />
        </Tab>
      </Tabs>
