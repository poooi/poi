import classNames from 'classnames'
import { connect } from 'react-redux'
import React, { Component, Children, PureComponent } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'
import { isEqual, omit, get } from 'lodash'
import { ResizableArea } from 'react-resizable-area'
import shallowEqual from 'fbjs/lib/shallowEqual'
import { translate } from 'react-i18next'

import * as settings from './components/settings'
import * as mainview from './components/main'
import * as shipview from './components/ship'
import { PluginWrap } from './plugin-wrapper'
import { PluginWindowWrap } from './plugin-window-wrapper'
import { isInGame } from 'views/utils/game-utils'

const { config, dispatch } = window

const emptyObj = {}

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
  componentWillUpdate(nextProps, nextState) {
    if (nextProps.activeTab != this.props.activeTab) {
      this.prevTab = this.props.activeTab
    }
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
      <div className='poi-tab-contents'>
        {
          Children.map(this.props.children, (child, index) => {
            if (child.key === activeKey)
              onTheLeft = false
            const positionLeft = child.key === activeKey ?  '0%'
              : onTheLeft ? '-100%' : '100%'
            const tabClassName = classNames("poi-tab-child-positioner", {
              'poi-tab-child-positioner-transition': (child.key === activeKey || child.key === prevKey) && this.props.enableTransition,
              'transparent': child.key !== activeKey,
            })
            return (
              <div className='poi-tab-child-sizer'>
                <div className={tabClassName}
                  style={{transform: `translateX(${positionLeft})`}}>
                  {child}
                </div>
              </div>
            )
          })
        }
      </div>
    )
  }
}

let lockedTab = false

