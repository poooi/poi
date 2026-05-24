import type { Plugin } from 'views/services/plugin-manager'

import React, { useEffect, useState } from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'

import type { TabContentsUnionHandle } from './tab-contents-union'

import { PluginDrawer } from './plugin-drawer'
import { NoPluginPlaceholder } from './plugin-dropdown-content'
import { PluginWrap } from './plugin-wrapper'
import {
  PluginAppTabpane,
  PluginContentArea,
  PluginContentWrapper,
  PluginDropdownButton,
  PluginNameContainer,
  PoiTabContainer,
} from './styles'
import { TabContentsUnion } from './tab-contents-union'

type DrawerState = 'closed' | 'open' | 'closing'

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
  useGridMenu: _useGridMenu,
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

  const [drawerState, setDrawerState] = useState<DrawerState>('closed')

  // Fallback: if animationend never fires, force-close after the animation duration
  useEffect(() => {
    if (drawerState !== 'closing') return
    const timer = setTimeout(() => setDrawerState('closed'), 200)
    return () => clearTimeout(timer)
  }, [drawerState])

  const toggleDrawer = () => {
    if (drawerState === 'closed') setDrawerState('open')
    else if (drawerState === 'open') setDrawerState('closing')
  }

  const handleDrawerSelect = (plugin: Plugin) => {
    setDrawerState('closing')
    onSelectTab(plugin.id)
  }

  const pluginContents = tabbedPlugins.map((plugin) => (
    <PluginWrap key={plugin.id} plugin={plugin} container={PluginAppTabpane} />
  ))

  return (
    <PoiTabContainer className="poi-tab-container">
      <PluginDropdownButton
        ref={triggerRef}
        variant="minimal"
        size="large"
        double
        endIcon={drawerState === 'open' ? 'cross' : 'chevron-down'}
        active={drawerState === 'open'}
        onClick={toggleDrawer}
        text={
          <PluginNameContainer>
            {activePlugin.displayIcon || defaultPluginIcon}
            {activePlugin.name || defaultPluginTitle}
          </PluginNameContainer>
        }
      />
      <PluginContentArea>
        {/* PluginContentWrapper is always rendered so TabContentsUnion ref never detaches */}
        <PluginContentWrapper $dimmed={drawerState === 'open'}>
          <TabContentsUnion
            ref={tabKeyUnionRef}
            activeTab={pluginContents.length ? activePluginName : 'no-plugin'}
          >
            {pluginContents.length ? pluginContents : <NoPluginPlaceholder key="no-plugin" />}
          </TabContentsUnion>
        </PluginContentWrapper>
        {drawerState !== 'closed' && (
          <PluginDrawer
            plugins={listedPlugins}
            activeMainTab={activeMainTab}
            isWindowMode={isWindowMode}
            onOpenWindow={onOpenWindow}
            onSelectTab={onSelectTab}
            handlePluginPin={handlePluginPin}
            onSelect={handleDrawerSelect}
            onClose={() => setDrawerState('closing')}
            closing={drawerState === 'closing'}
            onCloseAnimationEnd={() => setDrawerState('closed')}
          />
        )}
      </PluginContentArea>
    </PoiTabContainer>
  )
}
