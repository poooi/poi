import type { Tabs } from '@blueprintjs/core'
import type { Plugin } from 'views/services/plugin-manager'

import { Position, Tab } from '@blueprintjs/core'
import React from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { Popover } from 'views/components/etc/overlay'

import type { PluginWindowWrapHandle } from './plugin-window-wrapper'
import type { TabContentsUnionHandle } from './tab-contents-union'

import * as MAIN_VIEW from '../main'
import * as SETTINGS_VIEW from '../settings'
import * as SHIP_VIEW from '../ship'
import { PluginDropdownContent } from './plugin-dropdown-content'
import { PluginWindowWrap } from './plugin-window-wrapper'
import { PluginWrap } from './plugin-wrapper'
import {
  NavTabs,
  PluginAppTabpane,
  PluginDropdownButton,
  PoiAppTabpane,
  PoiTabContainer,
  ShipViewTabpanel,
} from './styles'
import { TabContentsUnion } from './tab-contents-union'

const pluginDropDownModifier = {
  flip: { enabled: false },
  preventOverflow: { boundariesElement: 'window', enabled: false },
  hide: { enabled: false },
  computeStyle: { gpuAcceleration: false },
}

const isPluginTab = (key: string): boolean => !['main-view', 'ship-view', 'settings'].includes(key)

interface LeftPanelProps {
  doubleTabbed: boolean
  activeMainTab: string
  activePluginName: string
  activePlugin: Partial<Plugin>
  tabbedPlugins: Plugin[]
  listedPlugins: Plugin[]
  useGridMenu: boolean
  isWindowMode: (plugin: Plugin) => boolean
  onSelectTab: (key: string) => void
  onOpenWindow: (plugin: Plugin) => void
  handlePluginPin: (plugin: Plugin) => void
  pinConfig: Record<string, unknown>
  openedWindow: Record<string, boolean>
  windowRefs: React.MutableRefObject<Record<string, PluginWindowWrapHandle | null>>
  onCloseWindow: (plugin: Plugin) => void
  getPinButton: (plugin: Plugin) => React.ReactElement
  tabsRef: React.RefObject<Tabs>
  tabKeyUnionRef: React.RefObject<TabContentsUnionHandle>
  mainTabKeyUnionRef: React.RefObject<TabContentsUnionHandle>
  triggerRef: React.RefObject<HTMLButtonElement>
}

export const LeftPanel = ({
  doubleTabbed,
  activeMainTab,
  activePluginName,
  activePlugin,
  tabbedPlugins,
  listedPlugins,
  useGridMenu,
  isWindowMode,
  onSelectTab,
  onOpenWindow,
  handlePluginPin,
  pinConfig,
  openedWindow,
  windowRefs,
  onCloseWindow,
  getPinButton,
  tabsRef,
  tabKeyUnionRef,
  mainTabKeyUnionRef,
  triggerRef,
}: LeftPanelProps): React.ReactElement => {
  const { t } = useTranslation(['others'])
  const defaultPluginIcon = <FontAwesome name="sitemap" />
  const defaultPluginTitle = t('others:Plugins')

  const handleSelectTab = (key: string) => {
    onSelectTab(key === 'plugin' ? activePluginName : key)
  }

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

  const windowModePluginContents = tabbedPlugins
    .filter((plugin) => isWindowMode(plugin) && openedWindow[plugin.id])
    .map((plugin) => (
      <PluginWindowWrap
        key={plugin.id}
        plugin={plugin}
        ref={(r) => {
          windowRefs.current[plugin.id] = r
        }}
        closeWindowPortal={() => onCloseWindow(plugin)}
        titleExtra={getPinButton(plugin)}
        pinned={!!pinConfig?.[plugin.id]}
      />
    ))

  const nav = (
    <NavTabs
      id="top-nav"
      large
      selectedTabId={isPluginTab(activeMainTab) ? 'plugin' : activeMainTab}
      className="top-nav"
      onChange={handleSelectTab}
      ref={tabsRef}
    >
      <Tab key="main-view" id="main-view" icon={MAIN_VIEW.icon}>
        {MAIN_VIEW.displayName}
      </Tab>
      <Tab key="ship-view" id="ship-view" icon={SHIP_VIEW.icon}>
        {SHIP_VIEW.displayName}
      </Tab>
      {doubleTabbed && (
        <Tab key="settings" id="settings" icon={SETTINGS_VIEW.icon}>
          {SETTINGS_VIEW.displayName}
        </Tab>
      )}
      {!doubleTabbed && (
        <Tab key="plugin" id="plugin" icon={activePlugin.displayIcon || defaultPluginIcon}>
          {activePlugin.name || defaultPluginTitle}
        </Tab>
      )}
      {!doubleTabbed && (
        <Popover
          minimal
          hasBackdrop
          position={Position.BOTTOM_RIGHT}
          content={pluginDropdownContent}
          popoverClassName="plugin-dropdown-container"
          modifiers={pluginDropDownModifier}
        >
          <PluginDropdownButton icon="chevron-down" minimal ref={triggerRef} />
        </Popover>
      )}
      {!doubleTabbed && (
        <Tab
          className="half-width"
          key="settings"
          id="settings"
          // @ts-expect-error width is a non-standard prop passed to Tab
          width={12.5}
          icon={<FontAwesome key={0} name="cog" />}
        />
      )}
    </NavTabs>
  )

  const content = (
    <TabContentsUnion
      ref={doubleTabbed ? mainTabKeyUnionRef : tabKeyUnionRef}
      activeTab={activeMainTab}
    >
      <PoiAppTabpane id={MAIN_VIEW.name} className="main-view poi-app-tabpane" key="main-view">
        <MAIN_VIEW.reactClass />
      </PoiAppTabpane>
      <ShipViewTabpanel id={SHIP_VIEW.name} className="ship-view poi-app-tabpane" key="ship-view">
        <SHIP_VIEW.reactClass />
      </ShipViewTabpanel>
      {!doubleTabbed && pluginContents}
      <PoiAppTabpane
        id={SETTINGS_VIEW.name}
        className="settings-view poi-app-tabpane"
        key="settings"
      >
        <SETTINGS_VIEW.reactClass />
      </PoiAppTabpane>
    </TabContentsUnion>
  )

  return (
    <PoiTabContainer className="poi-tab-container">
      {nav}
      {content}
      {windowModePluginContents}
    </PoiTabContainer>
  )
}
