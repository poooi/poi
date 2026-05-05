import type { ConfigStringPath, ConfigValue } from 'lib/config'
import type { UpdateMainTouchbar } from 'lib/touchbar'
import type { ResizableAreaHandle } from 'react-resizable-area'
import type { RootState } from 'views/redux/reducer-factory'
import type { Plugin } from 'views/services/plugin-manager'

import {
  Classes,
  Colors,
  Tab,
  Tabs,
  Button,
  Position,
  NonIdealState,
  Card,
  Menu,
} from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as remote from '@electron/remote'
import * as Sentry from '@sentry/electron'
import classNames from 'classnames'
import { get, sortBy } from 'lodash'
import React, { Component, useCallback, useEffect, useRef, useState } from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ResizableArea } from 'react-resizable-area'
import { styled, css } from 'styled-components'
import { Popover } from 'views/components/etc/overlay'
import { config, ipc } from 'views/env'
import { createTabSwitchAction } from 'views/redux/actions/ui'
import { isInGame } from 'views/utils/game-utils'

import type { PluginWindowWrapHandle } from './plugin-window-wrapper'
import type { TabContentsUnionHandle } from './tab-contents-union'

import * as MAIN_VIEW from '../main'
import * as SETTINGS_VIEW from '../settings'
import * as SHIP_VIEW from '../ship'
import PluginDropdownMenuItem from './plugin-dropdown-menu-item'
import { PluginWindowWrap } from './plugin-window-wrapper'
import { PluginWrap } from './plugin-wrapper'
import { TabContentsUnion } from './tab-contents-union'

const pluginDropDownModifier = {
  flip: { enabled: false },
  preventOverflow: { boundariesElement: 'window', enabled: false },
  hide: { enabled: false },
  computeStyle: { gpuAcceleration: false },
}

const PoiAppTabpane = styled.div`
  flex: 1;
  height: 100%;
  overflow-y: scroll;
  width: 100%;
  padding: 1px 7px;
`

const ShipViewTabpanel = styled(PoiAppTabpane)`
  font-size: 15px;
  margin-top: -2px;
`

const PluginAppTabpane = styled(PoiAppTabpane)`
  height: 100%;
  padding-bottom: 8px;

  & > .bp5-card {
    padding: 4px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
`

const PoiTabsContainer = styled.div<{ double?: boolean; vertical?: boolean }>`
  display: flex;
  height: 100%;
  ${({ double: d, vertical }) =>
    d &&
    vertical &&
    css`
      flex-direction: column;
    `}
`

const PoiTabContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`

const PluginDropdownButton = styled(Button)<{ double?: boolean }>`
  width: 100%;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background: transparent !important;

  svg[data-icon=${IconNames.CHEVRON_DOWN}] {
    transform: rotate(0);
    transition: transform 0.3s;
  }

  &:hover,
  &.${Classes.ACTIVE} {
    color: ${Colors.BLUE2} !important;

    svg {
      color: ${Colors.BLUE2};
    }

    .${Classes.DARK} & {
      color: ${Colors.BLUE5} !important;

      svg {
        color: ${Colors.BLUE5};
      }
    }
  }

  &.${Classes.ACTIVE} {
    svg[data-icon=${IconNames.CHEVRON_DOWN}] {
      transform: rotate(180deg);
    }
  }

  ${({ double: d }) =>
    d &&
    css`
      width: calc(100% - 13.5px);
      margin-left: 6.5px;
      margin-right: 7px;
    `}
`
const PluginNonIdealState = styled(NonIdealState)`
  height: 400px;
  max-height: 100%;
  padding: 50px;
`

const PluginDropdown = styled(Menu)<{ grid?: boolean }>`
  overflow: auto;
  ${({ grid }) =>
    grid
      ? css`
          > *:not(${PluginNonIdealState}) {
            display: block;
            float: left;
            width: calc(100% / 3);
            height: 72px;
          }
        `
      : ''}
