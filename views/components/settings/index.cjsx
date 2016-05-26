glob = require 'glob'
path = require 'path-extra'
{ROOT, _, $, $$, React, ReactBootstrap} = window
{Grid, Col, Tabs, Tab, Alert} = ReactBootstrap
{PoiConfig, DisplayConfig, NetworkConfig, PluginConfig, Others} = require './parts'
__ = i18n.setting.__.bind(i18n.setting)
__n = i18n.setting.__n.bind(i18n.setting)

module.exports =
  name: 'SettingsView'
  priority: 10001
  displayName: <span><FontAwesome name='cog' />{__ " Settings"}</span>
  description: '功能设置界面'
  reactClass: React.createClass
    shouldComponentUpdate: (nextProps, nextState)->
      false
    render: ->
      <Tabs bsStyle="pills" defaultActiveKey={0} animation={false} justified id="settings-view-tabs">
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'settings.css')} />
        <Tab eventKey={0} title={__ "Common"} className='poi-settings-Tab'>
          <PoiConfig />
        </Tab>
        <Tab eventKey={1} title={__ "Display"} className='poi-settings-Tab'>
          <DisplayConfig />
        </Tab>
        <Tab eventKey={2} title={__ "Proxy"} className='poi-settings-Tab'>
          <NetworkConfig />
        </Tab>
        <Tab eventKey={3} title={__ "Plugins"} className='poi-settings-Tab'>
          <PluginConfig />
        </Tab>
        <Tab eventKey={-1} title={__ "About"} className='poi-settings-Tab'>
          <Others />
        </Tab>
      </Tabs>
