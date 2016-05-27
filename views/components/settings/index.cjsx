glob = require 'glob'
path = require 'path-extra'
{ROOT, _, $, $$, React, ReactBootstrap} = window
{Grid, Col, Tabs, Tab, Alert, Nav, NavItem} = ReactBootstrap
{PoiConfig, DisplayConfig, NetworkConfig, PluginConfig, Others} = require './parts'
classnames = require 'classnames'
__ = i18n.setting.__.bind(i18n.setting)
__n = i18n.setting.__n.bind(i18n.setting)

module.exports =
  name: 'SettingsView'
  priority: 10001
  displayName: <span><FontAwesome name='cog' />{__ " Settings"}</span>
  description: '功能设置界面'
  reactClass: React.createClass
    getInitialState: ->
      key: 0
      enableTransition: config.get 'poi.transition.enable', true
    handleSelect: (key) ->
      @setState
        key: key
    handleSetTransition: (e) ->
      @setState
        enableTransition: config.get 'poi.transition.enable', true
    componentDidMount: ->
      window.addEventListener 'display.transition.change', @handleSetTransition
    componentWillUnmount: ->
      window.removeEventListener 'display.transition.change', @handleSetTransition
    render: ->
      <div id="settings-view-tabs">
        <link rel="stylesheet" href={path.join(path.relative(ROOT, __dirname), 'assets', 'settings.css')} />
        <Nav bsStyle="pills" activeKey={@state.key} justified onSelect={@handleSelect} >
          <NavItem eventKey={0} className='poi-settings-Tab'>
            {__ "Common"}
          </NavItem>
          <NavItem eventKey={1} className='poi-settings-Tab'>
            {__ "Display"}
          </NavItem>
          <NavItem eventKey={2} className='poi-settings-Tab'>
            {__ "Proxy"}
          </NavItem>
          <NavItem eventKey={3} className='poi-settings-Tab'>
            {__ "Plugins"}
          </NavItem>
          <NavItem eventKey={4} className='poi-settings-Tab'>
            {__ "About"}
          </NavItem>
        </Nav>
        <div className="no-scroll">
          <div className={classnames "setting-tab",
            'hidden': @state.key != 0
          }>
            <PoiConfig />
          </div>
          <div className={classnames "setting-tab",
            'hidden': @state.key != 1
          }>
            <DisplayConfig />
          </div>
          <div className={classnames "setting-tab",
            'hidden': @state.key != 2
          }>
            <NetworkConfig />
          </div>
          <div className={classnames "setting-tab",
            'hidden': @state.key != 3
          }>
            <PluginConfig />
          </div>
          <div className={classnames "setting-tab",
            'hidden': @state.key != 4
          }>
            <Others />
          </div>
        </div>
      </div>