@translate(['setting', 'others'])
@connect((state) => ({
  plugins: state.plugins,
  doubleTabbed: get(state.config, 'poi.tabarea.double', false),
  useGridMenu: get(state.config, 'poi.tabarea.grid', navigator.maxTouchPoints !== 0),
  activeMainTab: get(state.ui, 'activeMainTab', 'mainView'),
  activePluginName: get(state.ui, 'activePluginName', ''),
  mainPanelWidth: get(state.config, 'poi.tabarea.mainpanelwidth', { px: 0, percent: 50 }),
  editable: get(state.config, 'poi.layouteditable', false),
  windowmode: get(state.config, 'poi.windowmode', emptyObj),
}))
export class ControlledTabArea extends PureComponent {
  static propTypes = {
    plugins: PropTypes.array.isRequired,
    doubleTabbed: PropTypes.bool.isRequired,
    useGridMenu: PropTypes.bool.isRequired,
    activeMainTab: PropTypes.string.isRequired,
    activePluginName: PropTypes.string.isRequired,
    mainPanelWidth: PropTypes.shape({
      px: PropTypes.number,
      percent: PropTypes.number,
    }),
    editable: PropTypes.bool.isRequired,
  }
  state = {
    openedWindow: {},
  }
  dispatchTabChangeEvent = (tabInfo, autoSwitch=false) =>
    dispatch({
      type: '@@TabSwitch',
      tabInfo,
      autoSwitch,
    })
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
    if ((!['mainView', 'shipView', 'settings'].includes(key)) &&
      tabKeyUnionInstance.findChildByKey(tabKeyUnionInstance.props.children, key)) {
      tabInfo = {
        ...tabInfo,
        activePluginName: key,
      }
    }
    this.dispatchTabChangeEvent(tabInfo, autoSwitch)
  }
  handleSelectTab = (key) => {
    this.selectTab(key)
  }
  handleSelectDropdown = (e, key) => {
    this.selectTab(key)
  }
  handleCtrlOrCmdTabKeyDown = () => {
    this.selectTab('mainView')
  }
  handleCmdCommaKeyDown = () => {
    this.selectTab('settings')
  }
  handleCtrlOrCmdNumberKeyDown = (num) => {
    let key
    switch (num) {
    case 1:
      key = 'mainView'
      break
    case 2:
      key = 'shipView'
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
          toSwitch = 'mainView'
        }
        if (['/kcsapi/api_get_member/preset_deck'].includes(e.detail.path)) {
          toSwitch = 'shipView'
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
  componentWillReceiveProps(nextProps) {
    if (nextProps.doubleTabbed != this.props.doubleTabbed)
      this.dispatchTabChangeEvent({
        activeMainTab: 'mainView',
      })
  }
  componentDidMount() {
    this.handleKeyDown()
    window.addEventListener('game.start', this.handleKeyDown)
    window.addEventListener('game.response', this.handleResponse)
    window.openSettings = this.handleCmdCommaKeyDown
  }
  componentWillUnmount() {
    window.removeEventListener('game.start', this.handleKeyDown)
    window.removeEventListener('game.response', this.handleResponse)
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
    !this.props.windowmode[plugin.id] &&
    plugin.reactClass
  )
  windowModePlugins = () => this.props.plugins.filter(plugin =>
    this.props.windowmode[plugin.id] && this.state.openedWindow[plugin.id]
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
      window.dispatchEvent(new Event(`${plugin.id}-focus`))
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
  render() {
    const { t } = this.props
    const navClass = classNames('top-nav', {
      'grid-menu': this.props.useGridMenu,
    })
    const tabbedPlugins = this.tabbedPlugins()
    const windowModePlugins = this.windowModePlugins()
    const activePlugin = tabbedPlugins.length == 0 ? {} :
      tabbedPlugins.find((p) => p.packageName === this.props.activePluginName) || tabbedPlugins[0]
    const activePluginName = activePlugin.packageName
    const defaultPluginTitle = <span><FontAwesome name='sitemap' /> {t('others:Plugins')}</span>
    const pluginDropdownContents = this.props.plugins.length == 0 ? (
      <MenuItem key={1002} disabled>
        {t('setting:Install plugins in settings')}
      </MenuItem>
    ) : (
      this.listedPlugins().map((plugin, index) => {
        const handleClick = plugin.handleClick ?
          plugin.handleClick :
          this.props.windowmode[plugin.id] ?
            e => this.openWindow(plugin) :
            undefined
        return (
          <MenuItem key={plugin.id} eventKey={this.props.activeMainTab === plugin.id ? '' : plugin.id} onSelect={handleClick}>
            {plugin.displayName}
          </MenuItem>
        )
      })
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
        closeWindowPortal={e => this.closeWindow(plugin)}
      />
    )

    const firstPanelNav = !this.props.doubleTabbed ? (
      <Nav bsStyle="tabs" activeKey={this.props.activeMainTab} id="top-nav" className={navClass}
        onSelect={this.handleSelectTab}>
        <NavItem key='mainView' eventKey='mainView'>
          {mainview.displayName}
        </NavItem>
        <NavItem key='shipView' eventKey='shipView'>
          {shipview.displayName}
        </NavItem>
        <NavItem key='plugin' eventKey={activePluginName} onSelect={this.handleSelect}>
          {(activePlugin || {}).displayName || defaultPluginTitle}
        </NavItem>
        <NavDropdown id='plugin-dropdown' pullRight title=' '
          onSelect={this.handleSelectDropdown}>
          {pluginDropdownContents}
        </NavDropdown>
        <NavItem key='settings' eventKey='settings' className="tab-narrow">
          <FontAwesome key={0} name='cog' />
        </NavItem>
      </Nav>
    ) : (
      <Nav bsStyle="tabs" activeKey={this.props.activeMainTab} onSelect={this.handleSelectTab} id='split-main-nav'>
        <NavItem key='mainView' eventKey='mainView'>
          {mainview.displayName}
        </NavItem>
        <NavItem key='shipView' eventKey='shipView'>
          {shipview.displayName}
        </NavItem>
        <NavItem key='settings' eventKey='settings'>
          {settings.displayName}
        </NavItem>
      </Nav>
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
        <div id={mainview.name} className="MainView poi-app-tabpane" key='mainView'>
          <mainview.reactClass activeMainTab={this.props.activeMainTab} />
        </div>
        <div id={shipview.name} className="ShipView poi-app-tabpane" key='shipView'>
          <shipview.reactClass activeMainTab={this.props.activeMainTab} />
        </div>
        { pluginContents }
        <div id={settings.name} className="SettingsView poi-app-tabpane" key='settings'>
          <settings.reactClass activeMainTab={this.props.activeMainTab}/>
        </div>
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
        <div id={mainview.name} className="MainView poi-app-tabpane" key='mainView'>
          <mainview.reactClass activeMainTab={this.props.activeMainTab} />
        </div>
        <div id={shipview.name} className="ShipView poi-app-tabpane" key='shipView'>
          <shipview.reactClass activeMainTab={this.props.activeMainTab} />
        </div>
        <div id={settings.name} className="SettingsView poi-app-tabpane" key='settings'>
          <settings.reactClass activeMainTab={this.props.activeMainTab}/>
        </div>
      </TabContentsUnion>
    )

    return (
      <div className={classNames('poi-tabs-container', {
        'poi-tabs-container-doubletabbed': this.props.doubleTabbed,
        'poi-tabs-container-singletabbed': !this.props.doubleTabbed,
      })} ref={r => this.setState({ resizeContainer: r })}>
        <ResizableArea
          className={classNames({ 'width-resize': this.props.doubleTabbed && this.props.editable })}
          minimumWidth={{ px: 0, percent: this.props.doubleTabbed ? 10 : 100 }}
          defaultWidth={{ px: 0, percent: 50 }}
          initWidth={this.props.mainPanelWidth}
          minimumHeight={{ px: 0, percent: 100 }}
          initHeight={{ px: 0, percent: 100 }}
          parentContainer={this.state.resizeContainer}
          disable={{ width: !this.props.doubleTabbed || !this.props.editable, height: true }}
          onResized={({ width }) => {
            config.set('poi.tabarea.mainpanelwidth', width)
          }}
        >
          <div className="poi-tab-container no-scroll">
            { firstPanelNav }
            { firstPanelCnt }
            { windowModePluginContents }
          </div>
        </ResizableArea>
        {
          this.props.doubleTabbed && (
            <div className="poi-tab-container no-scroll">
              <Nav bsStyle="tabs" onSelect={this.handleSelectTab} id='split-plugin-nav' className={navClass}>
                <NavDropdown id='plugin-dropdown' pullRight onSelect={this.handleSelectDropdown}
                  title={(activePlugin || {}).displayName || defaultPluginTitle}>
                  {pluginDropdownContents}
                </NavDropdown>
              </Nav>
              <TabContentsUnion ref={(ref) => { this.tabKeyUnion = ref }}
                activeTab={this.props.activePluginName}>
                {pluginContents}
              </TabContentsUnion>
            </div>
          )
        }
      </div>
    )
  }
}
