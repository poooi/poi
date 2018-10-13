import React from 'react'
import { Tabs, Tab, Tooltip, Position } from '@blueprintjs/core'
import FontAwesome from 'react-fontawesome'
import { Trans, translate } from 'react-i18next'
import { isEqual, map } from 'lodash'

import { PoiConfig } from './main'
import { DisplayConfig } from './display'
import { NetworkConfig } from './network'
import { PluginConfig } from './plugin'
import { Misc } from './misc'

import './assets/settings.css'

const TABS = [
  {
    id: 0,
    title: 'Common',
    component: PoiConfig,
    icon: 'wrench',
  },
  {
    id: 1,
    title: 'Display',
    component: DisplayConfig,
    icon: 'television',
  },
  {
    id: 2,
    title: 'Proxy',
    component: NetworkConfig,
    icon: 'link',
  },
  {
    id: 3,
    title: 'Plugins',
    component: PluginConfig,
    icon: 'puzzle-piece',
  },
  {
    id: -1,
    title: 'About',
    component: Misc,
    icon: 'question-circle',
  },
]

@translate(['setting'])
export class reactClass extends React.Component {
  state = {
    activeTab: 0,
  }

  shouldComponentUpdate = (nextProps, nextState) =>
    !isEqual(nextProps, this.props) || nextState.activeTab !== this.state.activeTab

  handleTabChange = id => {
    this.setState({ activeTab: id })
  }

  render() {
    const { t } = this.props
    const { activeTab } = this.state
    return (
      <Tabs
        selectedTabId={activeTab}
        id="settings-view-tabs"
        className="settings-view-tabs"
        onChange={this.handleTabChange}
      >
        {map(TABS, tab => (
          <Tab
            key={tab.id}
            id={tab.id}
            title={
              tab.id === activeTab ? (
                <>
                  <FontAwesome name={tab.icon} /> {t(tab.title)}
                </>
              ) : (
                <Tooltip
                  position={Position.BOTTOM}
                  content={t(tab.title)}
                  hoverOpenDelay={500}
                >
                  <FontAwesome name={tab.icon} />
                </Tooltip>
              )
            }
            className="poi-settings-tab"
            panel={<tab.component />}
          />
        ))}
      </Tabs>
    )
  }
}

export const displayName = (
  <span>
    <FontAwesome name="cog" /> <Trans>setting:Settings</Trans>
  </span>
)
