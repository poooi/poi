import React from 'react'
import { Tabs, Tab, Tooltip, Position } from '@blueprintjs/core'
import FontAwesome from 'react-fontawesome'
import { Trans, withNamespaces } from 'react-i18next'
import { isEqual, map } from 'lodash'
import { styled } from 'styled-components'

import { PoiConfig } from './main'
import { GamingConfig } from './gaming'
import { DisplayConfig } from './display'
import { NetworkConfig } from './network'
import { PluginConfig } from './plugin'
import { About } from './about'

const TABS = [
  {
    id: 0,
    title: 'Common',
    component: PoiConfig,
    icon: 'wrench',
  },
  {
    id: 4,
    title: 'Gaming',
    component: GamingConfig,
    icon: 'gamepad',
  },
  {
    id: 1,
    title: 'Display',
    component: DisplayConfig,
    icon: 'television',
  },
  {
    id: 2,
    title: 'Network',
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
    component: About,
    icon: 'question-circle',
  },
]

const SettingsTabs = styled(Tabs)`
  height: 100%;

  .bp5-tab-list {
    justify-content: space-between;
  }

  .bp5-tab {
    flex: 1 0 30px;
    text-align: center;
    justify-content: center;
    display: flex;
    gap: 8px;

    &[aria-selected='true'] {
      flex: 4 0 120px;
    }
  }

  .bp5-tab-panel {
    margin: 0;
    height: calc(100% - 30px);
    overflow-y: scroll;
    padding: 1px 2px;
  }
`

@withNamespaces(['setting'])
export class reactClass extends React.Component {
  state = {
    activeTab: 0,
  }

  shouldComponentUpdate = (nextProps, nextState) =>
    !isEqual(nextProps, this.props) || nextState.activeTab !== this.state.activeTab

  handleTabChange = (id) => {
    this.setState({ activeTab: id })
  }

  render() {
    const { t } = this.props
    const { activeTab } = this.state
    return (
      <SettingsTabs
        selectedTabId={activeTab}
        id="settings-view-tabs"
        className="settings-view-tabs"
        onChange={this.handleTabChange}
      >
        {map(TABS, (tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            icon={
              <Tooltip
                disabled={tab.id === activeTab}
                position={Position.BOTTOM}
                content={t(tab.title)}
                hoverOpenDelay={200}
              >
                <FontAwesome name={tab.icon} />
              </Tooltip>
            }
            title={tab.id === activeTab ? t(tab.title) : ''}
            className="poi-settings-tab"
            panel={<tab.component />}
          />
        ))}
      </SettingsTabs>
    )
  }
}

export const displayName = <Trans>setting:Settings</Trans>

export const icon = <FontAwesome name="cog" />
