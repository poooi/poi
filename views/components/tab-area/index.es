/* global config, dispatch, ipc */
import classNames from 'classnames'
import { connect } from 'react-redux'
import React, { PureComponent, unstable_AsyncMode as Async } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import {
  Tab,
  Tabs,
  Popover,
  Button,
  Position,
  NonIdealState,
  Card,
  Menu,
  MenuItem,
} from '@blueprintjs/core'
import { get } from 'lodash'
import { ResizableArea } from 'react-resizable-area'
import { withNamespaces } from 'react-i18next'
import { remote } from 'electron'
import styled, { css, createGlobalStyle } from 'styled-components'

import { isInGame } from 'views/utils/game-utils'

import * as SETTINGS_VIEW from '../settings'
import * as MAIN_VIEW from '../main'
import * as SHIP_VIEW from '../ship'
import { PluginWrap } from './plugin-wrapper'
import { PluginWindowWrap } from './plugin-window-wrapper'
import { TabContentsUnion } from './tab-contents-union'

const emptyObj = {}

const pluginDropDownModifier = {
  flip: {
    enabled: false,
  },
  preventOverflow: {
    boundariesElement: 'window',
    enabled: false,
  },
  hide: {
    enabled: false,
  },
}

const GlobalStyle = createGlobalStyle`
  .plugin-dropdown-container > .bp3-popover-content {
    backdrop-filter: blur(5px);

    .bp3-menu {
      background: transparent;
    }
  }
`

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

  & > .bp3-card {
    padding: 4px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
`

const PoiTabsContainer = styled.div`
  display: flex;
  height: 100%;
  ${({ double, vertical }) =>
    double &&
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

const PluginDropdownButton = styled(Button)`
  width: 100%;
`

const PluginDropdownMenuItem = styled(MenuItem)`
  align-items: center;
`

const PluginDropdown = styled(Menu)`
  overflow: auto;
  ${({ grid }) =>
    grid
      ? css`
          li {
            display: block;
            float: left;
            width: calc(100% / 3);

            a {
              padding: 10px;
              flex-direction: column;

              [class*='fa-'].svg-inline--fa {
                font-size: 175%;
                margin: 0;
              }
            }
          }
        `
      : css`
          [class*='fa-'].svg-inline--fa {
            width: 1em;
          }
        `}
`

const NavTabs = styled(Tabs)`
  width: calc(100% + 20px);

  .bp3-tab {
    text-align: center;
  }

  .nav-tab-3 {
    width: calc(33% - 20px);
  }

  .nav-tab-4 {
    width: calc(25% - 20px);
  }

  .nav-tab-8 {
    width: calc(12.5% - 20px);
  }
`

const PluginNonIdealState = styled(NonIdealState)`
  height: 400px;
  max-height: 100%;
  padding: 50px;
`

const getResizableAreaProps = ({
  editable,
  doubleTabbed,
  mainPanelWidth,
  verticalDoubleTabbed,
  mainPanelHeight,
}) => {
  if (!doubleTabbed) {
    return {
      minimumWidth: {
        px: 0,
        percent: 100,
      },
      defaultWidth: {
        px: 0,
        percent: 50,
      },
      initWidth: mainPanelWidth,
      minimumHeight: {
        px: 0,
        percent: 100,
      },
      initHeight: {
        px: 0,
        percent: 100,
      },
      disable: {
        width: true,
        height: true,
      },
      onResized: ({ width }) => config.set('poi.tabarea.mainpanelwidth', width),
    }
  }

  if (verticalDoubleTabbed) {
    return {
      className: classNames({ 'height-resize': editable }),
      minimumWidth: {
        px: 0,
        percent: 100,
      },
      defaultHeight: {
        px: 0,
        percent: 50,
      },
      initHeight: mainPanelHeight,
      minimumHeight: {
        px: 0,
        percent: 10,
      },
      initWidth: {
        px: 0,
        percent: 100,
      },
      disable: {
        width: true,
        height: !editable,
      },
      onResized: ({ height }) => config.set('poi.tabarea.mainpanelheight', height),
    }
  }

  return {
    className: classNames({ 'width-resize': editable }),
    minimumWidth: {
      px: 0,
      percent: 10,
    },
    defaultWidth: {
      px: 0,
      percent: 50,
    },
    initWidth: mainPanelWidth,
    minimumHeight: {
      px: 0,
      percent: 100,
    },
    initHeight: {
      px: 0,
      percent: 100,
    },
    disable: {
      width: !editable,
      height: true,
    },
    onResized: ({ width }) => config.set('poi.tabarea.mainpanelwidth', width),
  }
}

let lockedTab = false

const dispatchTabChangeEvent = (tabInfo, autoSwitch = false) =>
  dispatch({
    type: '@@TabSwitch',
    tabInfo,
    autoSwitch,
  })

@withNamespaces(['setting', 'others'])
@connect(state => ({
  plugins: state.plugins,
  doubleTabbed: get(state.config, 'poi.tabarea.double', false),
  verticalDoubleTabbed: get(state.config, 'poi.tabarea.vertical', false),
  useGridMenu: get(state.config, 'poi.tabarea.grid', true),
  activeMainTab: get(state.ui, 'activeMainTab', 'main-view'),
  activePluginName: get(state.ui, 'activePluginName', get(state.plugins, '0.id', '')),
  mainPanelWidth: get(state.config, 'poi.tabarea.mainpanelwidth', { px: 0, percent: 50 }),
  mainPanelHeight: get(state.config, 'poi.tabarea.mainpanelheight', { px: 0, percent: 50 }),
  editable: get(state.config, 'poi.layout.editable', false),
  windowmode: get(state.config, 'poi.plugin.windowmode', emptyObj),
  async: get(state.config, 'poi.misc.async', true),
}))
export class ControlledTabArea extends PureComponent {
  static propTypes = {
    plugins: PropTypes.array.isRequired,
    doubleTabbed: PropTypes.bool.isRequired,
    verticalDoubleTabbed: PropTypes.bool.isRequired,
    useGridMenu: PropTypes.bool.isRequired,
    activeMainTab: PropTypes.string.isRequired,
    activePluginName: PropTypes.string.isRequired,
    mainPanelWidth: PropTypes.shape({
      px: PropTypes.number,
      percent: PropTypes.number,
    }),
    mainPanelHeight: PropTypes.shape({
      px: PropTypes.number,
      percent: PropTypes.number,
    }),
    editable: PropTypes.bool.isRequired,
    windowmode: PropTypes.object.isRequired,
  }

  state = {
    openedWindow: {},
  }

  windowRefs = {}

  trigger = React.createRef()

  resizeContainer = React.createRef()

  mainTabKeyUnion = React.createRef()

  tabKeyUnion = React.createRef()

  static getDerivedStateFromProps = (nextProps, prevState) => {
    if (nextProps.doubleTabbed !== (prevState || {}).prevDoubleTabbed) {
      dispatchTabChangeEvent({
        activeMainTab: 'main-view',
      })
      return {
        prevDoubleTabbed: nextProps.doubleTabbed,
      }
    }
    return null
  }

  componentDidMount() {
    this.handleKeyDown()
    window.addEventListener('game.start', this.handleKeyDown)
    window.addEventListener('game.response', this.handleResponse)
    window.openSettings = this.handleCmdCommaKeyDown
    ipc.register('MainWindow', {
      ipcFocusPlugin: this.ipcFocusPlugin,
    })
    if (process.platform === 'darwin') {
      require('electron').ipcRenderer.on('touchbartab', (event, message) => {
        this.handleTouchbar(message)
      })
    }
    config.addListener('config.set', this.handleConfig)
  }

  componentDidUpdate(prevProps) {
    if (process.platform === 'darwin') {
      const { t } = this.props

      const tabbedPlugins = this.tabbedPlugins()

      const activePlugin =
        tabbedPlugins.length == 0
          ? {}
          : tabbedPlugins.find(p => p.packageName === this.props.activePluginName) ||
            tabbedPlugins[0]

      const { updateMainTouchbar } = remote.require('./lib/touchbar')
      updateMainTouchbar(
        t('main:Overview'),
        t('main:Fleet'),
        activePlugin.name || t('others:Plugins'),
        this.props.activeMainTab,
        t('others:Plugins'),
      )
    }
  }

  componentWillUnmount() {
    window.removeEventListener('game.start', this.handleKeyDown)
    window.removeEventListener('game.response', this.handleResponse)
    ipc.unregisterAll('MainWindow')
    config.removeListener('config.set', this.handleConfig)
  }

  componentDidCatch(error, info) {
    console.error(error, info)
    this.setState({
      error: true,
    })
  }

  selectTab = (key, autoSwitch = false) => {
    if (key == null) return
    let tabInfo = {}
    const mainTabKeyUnion = this.props.doubleTabbed ? this.mainTabKeyUnion : this.tabKeyUnion
    const mainTabInstance = mainTabKeyUnion.current
    if (mainTabInstance.findChildByKey(mainTabInstance.props.children, key)) {
      tabInfo = {
        ...tabInfo,
        activeMainTab: key,
      }
    }
    const tabKeyUnionInstance = this.tabKeyUnion.current
    if (
      this.isPluginTab(key) &&
      tabKeyUnionInstance.findChildByKey(tabKeyUnionInstance.props.children, key)
    ) {
      tabInfo = {
        ...tabInfo,
        activePluginName: key,
      }
    }
    dispatchTabChangeEvent(tabInfo, autoSwitch)
  }

  handleSelectTab = key => {
    this.selectTab(key === 'plugin' ? this.props.activePluginName : key)
  }

  handleCtrlOrCmdTabKeyDown = () => {
    this.selectTab('main-view')
  }

  handleCmdCommaKeyDown = () => {
    this.selectTab('settings')
  }

  handleCtrlOrCmdNumberKeyDown = num => {
    let key
    switch (num) {
      case 1:
        key = 'main-view'
        break
      case 2:
        key = 'ship-view'
        break
      default:
        key = (this.props.plugins[num - 3] || {}).packageName
        break
    }
    this.selectTab(key)
  }

  handleShiftTabKeyDown = () => {
    this.handleSetTabOffset(-1)
  }

  handleTabKeyDown = () => {
    this.handleSetTabOffset(1)
  }

  handleSetTabOffset = offset => {
    const tabKeyUnionInstance = this.tabKeyUnion.current
    const childrenKey = tabKeyUnionInstance.childrenKey(tabKeyUnionInstance.props.children)
    const nowIndex = childrenKey.indexOf(
      this.props.doubleTabbed ? this.props.activePluginName : this.props.activeMainTab,
    )
    this.selectTab(childrenKey[(nowIndex + childrenKey.length + offset) % childrenKey.length])
  }

  handleKeyDown = () => {
    if (this.listener != null) return
    this.listener = true
    window.addEventListener('keydown', async e => {
      const isingame = await isInGame()
      if (
        (document.activeElement.tagName === 'WEBVIEW' && !isingame) ||
        document.activeElement.tagName === 'INPUT'
      ) {
        return
      }
      if (e.keyCode == 9) {
        e.preventDefault()
        if (lockedTab && e.repeat) return
        lockedTab = true
        setTimeout(() => {
          lockedTab = false
        }, 200)
        if (e.ctrlKey || e.metaKey) {
          this.handleCtrlOrCmdTabKeyDown()
        } else if (e.shiftKey) {
          this.handleShiftTabKeyDown()
        } else {
          this.handleTabKeyDown()
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.keyCode >= '1'.charCodeAt() && e.keyCode <= '9'.charCodeAt()) {
          this.handleCtrlOrCmdNumberKeyDown(e.keyCode - 48)
        } else if (e.keyCode == '0'.charCodeAt()) {
          this.handleCtrlOrCmdNumberKeyDown(10)
        }
      }
    })
  }

  handleResponse = e => {
    if (config.get('poi.autoswitch.enabled', true)) {
      let toSwitch
      if (config.get('poi.autoswitch.main', true)) {
        if (
          [
            '/kcsapi/api_port/port',
            '/kcsapi/api_get_member/ndock',
            '/kcsapi/api_get_member/kdock',
            '/kcsapi/api_get_member/questlist',
          ].includes(e.detail.path)
        ) {
          toSwitch = 'main-view'
        }
        if (['/kcsapi/api_get_member/preset_deck'].includes(e.detail.path)) {
          toSwitch = 'ship-view'
        }
      }
      for (const [id, enabled, switchPluginPath] of this.props.plugins.map(plugin => [
        plugin.id,
        plugin.enabled,
        plugin.switchPluginPath || [],
      ])) {
        for (const switchPath of switchPluginPath) {
          if (
            config.get(`poi.autoswitch.${id}`, true) &&
            enabled &&
            (switchPath === e.detail.path ||
              (switchPath.path === e.detail.path && switchPath.valid && switchPath.valid()))
          ) {
            toSwitch = id
          }
        }
      }
      this.selectTab(toSwitch, true)
    }
  }

  handleTouchbar = props => {
    let key
    switch (props) {
      case 0:
        key = 'main-view'
        break
      case 1:
        key = 'ship-view'
        break
      case 2:
        key = this.props.activePluginName || (this.props.plugins[0] || {}).packageName
        break
    }
    this.selectTab(key)
  }

  // All displaying plugins
  listedPlugins = () => {
    return this.props.plugins.filter(
      plugin => plugin.enabled && (plugin.handleClick || plugin.windowURL || plugin.reactClass),
    )
  }

  // All non-new-window displaying plugins
  tabbedPlugins = () =>
    this.props.plugins.filter(
      plugin =>
        plugin.enabled &&
        !plugin.handleClick &&
        !plugin.windowURL &&
        !this.isWindowMode(plugin) &&
        plugin.reactClass,
    )

  isPluginTab = key => !['main-view', 'ship-view', 'settings'].includes(key)

  isWindowMode = plugin =>
    this.props.windowmode[plugin.id] != null ? this.props.windowmode[plugin.id] : plugin.windowMode

  windowModePlugins = () =>
    this.props.plugins.filter(
      plugin => plugin.enabled && this.isWindowMode(plugin) && this.state.openedWindow[plugin.id],
    )

  openWindow = plugin => {
    if (!this.state.openedWindow[plugin.id]) {
      this.setState({
        openedWindow: {
          ...this.state.openedWindow,
          [plugin.id]: true,
        },
      })
    } else {
      if (this.windowRefs[plugin.id]) {
        this.windowRefs[plugin.id].focusWindow()
      }
    }
  }

  closeWindow = plugin => {
    this.setState({
      openedWindow: {
        ...this.state.openedWindow,
        [plugin.id]: false,
      },
    })
  }

  ipcFocusPlugin = id => {
    const tgt = this.props.plugins.find(p => p.id === id)
    if (!tgt || !tgt.enabled) {
      return
    }
    if (!this.isWindowMode(tgt)) {
      remote.getCurrentWindow().focus()
      this.handleSelectTab(id)
    } else {
      this.openWindow(tgt)
    }
  }

  handleConfig = (path, value) => {
    if (path.startsWith('poi.tabarea')) {
      if (config.get('poi.tabarea.vertical', false)) {
        this.resizableArea.setSize({
          width: { px: 0, percent: 100 },
          height: this.props.mainPanelHeight,
        })
      } else {
        this.resizableArea.setSize({
          width: this.props.mainPanelWidth,
          height: { px: 0, percent: 100 },
        })
      }
    }
  }

  render() {
    if (this.state.error) {
      return <div />
    }
    const { t } = this.props
    const tabbedPlugins = this.tabbedPlugins()
    const windowModePlugins = this.windowModePlugins()
    const pluginsToList = this.listedPlugins()
    const activePlugin =
      tabbedPlugins.length == 0
        ? {}
        : tabbedPlugins.find(p => p.packageName === this.props.activePluginName) || tabbedPlugins[0]
    const defaultPluginTitle = (
      <>
        <FontAwesome name="sitemap" /> {t('others:Plugins')}
      </>
    )

    const pluginDropdownContents = (
      <PluginDropdown
        className="plugin-dropdown"
        large={!this.props.useGridMenu}
        grid={this.props.useGridMenu}
      >
        {pluginsToList.length == 0 ? (
          <PluginNonIdealState
            icon="cloud-download"
            title={t('setting:No plugin found')}
            description={t('setting:Install plugins in settings')}
          />
        ) : (
          pluginsToList.map((plugin, index) => {
            const handleClick = plugin.handleClick
              ? plugin.handleClick
              : this.isWindowMode(plugin)
              ? e => this.openWindow(plugin)
              : e => this.handleSelectTab(plugin.id)
            return (
              <PluginDropdownMenuItem
                onClick={handleClick}
                id={this.props.activeMainTab === plugin.id ? '' : plugin.id}
                icon={plugin.displayIcon}
                text={plugin.name}
                key={plugin.id}
              />
            )
          })
        )}
      </PluginDropdown>
    )

    const pluginContents = tabbedPlugins.map(plugin => (
      <PluginWrap key={plugin.id} plugin={plugin} container={PluginAppTabpane} />
    ))

    const windowModePluginContents = windowModePlugins.map(plugin => (
      <PluginWindowWrap
        key={plugin.id}
        plugin={plugin}
        ref={r => (this.windowRefs[plugin.id] = r)}
        closeWindowPortal={e => this.closeWindow(plugin)}
      />
    ))

    const leftPanelNav = (
      <NavTabs
        large
        selectedTabId={
          this.isPluginTab(this.props.activeMainTab) ? 'plugin' : this.props.activeMainTab
        }
        className="top-nav"
        onChange={this.handleSelectTab}
      >
        <Tab
          key="main-view"
          id="main-view"
          className={`nav-tab-${this.props.doubleTabbed ? 3 : 4}`}
        >
          {MAIN_VIEW.displayName}
        </Tab>
        <Tab
          key="ship-view"
          id="ship-view"
          className={`nav-tab-${this.props.doubleTabbed ? 3 : 4}`}
        >
          {SHIP_VIEW.displayName}
        </Tab>
        {this.props.doubleTabbed && (
          <Tab key="settings" id="settings" className="nav-tab-3">
            {SETTINGS_VIEW.displayName}
          </Tab>
        )}

        {/* we're not using fragment because blueprint tabs only reads direct children */}
        {!this.props.doubleTabbed && (
          <Tab key="plugin" id="plugin" className={`nav-tab-${this.props.doubleTabbed ? 3 : 4}`}>
            {(activePlugin || {}).displayName || defaultPluginTitle}
          </Tab>
        )}
        {!this.props.doubleTabbed && (
          <Popover
            minimal
            hasBackdrop
            position={Position.BOTTOM_RIGHT}
            content={pluginDropdownContents}
            className="nav-tab-8"
            wrapperTagName="div"
            targetTagName="div"
            popoverClassName="plugin-dropdown-container"
            modifiers={pluginDropDownModifier}
          >
            <PluginDropdownButton icon="chevron-down" minimal ref={this.trigger} />
          </Popover>
        )}
        {!this.props.doubleTabbed && (
          <Tab key="settings" id="settings" className="nav-tab-8" width={12.5}>
            <FontAwesome key={0} name="cog" />
          </Tab>
        )}

        <GlobalStyle />
      </NavTabs>
    )

    const leftPanelContent = (
      <TabContentsUnion
        ref={this.props.doubleTabbed ? this.mainTabKeyUnion : this.tabKeyUnion}
        activeTab={this.props.activeMainTab}
      >
        <PoiAppTabpane id={MAIN_VIEW.name} className="main-view poi-app-tabpane" key="main-view">
          <MAIN_VIEW.reactClass />
        </PoiAppTabpane>
        {!this.props.doubleTabbed && pluginContents}
        <ShipViewTabpanel id={SHIP_VIEW.name} className="ship-view poi-app-tabpane" key="ship-view">
          <SHIP_VIEW.reactClass />
        </ShipViewTabpanel>
        <PoiAppTabpane
          id={SETTINGS_VIEW.name}
          className="settings-view poi-app-tabpane"
          key="settings"
        >
          <SETTINGS_VIEW.reactClass />
        </PoiAppTabpane>
      </TabContentsUnion>
    )

    const resizableAreaProps = getResizableAreaProps(this.props)

    const rightPanel = this.props.doubleTabbed && (
      <PoiTabContainer className="poi-tab-container">
        <Popover
          minimal
          hasBackdrop
          popoverClassName="plugin-dropdown-container"
          position={Position.BOTTOM_RIGHT}
          content={pluginDropdownContents}
          className="nav-tab"
          wrapperTagName="div"
          targetTagName="div"
          modifiers={pluginDropDownModifier}
        >
          <PluginDropdownButton
            ref={this.trigger}
            minimal
            large
            icon="chevron-down"
            text={(activePlugin || {}).displayName || defaultPluginTitle}
          />
        </Popover>
        <TabContentsUnion
          ref={this.tabKeyUnion}
          activeTab={pluginContents.length ? this.props.activePluginName : 'no-plugin'}
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
        double={this.props.doubleTabbed}
        vertical={this.props.verticalDoubleTabbed}
        ref={this.resizeContainer}
      >
        <ResizableArea
          ref={ref => (this.resizableArea = ref)}
          className={classNames({
            'width-resize':
              this.props.doubleTabbed && this.props.editable && !this.props.verticalDoubleTabbed,
          })}
          parentContainer={this.resizeContainer.current}
          {...resizableAreaProps}
        >
          <PoiTabContainer className="poi-tab-container">
            {leftPanelNav}
            {leftPanelContent}
            {windowModePluginContents}
          </PoiTabContainer>
        </ResizableArea>
        {this.props.doubleTabbed &&
          (this.props.editable || !this.state.async ? rightPanel : <Async>{rightPanel}</Async>)}
      </PoiTabsContainer>
    )
  }
}
