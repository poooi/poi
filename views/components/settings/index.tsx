import { Tabs, Tab, Tooltip, Position } from '@blueprintjs/core'
import { map } from 'lodash'
import React, { useState } from 'react'
import FontAwesome from 'react-fontawesome'
import { Trans, useTranslation } from 'react-i18next'
import { styled } from 'styled-components'

import { About } from './about'
import { DisplayConfig } from './display'
import { GamingConfig } from './gaming'
import { PoiConfig } from './main'
import { NetworkConfig } from './network'
import { PluginConfig } from './plugin'

const TABS = [
  { id: 0, title: 'Common', component: PoiConfig, icon: 'wrench' },
  { id: 4, title: 'Gaming', component: GamingConfig, icon: 'gamepad' },
  { id: 1, title: 'Display', component: DisplayConfig, icon: 'television' },
  { id: 2, title: 'Network', component: NetworkConfig, icon: 'link' },
  { id: 3, title: 'Plugins', component: PluginConfig, icon: 'puzzle-piece' },
  { id: -1, title: 'About', component: About, icon: 'question-circle' },
]

const SettingsTabs = styled(Tabs as React.ComponentType<React.ComponentProps<typeof Tabs>>)`
  height: 100%;

  .bp6-tab-list {
    justify-content: space-between;
  }

  .bp6-tab {
    flex: 1 0 30px;
    text-align: center;
    justify-content: center;
    display: flex;
    gap: 8px;

    &[aria-selected='true'] {
      flex: 4 0 120px;
    }
  }

  .bp6-tab-panel {
    margin: 0;
    height: calc(100% - 30px);
    overflow-y: scroll;
    padding: 1px 2px;
  }
`

const SettingsComponent = () => {
  const { t } = useTranslation(['setting'])
  const [activeTab, setActiveTab] = useState(0)

  return (
    <SettingsTabs
      selectedTabId={activeTab}
      id="settings-view-tabs"
      className="settings-view-tabs"
      onChange={(id) => setActiveTab(Number(id))}
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

export const reactClass = SettingsComponent

export const displayName = <Trans>setting:Settings</Trans>

export const icon = <FontAwesome name="cog" />

export const name = 'settings-view'
