import React from 'react'
import { Tabs, Tab } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'

import MainConfig from './main'
import DisplayConfig from './display'
import NetworkConfig from './network'
import PluginConfig from './plugin'
import Misc from './misc'

import './assets/settings.css'

const {i18n} = window
const __ = i18n.setting.__.bind(i18n.setting)

export default {
  name: 'SettingsView',
  displayName: <span><FontAwesome name='cog' />{__(" Settings")}</span>,
  reactClass: class reactClass extends React.Component {
    shouldComponentUpdate = (nextProps, nextState) => (false)
    render() {
      return (
        <Tabs bsStyle="pills" defaultActiveKey={0} animation={false} justified id="settings-view-tabs">
          <Tab eventKey={0} title={__("Common")} className='poi-settings-Tab'>
            <MainConfig />
          </Tab>
          <Tab eventKey={1} title={__("Display")} className='poi-settings-Tab'>
            <DisplayConfig />
          </Tab>
          <Tab eventKey={2} title={__("Proxy")} className='poi-settings-Tab'>
            <NetworkConfig />
          </Tab>
          <Tab eventKey={3} title={__("Plugins")} className='poi-settings-Tab'>
            <PluginConfig />
          </Tab>
          <Tab eventKey={-1} title={__("About")} className='poi-settings-Tab'>
            <Misc />
          </Tab>
        </Tabs>
      )
    }
  },
}
