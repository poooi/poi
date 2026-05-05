import type { Plugin } from 'views/services/plugin-manager'

import { Card } from '@blueprintjs/core'
import React from 'react'
import { useTranslation } from 'react-i18next'

import PluginDropdownMenuItem from './plugin-dropdown-menu-item'
import { PluginAppTabpane, PluginDropdownMenu, PluginNonIdealState } from './styles'

interface PluginDropdownContentProps {
  plugins: Plugin[]
  useGridMenu: boolean
  activeMainTab: string
  isWindowMode: (plugin: Plugin) => boolean
  onOpenWindow: (plugin: Plugin) => void
  onSelectTab: (id: string) => void
  handlePluginPin: (plugin: Plugin) => void
}

export const PluginDropdownContent = ({
  plugins,
  useGridMenu,
  activeMainTab,
  isWindowMode,
  onOpenWindow,
  onSelectTab,
  handlePluginPin,
}: PluginDropdownContentProps): React.ReactElement => {
  const { t } = useTranslation(['setting'])

  return (
    <PluginDropdownMenu className="plugin-dropdown" large={!useGridMenu} grid={useGridMenu}>
      {plugins.length === 0 ? (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error Blueprint v5 NonIdealState children type issue with styled-components
        <PluginNonIdealState
          icon="cloud-download"
          title={t('setting:No plugin found')}
          description={t('setting:Install plugins in settings')}
        />
      ) : (
        plugins.map((plugin) => {
          const handleClick = plugin.handleClick
            ? plugin.handleClick
            : isWindowMode(plugin)
              ? () => onOpenWindow(plugin)
              : () => onSelectTab(plugin.id)
          return (
            <PluginDropdownMenuItem
              onClick={handleClick}
              id={activeMainTab === plugin.id ? '' : plugin.id}
              plugin={plugin}
              key={plugin.id}
              grid={useGridMenu}
              handlePluginPin={handlePluginPin}
            />
          )
        })
      )}
    </PluginDropdownMenu>
  )
}

export const NoPluginPlaceholder = (): React.ReactElement => {
  const { t } = useTranslation(['setting'])
  return (
    <PluginAppTabpane key="no-plugin" id="no-plugin">
      <Card>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-expect-error Blueprint v5 NonIdealState children type issue with styled-components */}
        <PluginNonIdealState
          icon="cloud-download"
          title={t('setting:No plugin found')}
          description={t('setting:Install plugins in settings')}
        />
      </Card>
    </PluginAppTabpane>
  )
}
