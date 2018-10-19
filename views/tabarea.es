import classNames from 'classnames'
import { connect } from 'react-redux'
import React, { Component, Children, PureComponent, unstable_AsyncMode as Async } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { Tab, Tabs, Popover, Button, Position, NonIdealState } from '@blueprintjs/core'
import { isEqual, omit, get } from 'lodash'
import { ResizableArea } from 'react-resizable-area'
import shallowEqual from 'fbjs/lib/shallowEqual'
import { translate } from 'react-i18next'
import { remote } from 'electron'
import styled, { css } from 'styled-components'

import * as settings from './components/settings'
import * as mainview from './components/main'
import * as shipview from './components/ship'
import { PluginWrap } from './plugin-wrapper'
import { PluginWindowWrap } from './plugin-window-wrapper'
import { isInGame } from 'views/utils/game-utils'

const { config, dispatch, ipc } = window

const emptyObj = {}


const PoiTabContents = styled.div`
  display: -webkit-box;
  flex: 1 0 0;
  overflow: scroll;
  position: relative;
`

const PoiTabChildSizer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  left: 0;
  margin-right: -100%;
  overflow: hidden;
  padding: 0;
  top: 0;
  width: 100%;
`

const PoiTabChildPositioner = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  opacity: 1;
  position: relative;
  width: 100%;
  padding: 0 6px;
  ${({transition}) => transition && css`
    transition: 0.35s ease-in-out;
  `}
  ${({transparent}) => transparent && css`
    opacity: 0;
    pointer-events: none;
  `}
`

const PoiAppTabpane = styled.div`
  flex: 1;
  height: 100%;
  overflow-y: scroll;
  width: 100%;
`

const PoiTabsContainer = styled.div`
  display: flex;
  height: 100%;
  ${({double, vertical}) => double && vertical && css`
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

const PluginDropdown = styled.div`
  overflow: auto;
`

const PluginDropdownButton = styled(Button)`
  width: 100%;
`

const PluginDropdownMenuItem = styled.div`
  display: block;
  float: left;
  width: calc(100% / 3);

  a {
    display: flex;
    min-height: 5em;
    overflow: hidden;
    padding-top: 1em;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
    flex-direction: column;
    align-items: center;
    color: white;
  }

  a:hover {
    background-color: #46a2dd !important;
    text-decoration: none;
    color: white;
  }

  [class*="fa-"].svg-inline--fa {
    display: block;
    font-size: 175%;
  }
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
`

@connect(
  (state) => ({
    enableTransition: get(state.config, 'poi.transition.enable', true),
  }),
  undefined,
  undefined,
  {pure: true, withRef: true}
)
class TabContentsUnion extends Component {
  static propTypes = {
    enableTransition: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    activeTab: PropTypes.string.isRequired,
  }
  shouldComponentUpdate(nextProps, nextState) {
    return !shallowEqual(omit(this.props, ['children']), omit(nextProps, ['children']))
      || !shallowEqual(this.state, nextState)
      || !isEqual(this.childrenKey(this.props.children), this.childrenKey(nextProps.children))
  }
  componentDidUpdate() {
    this.prevTab = this.props.activeTab
  }
  childrenKey = (children) => {
    return Children.map(children, (child) => child.key).filter(Boolean)
  }
  findChildByKey = (children, key) => {
    return Children.map(children,
      (child) => child.key === key ? child : null).filter(Boolean)[0]
  }
  activeKey = () => {
    return this.props.activeTab || (this.props.children[0] || {}).key
  }
  prevKey = () => {
    return this.prevTab || (this.props.children[0] || {}).key
  }
  render() {
    let onTheLeft = true
    const activeKey = this.activeKey()
    const prevKey = this.prevKey()
    return (
      <PoiTabContents className="poi-tab-contents">
        {
          Children.map(this.props.children, (child, index) => {
            if (child.key === activeKey)
              onTheLeft = false
            const positionLeft = child.key === activeKey ?  '0%'
              : onTheLeft ? '-100%' : '100%'
            return (
              <PoiTabChildSizer className="poi-tab-child-sizer">
                <PoiTabChildPositioner
                  className="poi-tab-child-positioner"
                  transition={(child.key === activeKey || child.key === prevKey) && this.props.enableTransition}
                  transparent={child.key !== activeKey}
                  style={{transform: `translate3d(${positionLeft}, 0, 0)`}}>
                  {child}
                </PoiTabChildPositioner>
              </PoiTabChildSizer>
            )
          })
        }
      </PoiTabContents>
    )
  }
}

let lockedTab = false

const dispatchTabChangeEvent = (tabInfo, autoSwitch=false) =>
  dispatch({
    type: '@@TabSwitch',
    tabInfo,
    autoSwitch,
  })

