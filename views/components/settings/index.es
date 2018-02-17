import React from 'react'
import { Tabs, Tab } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { Trans } from 'react-i18next'

import MainConfig from './main'
import DisplayConfig from './display'
import NetworkConfig from './network'
import PluginConfig from './plugin'
import Misc from './misc'

import './assets/settings.css'

export default {
  name: 'SettingsView',
  displayName: <span><FontAwesome name='cog' /> <Trans>setting: Settings</Trans></span>,
  reactClass: class reactClass extends React.Component {
    shouldComponentUpdate = (nextProps, nextState) => (false)
    render() {
      return (
        <Tabs bsStyle="pills" defaultActiveKey={0} animation={false} justified id="settings-view-tabs">
          <Tab eventKey={0} title={<Trans>setting:Common</Trans>} className='poi-settings-Tab'>
            <MainConfig />
          </Tab>
          <Tab eventKey={1} title={<Trans>setting:Display</Trans>} className='poi-settings-Tab'>
            <DisplayConfig />
          </Tab>
          <Tab eventKey={2} title={<Trans>setting:Proxy</Trans>} className='poi-settings-Tab'>
            <NetworkConfig />
          </Tab>
          <Tab eventKey={3} title={<Trans>setting:Plugins</Trans>} className='poi-settings-Tab'>
            <PluginConfig />
          </Tab>
          <Tab eventKey={-1} title={<Trans>setting:About</Trans>} className='poi-settings-Tab'>
            <Misc />
          </Tab>
        </Tabs>
      )
    }
  },
}
