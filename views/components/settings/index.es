import React from 'react'
// import { Tabs, Tab } from 'react-bootstrap'
import { Tabs, Tab } from '@blueprintjs/core'
import FontAwesome from 'react-fontawesome'
import { Trans, translate } from 'react-i18next'
import { isEqual } from 'lodash'

import { PoiConfig } from './main'
import { DisplayConfig } from './display'
import { NetworkConfig } from './network'
import { PluginConfig } from './plugin'
import { Misc } from './misc'

import './assets/settings.css'

@translate(['setting'])
export class reactClass extends React.Component {
  shouldComponentUpdate = (nextProps, nextState) => !isEqual(nextProps, this.props)
  render() {
    const { t } = this.props
    return (
      <Tabs defaultSelectedTabId={0} animate={false} id="settings-view-tabs" className="settings-view-tabs">
        <Tab id={0} key={0} title={t('setting:Common')} className="poi-settings-Tab" panel={<PoiConfig />}/>
        <Tab id={1} key={1} title={t('setting:Display')} className="poi-settings-Tab" panel={<DisplayConfig />}/>
        <Tab id={2} key={2} title={t('setting:Proxy')} className="poi-settings-Tab" panel={<NetworkConfig />}/>
        <Tab id={3} key={3} title={t('setting:Plugins')} className="poi-settings-Tab" panel={<PluginConfig />}/>
        <Tab id={-1} key={-1} title={t('setting:About')} className="poi-settings-Tab" panel={<Misc />}/>
      </Tabs>
    )
  }
}

export const displayName = <span><FontAwesome name="cog" /> <Trans>setting:Settings</Trans></span>
