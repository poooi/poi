import type { Tabs } from '@blueprintjs/core'
import type { ConfigStringPath, ConfigValue } from 'lib/config'
import type { UpdateMainTouchbar } from 'lib/touchbar'
import type { ResizableAreaHandle } from 'react-resizable-area'
import type { RootState } from 'views/redux/reducer-factory'
import type { Plugin } from 'views/services/plugin-manager'

import * as remote from '@electron/remote'
import * as Sentry from '@sentry/electron'
import classNames from 'classnames'
import { get, sortBy } from 'lodash'
import React, { Component, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ResizableArea } from 'react-resizable-area'
import { config, ipc } from 'views/env'
import { createTabSwitchAction } from 'views/redux/actions/ui'

import type { PluginWindowWrapHandle } from './plugin-window-wrapper'
import type { TabContentsUnionHandle } from './tab-contents-union'

import { LeftPanel } from './left-panel'
import { RightPanel } from './right-panel'
import { PinButton, PoiTabsContainer } from './styles'
import { useAutoSwitch } from './use-auto-switch'
import { useTabKeyboard } from './use-tab-keyboard'

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

  const plugins = sortBy(rawPlugins, [(plugin) => (favorite?.[plugin.id] ? 0 : 1), 'priority'])

  const isWindowMode = useCallback(
    (plugin: Plugin): boolean =>
      windowmode?.[plugin.id] != null ? windowmode[plugin.id] : (plugin.windowMode ?? false),
    [windowmode],
  )

  const tabbedPlugins = plugins.filter(
    (plugin) =>
      plugin.enabled &&
      !plugin.handleClick &&
      !plugin.windowURL &&
      !isWindowMode(plugin) &&
      plugin.reactClass,
  )

  const listedPlugins = plugins.filter(
    (plugin) => plugin.enabled && (plugin.handleClick || plugin.windowURL || plugin.reactClass),
  )

  const selectTab = useCallback(
    (key: string, autoSwitch = false): void => {
      if (!key) return
      let tabInfo: { activeMainTab?: string; activePluginName?: string } = {}
      const mainTabUnionRef = doubleTabbed ? mainTabKeyUnionRef : tabKeyUnionRef
      if (mainTabUnionRef.current?.findChildByKey(key)) {
        tabInfo = { ...tabInfo, activeMainTab: key }
      }
      if (isPluginTab(key) && tabKeyUnionRef.current?.findChildByKey(key)) {
        tabInfo = { ...tabInfo, activePluginName: key }
      }
      dispatchTabChangeEvent(tabInfo, autoSwitch)
    },
    [doubleTabbed, dispatchTabChangeEvent],
  )

  const handleSelectTab = useCallback(
    (key: string): void => selectTab(key === 'plugin' ? activePluginName : key),
    [selectTab, activePluginName],
  )

  const handleSetTabOffset = useCallback(
    (offset: number): void => {
      const keys = tabKeyUnionRef.current?.childrenKey() ?? []
      const nowIndex = keys.indexOf(doubleTabbed ? activePluginName : activeMainTab)
      selectTab(keys[(nowIndex + keys.length + offset) % keys.length] ?? '')
    },
    [doubleTabbed, activePluginName, activeMainTab, selectTab],
  )

  const { register: registerKeyboard } = useTabKeyboard({
    onCtrlTab: useCallback(() => selectTab('main-view'), [selectTab]),
    onShiftTab: useCallback(() => handleSetTabOffset(-1), [handleSetTabOffset]),
    onTab: useCallback(() => handleSetTabOffset(1), [handleSetTabOffset]),
    onNumberKey: useCallback(
      (num: number): void => {
        const keys = ['main-view', 'ship-view', ...plugins.map((p) => p.packageName)]
        selectTab(keys[num - 1] ?? '')
      },
      [plugins, selectTab],
    ),
  })

  const { handleResponse } = useAutoSwitch({ plugins, selectTab })

  const openWindow = useCallback(
    (plugin: Plugin): void => {
      if (!openedWindow[plugin.id]) {
        setOpenedWindow((prev) => ({ ...prev, [plugin.id]: true }))
      } else {
        windowRefs.current[plugin.id]?.focusWindow()
      }
    },
    [openedWindow],
  )

  const closeWindow = useCallback((plugin: Plugin): void => {
    setOpenedWindow((prev) => ({ ...prev, [plugin.id]: false }))
  }, [])

  const handlePluginPin = useCallback(
    (plugin: Plugin): void => {
      const currentPinConfig = pinConfig?.[plugin.id]
      if (currentPinConfig) {
        config.delete(`poi.plugin.pin.${plugin.id}`)
        return
      }
      const parentBounds = remote.getCurrentWindow().getBounds()
      const pluginWindow = remote.BrowserWindow.getAllWindows().find((win) =>
        win.webContents.getURL().includes(`?${plugin.id}`),
      )
      if (pluginWindow) {
        const pluginBounds = pluginWindow.getBounds()
        config.set(`poi.plugin.pin.${plugin.id}`, {
          deltaX: pluginBounds.x - parentBounds.x,
          deltaY: pluginBounds.y - parentBounds.y,
          width: pluginBounds.width,
          height: pluginBounds.height,
        })
      } else {
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
    },
    [pinConfig],
  )

  const getPinButton = useCallback(
    (plugin: Plugin) => {
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
    },
    [pinConfig, handlePluginPin, t],
  )

  const handleConfig = useCallback(
    <P extends ConfigStringPath>(path: P): void => {
      if (!path.startsWith('poi.tabarea')) return
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
    },
    [mainPanelHeight, mainPanelWidth],
  )

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
    registerKeyboard()
    window.addEventListener('game.start', registerKeyboard)
    window.addEventListener('game.response', handleResponse)
    window.openSettings = () => selectTab('settings')
    ipc.register('MainWindow', {
      ipcFocusPlugin: (id: string) => ipcFocusPlugin(id),
    })

    if (process.platform === 'darwin') {
      require('electron').ipcRenderer.on('touchbartab', (_event: unknown, message: number) => {
        const keys = ['main-view', 'ship-view', activePluginName || plugins[0]?.packageName]
        selectTab(keys[message] ?? '')
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
      window.removeEventListener('game.start', registerKeyboard)
      window.removeEventListener('game.response', handleResponse)
      ipc.unregisterAll('MainWindow')
      config.removeListener('config.set', handleConfig)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (process.platform === 'darwin') {
      const activePlugin: Partial<Plugin> =
        tabbedPlugins.find((p) => p.packageName === activePluginName) ?? tabbedPlugins[0] ?? {}
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

  // open pinned plugin windows
  useEffect(() => {
    for (const pluginId in pinConfig) {
      if (!openedWindow[pluginId]) {
        const plugin = plugins.find((p) => p.id === pluginId)
        if (plugin) openWindow(plugin)
      }
    }
  }, [pinConfig, openWindow, plugins, openedWindow])

  const activePlugin: Partial<Plugin> =
    tabbedPlugins.find((p) => p.packageName === activePluginName) ?? tabbedPlugins[0] ?? {}

  const resizableAreaProps = getResizableAreaProps({
    editable,
    doubleTabbed,
    mainPanelWidth,
    verticalDoubleTabbed,
    mainPanelHeight,
  })

  const sharedPanelProps = {
    activePlugin,
    tabbedPlugins,
    listedPlugins,
    useGridMenu,
    activeMainTab,
    isWindowMode,
    onOpenWindow: openWindow,
    onSelectTab: handleSelectTab,
    handlePluginPin,
  }

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
        <LeftPanel
          {...sharedPanelProps}
          doubleTabbed={doubleTabbed}
          activePluginName={activePluginName}
          pinConfig={pinConfig ?? {}}
          openedWindow={openedWindow}
          windowRefs={windowRefs}
          onCloseWindow={closeWindow}
          getPinButton={getPinButton}
          tabsRef={tabsRef}
          tabKeyUnionRef={tabKeyUnionRef}
          mainTabKeyUnionRef={mainTabKeyUnionRef}
          triggerRef={triggerRef}
        />
      </ResizableArea>
      {doubleTabbed && (
        <RightPanel
          {...sharedPanelProps}
          activePluginName={activePluginName}
          tabKeyUnionRef={tabKeyUnionRef}
          triggerRef={triggerRef}
        />
      )}
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