@translate(['setting', 'others'])
@connect((state) => ({
  plugins: state.plugins,
  doubleTabbed: get(state.config, 'poi.tabarea.double', false),
  verticalDoubleTabbed: get(state.config, 'poi.tabarea.vertical', false),
  useGridMenu: get(state.config, 'poi.tabarea.grid', navigator.maxTouchPoints !== 0),
  activeMainTab: get(state.ui, 'activeMainTab', 'main-view'),
  activePluginName: get(state.ui, 'activePluginName', ''),
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
  selectTab = (key, autoSwitch=false) => {
    if (key == null)
      return
    let tabInfo = {}
    const mainTabKeyUnion = this.props.doubleTabbed ? this.mainTabKeyUnion : this.tabKeyUnion
    const mainTabInstance = mainTabKeyUnion.getWrappedInstance()
    if (mainTabInstance.findChildByKey(mainTabInstance.props.children, key)) {
      tabInfo = {
        ...tabInfo,
        activeMainTab: key,
      }
    }
    const tabKeyUnionInstance = this.tabKeyUnion.getWrappedInstance()
    if ((!['main-view', 'ship-view', 'settings'].includes(key)) &&
      tabKeyUnionInstance.findChildByKey(tabKeyUnionInstance.props.children, key)) {
      tabInfo = {
        ...tabInfo,
        activePluginName: key,
      }
    }
    dispatchTabChangeEvent(tabInfo, autoSwitch)
  }
  handleSelectTab = (key) => {
    this.selectTab(key)
  }
  handleSelectDropdown = (e, key) => {
    this.selectTab(key)
  }
  handleCtrlOrCmdTabKeyDown = () => {
    this.selectTab('main-view')
  }
  handleCmdCommaKeyDown = () => {
    this.selectTab('settings')
  }
  handleCtrlOrCmdNumberKeyDown = (num) => {
    let key
    switch (num) {
    case 1:
      key = 'main-view'
      break
    case 2:
      key = 'ship-view'
      break
    default:
      key = (this.props.plugins[num-3] || {}).packageName
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
  handleSetTabOffset = (offset) => {
    const tabKeyUnionInstance = this.tabKeyUnion.getWrappedInstance()
    const childrenKey = tabKeyUnionInstance.childrenKey(tabKeyUnionInstance.props.children)
    const nowIndex = childrenKey.indexOf(this.props.doubleTabbed ? this.props.activePluginName : this.props.activeMainTab)
    this.selectTab(childrenKey[(nowIndex + childrenKey.length + offset) % childrenKey.length])
  }
  handleKeyDown = () => {
    if (this.listener != null)
      return
    this.listener = true
    window.addEventListener('keydown', async (e) => {
      const isingame = await isInGame()
      if ((document.activeElement.tagName === 'WEBVIEW' && !isingame) || document.activeElement.tagName === 'INPUT') {
        return
      }
      if (e.keyCode == 9) {
        e.preventDefault()
        if (lockedTab && e.repeat)
          return
        lockedTab = true
        setTimeout(() => {lockedTab = false} , 200)
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
  handleResponse = (e) => {
    if (config.get('poi.autoswitch.enabled', true)) {
      let toSwitch
      if (config.get('poi.autoswitch.main', true)) {
        if (['/kcsapi/api_port/port',
          '/kcsapi/api_get_member/ndock',
          '/kcsapi/api_get_member/kdock',
          '/kcsapi/api_get_member/questlist',
        ].includes(e.detail.path)) {
          toSwitch = 'main-view'
        }
        if (['/kcsapi/api_get_member/preset_deck'].includes(e.detail.path)) {
          toSwitch = 'ship-view'
        }
      }
      for (const [id, enabled, switchPluginPath] of this.props.plugins.map(plugin => [plugin.id, plugin.enabled, plugin.switchPluginPath || []])) {
        for (const switchPath of switchPluginPath) {
          if ((config.get(`poi.autoswitch.${id}`, true) && enabled) && (switchPath === e.detail.path || (switchPath.path === e.detail.path && switchPath.valid && switchPath.valid()))) {
            toSwitch = id
          }
        }
      }
      this.selectTab(toSwitch, true)
    }
  }
  handleTouchbar = (props) => {
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
  // All displaying plugins
  listedPlugins = () => {
    return this.props.plugins.filter((plugin) =>
      plugin.enabled &&
      (plugin.handleClick || plugin.windowURL || plugin.reactClass)
    )
  }
  // All non-new-window displaying plugins
  tabbedPlugins = () => this.props.plugins.filter((plugin) =>
    plugin.enabled &&
    !plugin.handleClick &&
    !plugin.windowURL &&
    !this.isWindowMode(plugin) &&
    plugin.reactClass
  )
  isWindowMode = plugin => this.props.windowmode[plugin.id] != null ? this.props.windowmode[plugin.id] : plugin.windowMode
  windowModePlugins = () => this.props.plugins.filter(plugin =>
    plugin.enabled && this.isWindowMode(plugin) && this.state.openedWindow[plugin.id]
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
        this.resizableArea.setSize({ width: { px: 0, percent: 100 }, height: this.props.mainPanelHeight })
      } else {
        this.resizableArea.setSize({ width: this.props.mainPanelWidth, height: { px: 0, percent: 100 } })
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
    const activePlugin = tabbedPlugins.length == 0 ? {} :
      tabbedPlugins.find((p) => p.packageName === this.props.activePluginName) || tabbedPlugins[0]
    const activePluginName = activePlugin.packageName
    const defaultPluginTitle = <span><FontAwesome name="sitemap" /> {t('others:Plugins')}</span>
    const pluginDropdownContents = (
      <PluginDropdown className="plugin-dropdown">
        {
          this.props.plugins.length == 0 ? (
            <PluginNonIdealState
              icon="cloud-download"
              title={t('setting:No plugin found')}
              description={t('setting:Install plugins in settings')}
            />
          ) : (
            this.listedPlugins().map((plugin, index) => {
              const handleClick = plugin.handleClick ?
                plugin.handleClick :
                this.isWindowMode(plugin) ?
                  e => this.openWindow(plugin) :
                  e => {
                    this.trigger.current.buttonRef.click()
                    this.handleSelectTab(plugin.id)
                  }
              return (
                <PluginDropdownMenuItem key={plugin.id}>
                  <a id={this.props.activeMainTab === plugin.id ? '' : plugin.id} onClick={handleClick} href="#">
                    {plugin.displayName}
                  </a>
                </PluginDropdownMenuItem>
              )
            })
          )
        }
      </PluginDropdown>
    )
    const pluginContents = tabbedPlugins.map(plugin =>
      <PluginWrap
        key={plugin.id}
        plugin={plugin}
      />
    )
    const windowModePluginContents = windowModePlugins.map(plugin =>
      <PluginWindowWrap
        key={plugin.id}
        plugin={plugin}
        ref={r => this.windowRefs[plugin.id] = r}
        closeWindowPortal={e => this.closeWindow(plugin)}
      />
    )

    const firstPanelNav = !this.props.doubleTabbed ? (
      <NavTabs large
        selectedTabId={this.props.activeMainTab}
        className="top-nav"
        onChange={this.handleSelectTab}>
        <Tab key="main-view" id="main-view" className="nav-tab-4">
          {mainview.displayName}
        </Tab>
        <Tab key="ship-view" id="ship-view" className="nav-tab-4">
          {shipview.displayName}
        </Tab>
        <Tab key="plugin" id={activePluginName} onSelect={this.handleSelect} className="nav-tab-4">
          {(activePlugin || {}).displayName || defaultPluginTitle}
        </Tab>
        <Popover
          minimal
          hasBackdrop
          position={Position.BOTTOM_RIGHT}
          content={pluginDropdownContents}
          className="nav-tab-8"
          wrapperTagName="div"
          targetTagName="div">
          <PluginDropdownButton
            icon="chevron-down"
            minimal
            ref={this.trigger} />
        </Popover>
        <Tab key="settings" id="settings" className="nav-tab-8" width={12.5}>
          <FontAwesome key={0} name="cog" />
        </Tab>
      </NavTabs>
    ) : (
      <NavTabs large
        selectedTabId={this.props.activeMainTab}
        onChange={this.handleSelectTab}
        className="top-nav">
        <Tab key="main-view" id="main-view" className="nav-tab-3">
          {mainview.displayName}
        </Tab>
        <Tab key="ship-view" id="ship-view" className="nav-tab-3">
          {shipview.displayName}
        </Tab>
        <Tab key="settings" id="settings" className="nav-tab-3">
          {settings.displayName}
        </Tab>
      </NavTabs>
    )

    const firstPanelCnt = !this.props.doubleTabbed ? (
      <TabContentsUnion
        ref={ref => {
          if (this.props.doubleTabbed) {
            this.mainTabKeyUnion = ref
          } else {
            this.tabKeyUnion = ref
          }
        }}
        activeTab={this.props.activeMainTab}>
        <PoiAppTabpane id={mainview.name} className="main-view poi-app-tabpane" key="main-view">
          <mainview.reactClass activeMainTab={this.props.activeMainTab} />
        </PoiAppTabpane>
        <PoiAppTabpane id={shipview.name} className="ship-view poi-app-tabpane" key="ship-view">
          <shipview.reactClass activeMainTab={this.props.activeMainTab} />
        </PoiAppTabpane>
        { pluginContents }
        <PoiAppTabpane id={settings.name} className="settings-view poi-app-tabpane" key="settings">
          <settings.reactClass activeMainTab={this.props.activeMainTab}/>
        </PoiAppTabpane>
      </TabContentsUnion>
    ) : (
      <TabContentsUnion
        ref={ref => {
          if (this.props.doubleTabbed) {
            this.mainTabKeyUnion = ref
          } else {
            this.tabKeyUnion = ref
          }
        }}
        activeTab={this.props.activeMainTab}>
        <PoiAppTabpane id={mainview.name} className="main-view poi-app-tabpane" key="main-view">
          <mainview.reactClass activeMainTab={this.props.activeMainTab} />
        </PoiAppTabpane>
        <PoiAppTabpane id={shipview.name} className="ship-view poi-app-tabpane" key="ship-view">
          <shipview.reactClass activeMainTab={this.props.activeMainTab} />
        </PoiAppTabpane>
        <PoiAppTabpane id={settings.name} className="settings-view poi-app-tabpane" key="settings">
          <settings.reactClass activeMainTab={this.props.activeMainTab}/>
        </PoiAppTabpane>
      </TabContentsUnion>
    )
    if (process.platform === 'darwin') {
      const { touchBarTabinit } = remote.require('./lib/touchbar')
      touchBarTabinit(t('main:Overview'), t('main:Fleet'), activePlugin.name || t('others:Plugins'), this.props.activeMainTab, t('others:Plugins'))
    }
    const resizableAreaProps = !this.props.doubleTabbed ? ({
      minimumWidth: {
        px: 0,
        percent: 100,
      },
      defaultWidth: {
        px: 0,
        percent: 50,
      },
      initWidth: this.props.mainPanelWidth,
      minimumHeight: {
        px: 0,
        percent: 100,
      },
      initHeight:{
        px: 0,
        percent: 100,
      },
      disable: {
        width: true,
        height: true,
      },
      onResized: ({ width }) => config.set('poi.tabarea.mainpanelwidth', width),
    }) : this.props.verticalDoubleTabbed ? ({
      className: classNames({ 'height-resize': this.props.editable }),
      minimumWidth: {
        px: 0,
        percent: 100,
      },
      defaultHeight: {
        px: 0,
        percent: 50,
      },
      initHeight: this.props.mainPanelHeight,
      minimumHeight: {
        px: 0,
        percent: 10,
      },
      initWidth:{
        px: 0,
        percent: 100,
      },
      disable: {
        width: true,
        height: !this.props.editable,
      },
      onResized: ({ height }) => config.set('poi.tabarea.mainpanelheight', height),
    }) : ({
      className: classNames({ 'width-resize': this.props.editable }),
      minimumWidth: {
        px: 0,
        percent: 10,
      },
      defaultWidth: {
        px: 0,
        percent: 50,
      },
      initWidth: this.props.mainPanelWidth,
      minimumHeight: {
        px: 0,
        percent: 100,
      },
      initHeight:{
        px: 0,
        percent: 100,
      },
      disable: {
        width: !this.props.editable,
        height: true,
      },
      onResized: ({ width }) => config.set('poi.tabarea.mainpanelwidth', width),
    })

    const inner = (
      <PoiTabContainer className="poi-tab-container no-scroll">
        <Popover
          minimal
          hasBackdrop
          backdropProps={{
            className: 'plugin-dropdown-backdrop',
          }}
          position={Position.BOTTOM_RIGHT}
          content={pluginDropdownContents}
          className="nav-tab"
          wrapperTagName="div"
          targetTagName="div">
          <PluginDropdownButton
            ref={this.trigger}
            minimal
            large
            icon="chevron-down"
            text={(activePlugin || {}).displayName || defaultPluginTitle} />
        </Popover>
        <TabContentsUnion ref={(ref) => { this.tabKeyUnion = ref }}
          activeTab={this.props.activePluginName}>
          {pluginContents}
        </TabContentsUnion>
      </PoiTabContainer>
    )

    return (
      <PoiTabsContainer
        className="poi-tabs-container"
        double={this.props.doubleTabbed}
        vertical={this.props.verticalDoubleTabbed}
        ref={this.resizeContainer}>
        <ResizableArea
          ref={ref => this.resizableArea = ref}
          className={classNames({ 'width-resize': this.props.doubleTabbed && this.props.editable && !this.props.verticalDoubleTabbed })}
          parentContainer={this.resizeContainer.current}
          {...resizableAreaProps}
        >
          <PoiTabContainer className="poi-tab-container no-scroll">
            { firstPanelNav }
            { firstPanelCnt }
            { windowModePluginContents }
          </PoiTabContainer>
        </ResizableArea>
        {
          this.props.doubleTabbed && (
            this.props.editable || !this.state.async ? inner : <Async>
              {inner}
            </Async>
          )
        }
      </PoiTabsContainer>
    )
  }
}
