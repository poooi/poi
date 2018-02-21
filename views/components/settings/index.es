import React from 'react'
import { Tabs, Tab } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { Trans, translate } from 'react-i18next'

import { PoiConfig } from './main'
import { DisplayConfig } from './display'
import { NetworkConfig } from './network'
import { PluginConfig } from './plugin'
import { Misc } from './misc'

import './assets/settings.css'

@translate(['setting'])
export class reactClass extends React.Component {
  shouldComponentUpdate = (nextProps, nextState) => (false)
  render() {
    const { t } = this.props
    return (
      <Tabs bsStyle="pills" defaultActiveKey={0} animation={false} justified id="settings-view-tabs">
        <Tab eventKey={0} title={t('setting:Common')} className='poi-settings-Tab'>
          <PoiConfig />
        </Tab>
        <Tab eventKey={1} title={t('setting:Display')} className='poi-settings-Tab'>
          <DisplayConfig />
        </Tab>
        <Tab eventKey={2} title={t('setting:Proxy')} className='poi-settings-Tab'>
          <NetworkConfig />
        </Tab>
        <Tab eventKey={3} title={t('setting:Plugins')} className='poi-settings-Tab'>
          <PluginConfig />
        </Tab>
        <Tab eventKey={-1} title={t('setting:About')} className='poi-settings-Tab'>
          <Misc />
        </Tab>
      </Tabs>
    )
  }
}

export const displayName = <span><FontAwesome name='cog' /> <Trans>setting:Settings</Trans></span>
