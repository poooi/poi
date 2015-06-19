glob = require 'glob'
path = require 'path-extra'
{ROOT, _, $, $$, React, ReactBootstrap} = window
{Grid, Col, Input, TabbedArea, TabPane, Alert} = ReactBootstrap
{PoiConfig, NetworkConfig, PluginConfig, Others} = require './parts'
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
  displayName: '设置'
  description: '功能设置界面'
  reactClass: React.createClass
    render: ->
      <TabbedArea bsStyle="pills" defaultActiveKey={0}>
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'settings.css')} />
        <TabPane key={0} eventKey={0} tab="基本设置" id='poi-config' className='poi-settings-tabpane'>
          <PoiConfig />
        </TabPane>
        <TabPane key={1} eventKey={1} tab="网络代理" id='proxy-config' className='poi-settings-tabpane'>
          <NetworkConfig />
        </TabPane>
        <TabPane key={2} eventKey={2} tab="扩展程序" id='plugin-config' className='poi-settings-tabpane'>
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
        <TabPane key={-1} eventKey={-1} tab="关于 poi" id='others' className='poi-settings-tabpane'>
          <Others />
        </TabPane>
      </TabbedArea>