`

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const NavTabs = styled(Tabs as React.ComponentType<React.ComponentProps<typeof Tabs>>)`
  width: 100%;

  & > .${Classes.TAB_LIST} {
    gap: 20px;

    & > .${Classes.TAB} {
      flex: 2 0 0;
      margin-right: 0;
      align-items: center;
      justify-content: center;
      display: flex;
      gap: 8px;

      &.half-width {
        flex: 1 0 0;
      }

      svg {
        transform: rotate(0);
        transition: 0s;
      }

      &[aria-selected='true'] {
        svg {
          transform: rotate(360deg);
          transition: 0.75s;
        }
      }
    }
  }
`

const PluginNameContainer = styled.div`
  align-items: center;
  justify-content: center;
  display: flex;
  gap: 8px;
`

const PinButton = styled(Button)`
  align-self: center;
  -webkit-app-region: no-drag;
`

interface SizeOption {
  px?: number
  percent?: number
}

interface ResizableAreaConfig {
  className?: string
  minimumWidth?: SizeOption
  minimumHeight?: SizeOption
  defaultWidth?: SizeOption
  defaultHeight?: SizeOption
  initWidth?: SizeOption
  initHeight?: SizeOption
  disable?: { width: boolean; height: boolean }
  onResized?: (size: { width: SizeOption; height: SizeOption }) => void
}

const getResizableAreaProps = ({
  editable,
  doubleTabbed,
  mainPanelWidth,
  verticalDoubleTabbed,
  mainPanelHeight,
}: {
  editable: boolean
  doubleTabbed: boolean
  mainPanelWidth: SizeOption
  verticalDoubleTabbed: boolean
  mainPanelHeight: SizeOption
}): ResizableAreaConfig => {
  if (!doubleTabbed) {
    return {
      minimumWidth: { px: 0, percent: 100 },
      defaultWidth: { px: 0, percent: 50 },
      initWidth: mainPanelWidth,
      minimumHeight: { px: 0, percent: 100 },
      initHeight: { px: 0, percent: 100 },
      disable: { width: true, height: true },
      onResized: ({ width }) =>
        config.set('poi.tabarea.mainpanelwidth', {
          px: width.px ?? 0,
          percent: width.percent ?? 0,
        }),
    }
  }

  if (verticalDoubleTabbed) {
    return {
      className: classNames({ 'height-resize': editable }),
      minimumWidth: { px: 0, percent: 100 },
      defaultHeight: { px: 0, percent: 50 },
      initHeight: mainPanelHeight,
      minimumHeight: { px: 0, percent: 10 },
      initWidth: { px: 0, percent: 100 },
      disable: { width: true, height: !editable },
      onResized: ({ height }) =>
        config.set('poi.tabarea.mainpanelheight', {
          px: height.px ?? 0,
          percent: height.percent ?? 0,
        }),
    }
  }

  return {
    className: classNames({ 'width-resize': editable }),
    minimumWidth: { px: 0, percent: 10 },
    defaultWidth: { px: 0, percent: 50 },
    initWidth: mainPanelWidth,
    minimumHeight: { px: 0, percent: 100 },
    initHeight: { px: 0, percent: 100 },
    disable: { width: !editable, height: true },
    onResized: ({ width }) =>
      config.set('poi.tabarea.mainpanelwidth', {
        px: width.px ?? 0,
        percent: width.percent ?? 0,
      }),
  }
}

let lockedTab = false

const isPluginTab = (key: string): boolean => !['main-view', 'ship-view', 'settings'].includes(key)

interface ControlledTabAreaProps {
  t: (key: string) => string
  plugins: Plugin[]
  doubleTabbed: boolean
  verticalDoubleTabbed: boolean
  useGridMenu: boolean
  activeMainTab: string
  activePluginName: string
  mainPanelWidth: SizeOption
  mainPanelHeight: SizeOption
  editable: boolean
  windowmode: ConfigValue<'poi.plugin.windowmode'>
  favorite: ConfigValue<'poi.plugin.favorite'>
  pinConfig: ConfigValue<'poi.plugin.pin'>
  async: boolean
}

declare global {
  interface Window {
    openSettings?: () => void
  }
}

const ControlledTabAreaFC = ({
  t,
  plugins: rawPlugins,
  doubleTabbed,
  verticalDoubleTabbed,
  useGridMenu,
  activeMainTab,
  activePluginName,
  mainPanelWidth,
  mainPanelHeight,
  editable,
  windowmode,
  favorite,
  pinConfig,
}: ControlledTabAreaProps): React.ReactElement => {
  const [openedWindow, setOpenedWindow] = useState<Record<string, boolean>>({})
  const [prevDoubleTabbed, setPrevDoubleTabbed] = useState(doubleTabbed)

  const tabsRef = useRef<Tabs | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const resizeContainerRef = useRef<HTMLDivElement | null>(null)
  const mainTabKeyUnionRef = useRef<TabContentsUnionHandle | null>(null)
  const tabKeyUnionRef = useRef<TabContentsUnionHandle | null>(null)
  const resizableAreaRef = useRef<ResizableAreaHandle | null>(null)
  const windowRefs = useRef<Record<string, PluginWindowWrapHandle | null>>({})
  const listenerRef = useRef(false)

  const dispatch = useDispatch()

  const dispatchTabChangeEvent = useCallback(
    (tabInfo: { activeMainTab?: string; activePluginName?: string }, autoSwitch = false): void => {
      dispatch(createTabSwitchAction({ tabInfo, autoSwitch }))
    },
    [dispatch],
  )

  if (doubleTabbed !== prevDoubleTabbed) {
    dispatchTabChangeEvent({ activeMainTab: 'main-view' })
    setPrevDoubleTabbed(doubleTabbed)
  }

  // sort plugins by favorite and priority
  const plugins = sortBy(rawPlugins, [(plugin) => (favorite?.[plugin.id] ? 0 : 1), 'priority'])

  const isWindowMode = useCallback(
    (plugin: Plugin): boolean =>
      windowmode?.[plugin.id] != null ? windowmode[plugin.id] : (plugin.windowMode ?? false),
    [windowmode],
  )

  const listedPlugins = useCallback(
    () =>
      plugins.filter(
        (plugin) => plugin.enabled && (plugin.handleClick || plugin.windowURL || plugin.reactClass),
      ),
    [plugins],
  )

  const tabbedPlugins = useCallback(
    () =>
      plugins.filter(
        (plugin) =>
          plugin.enabled &&
          !plugin.handleClick &&
          !plugin.windowURL &&
          !isWindowMode(plugin) &&
          plugin.reactClass,
      ),
    [plugins, isWindowMode],
  )

  const windowModePlugins = useCallback(
    () =>
      plugins.filter((plugin) => plugin.enabled && isWindowMode(plugin) && openedWindow[plugin.id]),
    [plugins, isWindowMode, openedWindow],
  )

  const selectTab = useCallback(
    (key: string | undefined, autoSwitch = false): void => {
      if (key == null) return
      let tabInfo: { activeMainTab?: string; activePluginName?: string } = {}
      const mainTabUnionRef = doubleTabbed ? mainTabKeyUnionRef : tabKeyUnionRef
      const mainTabInstance = mainTabUnionRef.current
      if (mainTabInstance?.findChildByKey(key)) {
        tabInfo = { ...tabInfo, activeMainTab: key }
      }
      const tabKeyUnionInstance = tabKeyUnionRef.current
      if (isPluginTab(key) && tabKeyUnionInstance?.findChildByKey(key)) {
        tabInfo = { ...tabInfo, activePluginName: key }
      }
      dispatchTabChangeEvent(tabInfo, autoSwitch)
    },
    [doubleTabbed, dispatchTabChangeEvent],
  )

  const handleSelectTab = useCallback(
    (key: string): void => {
      selectTab(key === 'plugin' ? activePluginName : key)
    },
    [selectTab, activePluginName],
  )

  const handleCtrlOrCmdTabKeyDown = useCallback(() => selectTab('main-view'), [selectTab])

  const handleCmdCommaKeyDown = useCallback(() => selectTab('settings'), [selectTab])

  const handleCtrlOrCmdNumberKeyDown = useCallback(
    (num: number): void => {
      let key: string | undefined
      switch (num) {
        case 1:
          key = 'main-view'
          break
        case 2:
          key = 'ship-view'
          break
        default:
          key = plugins[num - 3]?.packageName
          break
      }
      selectTab(key)
    },
    [plugins, selectTab],
  )

  const handleSetTabOffset = useCallback(
    (offset: number): void => {
      const tabKeyUnionInstance = tabKeyUnionRef.current
      if (!tabKeyUnionInstance) return
      const keys = tabKeyUnionInstance.childrenKey()
      const nowIndex = keys.indexOf(doubleTabbed ? activePluginName : activeMainTab)
      selectTab(keys[(nowIndex + keys.length + offset) % keys.length])
    },
    [doubleTabbed, activePluginName, activeMainTab, selectTab],
  )

  const handleShiftTabKeyDown = useCallback(() => handleSetTabOffset(-1), [handleSetTabOffset])
  const handleTabKeyDown = useCallback(() => handleSetTabOffset(1), [handleSetTabOffset])

  const handleKeyDown = useCallback((): void => {
    if (listenerRef.current) return
    listenerRef.current = true
    window.addEventListener('keydown', async (e) => {
      const isingame = await isInGame()
      const activeTag = document.activeElement?.tagName
      if ((activeTag === 'WEBVIEW' && !isingame) || activeTag === 'INPUT') {
        return
      }
      if (e.keyCode === 9) {
        e.preventDefault()
        if (lockedTab && e.repeat) return
        lockedTab = true
        setTimeout(() => {
          lockedTab = false
        }, 200)
        if (e.ctrlKey || e.metaKey) {
          handleCtrlOrCmdTabKeyDown()
        } else if (e.shiftKey) {
          handleShiftTabKeyDown()
        } else {
          handleTabKeyDown()
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.keyCode >= '1'.charCodeAt(0) && e.keyCode <= '9'.charCodeAt(0)) {
          handleCtrlOrCmdNumberKeyDown(e.keyCode - 48)
        } else if (e.keyCode === '0'.charCodeAt(0)) {
          handleCtrlOrCmdNumberKeyDown(10)
        }
      }
    })
  }, [
    handleCtrlOrCmdTabKeyDown,
    handleShiftTabKeyDown,
    handleTabKeyDown,
    handleCtrlOrCmdNumberKeyDown,
  ])

  const handleResponse = useCallback(
    (e: Event): void => {
      if (!(e instanceof CustomEvent)) return
      const detail: { path: string } = e.detail
      if (config.get('poi.autoswitch.enabled', true)) {
        let toSwitch: string | undefined
        if (config.get('poi.autoswitch.main', true)) {
          if (
            [
              '/kcsapi/api_port/port',
              '/kcsapi/api_get_member/ndock',
              '/kcsapi/api_get_member/kdock',
              '/kcsapi/api_get_member/questlist',
            ].includes(detail.path)
          ) {
            toSwitch = 'main-view'
          }
          if (['/kcsapi/api_get_member/preset_deck'].includes(detail.path)) {
            toSwitch = 'ship-view'
          }
        }
        for (const [id, enabled, switchPluginPath] of plugins.map(
          (plugin) =>
            [plugin.id, plugin.enabled, plugin.switchPluginPath ?? []] as [
              string,
              boolean,
              (string | { path: string; valid?: () => boolean })[],
            ],
        )) {
          for (const switchPath of switchPluginPath) {
            if (
              config.get(`poi.autoswitch.${id}`, true) &&
              enabled &&
              (switchPath === detail.path ||
                (typeof switchPath === 'object' &&
                  switchPath.path === detail.path &&
                  switchPath.valid &&
                  switchPath.valid()))
            ) {
              toSwitch = id
            }
          }
        }
        selectTab(toSwitch, true)
      }
    },
    [plugins, selectTab],
  )

  const handleConfig = useCallback(
    <P extends ConfigStringPath>(path: P): void => {
      if (path.startsWith('poi.tabarea')) {
        if (config.get('poi.tabarea.vertical', false)) {
          resizableAreaRef.current?.setSize({
            width: { px: 0, percent: 100 },
            height: mainPanelHeight,
          })
        } else {
          resizableAreaRef.current?.setSize({
            width: mainPanelWidth,
            height: { px: 0, percent: 100 },
          })
        }
      }
    },
    [mainPanelHeight, mainPanelWidth],
  )

  const openWindow = useCallback(
    (plugin: Plugin): void => {
      if (!openedWindow[plugin.id]) {
        setOpenedWindow((prev) => ({ ...prev, [plugin.id]: true }))
      } else if (windowRefs.current[plugin.id]) {
        windowRefs.current[plugin.id]?.focusWindow()
      }
    },
    [openedWindow],
  )

  const closeWindow = useCallback((plugin: Plugin): void => {
    setOpenedWindow((prev) => ({ ...prev, [plugin.id]: false }))
  }, [])

  const ipcFocusPlugin = useCallback(
    (id: string): void => {
      const tgt = plugins.find((p) => p.id === id)
      if (!tgt || !tgt.enabled) return
      if (!isWindowMode(tgt)) {
        remote.getCurrentWindow().focus()
        handleSelectTab(id)
      } else {
        openWindow(tgt)
      }
    },
    [plugins, isWindowMode, handleSelectTab, openWindow],
  )

  useEffect(() => {
    handleKeyDown()
    window.addEventListener('game.start', handleKeyDown)
    window.addEventListener('game.response', handleResponse)
    window.openSettings = handleCmdCommaKeyDown
    ipc.register('MainWindow', {
      ipcFocusPlugin: (id: string) => ipcFocusPlugin(id),
    })

    if (process.platform === 'darwin') {
      require('electron').ipcRenderer.on('touchbartab', (_event: unknown, message: number) => {
        let key: string | undefined
        switch (message) {
          case 0:
            key = 'main-view'
            break
          case 1:
            key = 'ship-view'
            break
          case 2:
            key = activePluginName || plugins[0]?.packageName
            break
        }
        selectTab(key)
      })
    }

    config.addListener('config.set', handleConfig)

    setTimeout(() => {
      const tabsInstance = tabsRef.current
      if (tabsInstance != null && 'moveSelectionIndicator' in tabsInstance) {
        // @ts-expect-error dirty hack to access private method to fix selection indicator position after loading
        tabsInstance.moveSelectionIndicator(false)
      }
    }, 500)

    return () => {
      window.removeEventListener('game.start', handleKeyDown)
      window.removeEventListener('game.response', handleResponse)
      ipc.unregisterAll('MainWindow')
      config.removeListener('config.set', handleConfig)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (process.platform === 'darwin') {
      const currentTabbedPlugins = tabbedPlugins()
      const activePlugin: Partial<Plugin> =
        currentTabbedPlugins.length === 0
          ? {}
          : (currentTabbedPlugins.find((p) => p.packageName === activePluginName) ??
            currentTabbedPlugins[0])

      const updateMainTouchbar: UpdateMainTouchbar =
        remote.require('./lib/touchbar').updateMainTouchbar
      updateMainTouchbar(
        t('main:Overview'),
        t('main:Fleet'),
        activePlugin.name || t('others:Plugins'),
        activeMainTab,
        t('others:Plugins'),
      )
    }
  }, [activeMainTab, activePluginName, t, tabbedPlugins])

  // handle window plugin pin
  useEffect(() => {
    for (const pluginId in pinConfig) {
      if (!openedWindow[pluginId]) {
        // open the plugin window if pin is set but window is not opened
        const plugin = plugins.find((p) => p.id === pluginId)
        if (plugin) {
          openWindow(plugin)
        }
      }
    }
  }, [pinConfig, openWindow, plugins, openedWindow])
  // handle window plugin pin set
  const handlePluginPin = useCallback(
    (plugin: Plugin): void => {
      const currentPinConfig = pinConfig?.[plugin.id]
      if (currentPinConfig) {
        config.delete(`poi.plugin.pin.${plugin.id}`)
      } else {
        const parentBounds = remote.getCurrentWindow().getBounds()
        const pluginWindow = remote.BrowserWindow.getAllWindows().find((win) => {
          const url = win.webContents.getURL()
          return url.includes(`?${plugin.id}`)
        })
        if (pluginWindow) {
          const pluginBounds = pluginWindow.getBounds()
          config.set(`poi.plugin.pin.${plugin.id}`, {
            deltaX: pluginBounds.x - parentBounds.x,
            deltaY: pluginBounds.y - parentBounds.y,
            width: pluginBounds.width,
            height: pluginBounds.height,
          })
        } else {
          // plugin window is not opened, set config and open it
          const pluginBounds = config.get(`plugin.${plugin.id}.bounds`, {
            x: parentBounds.x + 50,
            y: parentBounds.y + 50,
            width: 800,
            height: 600,
          })
          config.set(`poi.plugin.pin.${plugin.id}`, {
            deltaX: pluginBounds.x - parentBounds.x,
            deltaY: pluginBounds.y - parentBounds.y,
            width: pluginBounds.width,
            height: pluginBounds.height,
          })
        }
      }
    },
    [pinConfig],
  )
  const getPinButton = (plugin: Plugin) => {
    const isPinned = !!pinConfig?.[plugin.id]
    return (
      <PinButton
        icon={isPinned ? 'pin' : 'unpin'}
        active={isPinned}
        minimal
        onClick={() => handlePluginPin(plugin)}
        title={isPinned ? t('setting:Unpin') : t('setting:Pin')}
        small
      />
    )
  }

  const currentTabbedPlugins = tabbedPlugins()
  const currentWindowModePlugins = windowModePlugins()
  const pluginsToList = listedPlugins()
  const activePlugin: Partial<Plugin> =
    currentTabbedPlugins.length === 0
      ? {}
      : currentTabbedPlugins.find((p) => p.packageName === activePluginName) ||
        currentTabbedPlugins[0]
  const defaultPluginIcon = <FontAwesome name="sitemap" />
  const defaultPluginTitle = t('others:Plugins')

  const pluginDropdownContents = (
    <PluginDropdown className="plugin-dropdown" large={!useGridMenu} grid={useGridMenu}>
      {pluginsToList.length === 0 ? (
        <PluginNonIdealState
          icon="cloud-download"
          title={t('setting:No plugin found')}
          description={t('setting:Install plugins in settings')}
        />
      ) : (
        pluginsToList.map((plugin) => {
          const handleClick = plugin.handleClick
            ? plugin.handleClick
            : isWindowMode(plugin)
              ? () => openWindow(plugin)
              : () => handleSelectTab(plugin.id)
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
    </PluginDropdown>
  )

  const pluginContents = currentTabbedPlugins.map((plugin) => (
    <PluginWrap key={plugin.id} plugin={plugin} container={PluginAppTabpane} />
  ))

  const windowModePluginContents = currentWindowModePlugins.map((plugin) => (
    <PluginWindowWrap
      key={plugin.id}
      plugin={plugin}
      ref={(r) => {
        windowRefs.current[plugin.id] = r
      }}
      closeWindowPortal={() => closeWindow(plugin)}
      titleExtra={getPinButton(plugin)}
      pinned={!!pinConfig?.[plugin.id]}
    />
  ))

  const leftPanelNav = (
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

      {/* we're not using fragment because blueprint tabs only reads direct children */}
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
          content={pluginDropdownContents}
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

  const leftPanelContent = (
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

  const resizableAreaProps = getResizableAreaProps({
    editable,
    doubleTabbed,
    mainPanelWidth,
    verticalDoubleTabbed,
    mainPanelHeight,
  })

  const rightPanel = doubleTabbed && (
    <PoiTabContainer className="poi-tab-container">
      <Popover
        minimal
        hasBackdrop
        popoverClassName="plugin-dropdown-container"
        position={Position.BOTTOM}
        content={pluginDropdownContents}
        className="nav-tab"
        modifiers={pluginDropDownModifier}
      >
        <PluginDropdownButton
          ref={triggerRef}
          minimal
          large
          double
          rightIcon="chevron-down"
          text={
            <PluginNameContainer>
              {activePlugin.displayIcon || defaultPluginIcon}
              {activePlugin.name || defaultPluginTitle}
            </PluginNameContainer>
          }
        />
      </Popover>
      <TabContentsUnion
        ref={tabKeyUnionRef}
        activeTab={pluginContents.length ? activePluginName : 'no-plugin'}
      >
        {pluginContents.length ? (
          pluginContents
        ) : (
          <PluginAppTabpane key="no-plugin" id="no-plugin">
            <Card>
              <PluginNonIdealState
                icon="cloud-download"
                title={t('setting:No plugin found')}
                description={t('setting:Install plugins in settings')}
              />
            </Card>
          </PluginAppTabpane>
        )}
      </TabContentsUnion>
    </PoiTabContainer>
  )

  return (
    <PoiTabsContainer
      className="poi-tabs-container"
      double={doubleTabbed}
      vertical={verticalDoubleTabbed}
      ref={resizeContainerRef}
    >
      <ResizableArea
        ref={resizableAreaRef}
        className={classNames({
          'width-resize': doubleTabbed && editable && !verticalDoubleTabbed,
        })}
        parentContainer={resizeContainerRef.current ?? undefined}
        {...resizableAreaProps}
      >
        <PoiTabContainer className="poi-tab-container">
          {leftPanelNav}
          {leftPanelContent}
          {windowModePluginContents}
        </PoiTabContainer>
      </ResizableArea>
      {doubleTabbed && rightPanel}
    </PoiTabsContainer>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  info?: React.ErrorInfo
  eventId?: string
}

class TabAreaErrorBoundary extends Component<ControlledTabAreaProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(error, info)
    Sentry.withScope((scope) => {
      scope.setExtra('componentStack', info.componentStack)
      scope.setTag('area', 'poi')
      const eventId = Sentry.captureException(error)
      this.setState({ hasError: true, error, info, eventId })
    })
  }

  render(): React.ReactNode {
    if (this.state.hasError) return <div />
    return <ControlledTabAreaFC {...this.props} />
  }
}

export const ControlledTabArea = (): React.ReactElement => {
  const { t } = useTranslation(['setting', 'others'])

  const plugins = useSelector((state: RootState) => state.plugins)
  const windowmode = useSelector((state: RootState) => state.config.poi?.plugin?.windowmode ?? {})
  const favorite = useSelector((state: RootState) => state.config.poi?.plugin?.favorite ?? {})
  const pinConfig = useSelector((state: RootState) => state.config.poi?.plugin?.pin ?? {})
  const activePluginName = useSelector((state: RootState): string => {
    const fromState = state?.ui?.activePluginName
    if (fromState != null) return fromState
    const wm = state.config.poi?.plugin?.windowmode ?? {}
    const allPlugins = state.plugins
    const visibleActivePlugins = allPlugins.filter(
      (plugin) => plugin.enabled && !get(wm, plugin.id, false),
    )
    return visibleActivePlugins[0]?.id ?? ''
  })
  const doubleTabbed = useSelector(
    (state: RootState): boolean => state.config.poi?.tabarea?.double ?? false,
  )
  const verticalDoubleTabbed = useSelector(
    (state: RootState): boolean => state.config.poi?.tabarea?.vertical ?? false,
  )
  const useGridMenu = useSelector(
    (state: RootState): boolean => state.config.poi?.tabarea?.grid ?? true,
  )
  const activeMainTab = useSelector(
    (state: RootState): string => state.ui?.activeMainTab ?? 'main-view',
  )
  const mainPanelWidth = useSelector(
    (state: RootState): SizeOption =>
      state.config.poi?.tabarea?.mainpanelwidth ?? { px: 0, percent: 50 },
  )
  const mainPanelHeight = useSelector(
    (state: RootState): SizeOption =>
      state.config.poi?.tabarea?.mainpanelheight ?? { px: 0, percent: 50 },
  )
  const editable = useSelector(
    (state: RootState): boolean => state.config.poi?.layout?.editable ?? false,
  )
  const asyncProp = useSelector(
    (state: RootState): boolean => state.config.poi?.misc?.async ?? true,
  )

  return (
    <TabAreaErrorBoundary
      t={t}
      plugins={plugins}
      doubleTabbed={doubleTabbed}
      verticalDoubleTabbed={verticalDoubleTabbed}
      useGridMenu={useGridMenu}
      activeMainTab={activeMainTab}
      activePluginName={activePluginName}
      mainPanelWidth={mainPanelWidth}
      mainPanelHeight={mainPanelHeight}
      editable={editable}
      windowmode={windowmode}
      favorite={favorite}
      pinConfig={pinConfig}
      async={asyncProp}
    />
  )
}
