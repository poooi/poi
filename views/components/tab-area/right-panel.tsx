import type { Plugin } from 'views/services/plugin-manager'

import { PopoverNext } from '@blueprintjs/core'
import React from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'

import type { TabContentsUnionHandle } from './tab-contents-union'

import { PluginDropdownContent, NoPluginPlaceholder } from './plugin-dropdown-content'
import { PluginWrap } from './plugin-wrapper'
import {
  PluginAppTabpane,
  PluginDropdownButton,
  PluginNameContainer,
  PoiTabContainer,
} from './styles'
import { TabContentsUnion } from './tab-contents-union'

interface RightPanelProps {
  activePluginName: string
  activePlugin: Partial<Plugin>
  tabbedPlugins: Plugin[]
  listedPlugins: Plugin[]
  useGridMenu: boolean
  activeMainTab: string
  isWindowMode: (plugin: Plugin) => boolean
  onOpenWindow: (plugin: Plugin) => void
  onSelectTab: (key: string) => void
  handlePluginPin: (plugin: Plugin) => void
  tabKeyUnionRef: React.RefObject<TabContentsUnionHandle>
  triggerRef: React.RefObject<HTMLButtonElement>
}

export const RightPanel = ({
  activePluginName,
  activePlugin,
  tabbedPlugins,
  listedPlugins,
  useGridMenu,
  activeMainTab,
  isWindowMode,
  onOpenWindow,
  onSelectTab,
  handlePluginPin,
  tabKeyUnionRef,
  triggerRef,
}: RightPanelProps): React.ReactElement => {
  const { t } = useTranslation(['others'])
  const defaultPluginIcon = <FontAwesome name="sitemap" />
  const defaultPluginTitle = t('others:Plugins')

  const pluginDropdownContent = (
    <PluginDropdownContent
      plugins={listedPlugins}
      useGridMenu={useGridMenu}
      activeMainTab={activeMainTab}
      isWindowMode={isWindowMode}
      onOpenWindow={onOpenWindow}
      onSelectTab={onSelectTab}
      handlePluginPin={handlePluginPin}
    />
  )

  const pluginContents = tabbedPlugins.map((plugin) => (
    <PluginWrap key={plugin.id} plugin={plugin} container={PluginAppTabpane} />
  ))

  return (
    <PoiTabContainer className="poi-tab-container">
      <PopoverNext
        animation="minimal"
        arrow={false}
        hasBackdrop={false}
        popoverClassName="plugin-dropdown-container"
        placement="bottom"
        content={pluginDropdownContent}
        className="nav-tab"
      >
        <PluginDropdownButton
          ref={triggerRef}
          variant="minimal"
          size="large"
          double
          endIcon="chevron-down"
          text={
            <PluginNameContainer>
              {activePlugin.displayIcon || defaultPluginIcon}
              {activePlugin.name || defaultPluginTitle}
            </PluginNameContainer>
          }
        />
      </PopoverNext>
      <TabContentsUnion
        ref={tabKeyUnionRef}
        activeTab={pluginContents.length ? activePluginName : 'no-plugin'}
      >
        {pluginContents.length ? pluginContents : <NoPluginPlaceholder key="no-plugin" />}
      </TabContentsUnion>
    </PoiTabContainer>
  )
}
