import path from 'path-extra'
import React from 'react'
import { Tabs, Tab } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { PoiConfig, DisplayConfig, NetworkConfig, PluginConfig, Others } from './parts'

const {i18n} = window
const __ = i18n.setting.__.bind(i18n.setting)

export default {
  name: 'SettingsView',
  priority: 10001,
  displayName: <span><FontAwesome key={0} name='cog' />{__(" Settings")}</span>,
  description: '功能设置界面',
  reactClass: class reactClass extends React.Component {
    shouldComponentUpdate = (nextProps, nextState) => (false)
    render() {
      return (
        <Tabs bsStyle="pills" defaultActiveKey={0} animation={false} justified>
          <link rel="stylesheet" href={path.join(__dirname, 'assets', 'settings.css')} />
          <Tab key={0} eventKey={0} title={__("Common")} id='poi-config' className='poi-settings-Tab'>
            <PoiConfig />
          </Tab>
          <Tab key={1} eventKey={1} title={__("Display")} id='display-config' className='poi-settings-Tab'>
            <DisplayConfig />
          </Tab>
          <Tab key={2} eventKey={2} title={__("Proxy")} id='proxy-config' className='poi-settings-Tab'>
            <NetworkConfig />
          </Tab>
          <Tab key={3} eventKey={3} title={__("Plugins")} id='plugin-config' className='poi-settings-Tab'>
            <PluginConfig />
          </Tab>
          <Tab key={-1} eventKey={-1} title={__("About")} id='others' className='poi-settings-Tab'>
            <Others />
          </Tab>
        </Tabs>
      )
    }
  },
}
