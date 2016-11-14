import classNames from 'classnames'
import { connect } from 'react-redux'
import React, { Component, Children, PropTypes } from 'react'
import FontAwesome from 'react-fontawesome'
import { Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'
import { isEqual, omit, get } from 'lodash'
import shallowEqual from 'fbjs/lib/shallowEqual'
import shallowCompare from 'react-addons-shallow-compare'

//import PluginManager from './services/plugin-manager'
import settings from './components/settings'
import mainview from './components/main'
import shipview from './components/ship'
import PluginWrap from './plugin-wrapper'

import isInGame from 'views/utils/game-utils'

const {i18n, dbg} = window
const __ = i18n.others.__.bind(i18n.others)




const TabContentsUnion = connect(
  (state) => ({
    enableTransition: get(state.config, 'poi.transition.enable', true),
  }),
  undefined,
  undefined,
  {pure: false, withRef: true}
)(class tabContentsUnion extends Component {
  constructor(props) {
    super(props)
    this.state = {
      nowKey: null,
      preKey: null,
    }
  }
  static propTypes = {
    enableTransition: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    onChange: PropTypes.func,
  }
  shouldComponentUpdate(nextProps, nextState) {
    return !shallowEqual(omit(this.props, ['children']), omit(nextProps, ['children']))
      || !shallowEqual(this.state, nextState)
      || !isEqual(this.childrenKey(this.props.children), this.childrenKey(nextProps.children))
  }
  componentDidMount() {
    window.addEventListener('TabContentsUnion.show', this.handleShowEvent)
  }
  componentWillUnmount() {
    window.removeEventListener('TabContentsUnion.show', this.handleShowEvent)
  }
  handleShowEvent = (e) => {
    this.setNewKey(e.detail.key)
  }
  childrenKey = (children) => {
    return Children.map(children, (child) => child.key).filter(Boolean)
  }
  findChildByKey = (children, key) => {
    return Children.map(children,
      (child) => child.key === key ? child : null).filter(Boolean)[0]
  }
  setNewKey = (nxtKey, force=false) => {
    const nxtChild = this.findChildByKey(this.props.children, nxtKey)
    const preKey = this.state.nowKey
    if (!nxtChild)
      return
    if (!force) {
      const nowKey = this.state.nowKey || (this.props.children[0] || {}).key
      if (nowKey && nxtKey === nowKey)
        return
    }
    this.setState({
      nowKey: nxtKey,
      preKey: preKey,
    })
    if (this.props.onChange)
      this.props.onChange(nxtKey)
    if (nxtChild.props.onSelected) {
      nxtChild.props.onSelected(nxtKey)
    }
  }
  activeKey = () => {
    return this.state.nowKey || (this.props.children[0] || {}).key
  }
  prevKey = () => {
    return this.state.preKey || (this.props.children[0] || {}).key
  }
  setTabShow = (key) => {
    Children.forEach(this.props.children, (child) => {
      if (child.key === key)
        this.setNewKey(key)
    })
  }
  setTabOffset = (offset) => {
    if (this.props.children == null)
      return
    const nowKey = this.activeKey()
    const childrenCount = Children.count(this.props.children)
    Children.forEach(this.props.children, (child, index) => {
      if (child.key == nowKey) {
        const nextIndex = (index+offset+childrenCount) % childrenCount
        Children.forEach(this.props.children, (child_, index_) => {
          if (index_ == nextIndex)
            this.setNewKey(child_.key)
        })
      }
    })
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
})

let lockedTab = false

export default connect(
  (state) => ({
    plugins: state.plugins,
    doubleTabbed: get(state.config, 'poi.tabarea.double', false),
    useGridMenu: get(state.config, 'poi.tabarea.grid', navigator.maxTouchPoints !== 0),
  }),
  undefined,
  undefined,
  {pure: false}
)(class ControlledTabArea extends Component {
  static propTypes = {
    plugins: PropTypes.array.isRequired,
    doubleTabbed: PropTypes.bool.isRequired,
    useGridMenu: PropTypes.bool.isRequired,
  }
  static childContextTypes = {
    selectTab: PropTypes.func.isRequired,
    selectFleet: PropTypes.func.isRequired,
  }
  constructor(props) {
    super(props)
    this.state = {
      activeMainTab: 'mainView',
      activePluginName: null,
      // Don't pass activeFleetId via context, see https://github.com/facebook/react/issues/2517
      activeFleetId: 0,
    }
  }
  getChildContext() {
    return {
      selectTab: this.selectTab,
      selectFleet: this.selectFleet,
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }
  componentWillUpdate(nextProps, nextState) {
    this.nowTime = (new Date()).getTime()
  }
  componentDidUpdate(prevProps, prevState) {
    const cur = (new Date()).getTime()
    dbg.extra('moduleRenderCost').log(`the cost of tab-module's render: ${cur-this.nowTime}ms`)
  }
  selectTab = (key) => {
    if (key == null)
      return
    const event = new CustomEvent('TabContentsUnion.show', {
      bubbles: true,
      cancelable: false,
      detail: {
        key: key,
      },
    })
    window.dispatchEvent(event)
  }
  selectFleet = (fleetId) => {
    this.setState({activeFleetId: fleetId})
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
    let key, isPlugin
    switch (num) {
    case 1:
      key = 'mainView'
      break
    case 2:
      key = 'shipView'
      break
    default:
      key = (this.props.plugins[num-3] || {}).packageName
      isPlugin = key != null ? null : 'plugin'
      break
    }
    this.selectTab(key)
    if (!this.props.doubleTabbed)
      this.selectTab(isPlugin)
  }
  handleShiftTabKeyDown = () => {
    this.refs.tabKeyUnion.getWrappedInstance().setTabOffset(-1)
  }
  handleTabKeyDown = () => {
    this.refs.tabKeyUnion.getWrappedInstance().setTabOffset(1)
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
  componentWillReceiveProps(nextProps) {
    if (nextProps.doubleTabbed != this.props.doubleTabbed)
      this.setState({
        activeMainTab: 'mainView',
      })
  }
  componentDidMount() {
    this.handleKeyDown()
    window.addEventListener('game.start', this.handleKeyDown)
    window.openSettings = this.handleCmdCommaKeyDown
  }
  componentWillUnmount() {
    window.removeEventListener('game.start', this.handleKeyDown)
  }
  // All displaying plugins
  listedPlugins = () => {
    return this.props.plugins.filter((plugin) =>
      plugin.enabled &&
      (plugin.handleClick || plugin.windowURL || plugin.reactClass)
    )
  }
  // All non-new-window displaying plugins
  tabbedPlugins = () => {
    return this.props.plugins.filter((plugin) =>
      plugin.enabled &&
      !plugin.handleClick &&
      !plugin.windowURL &&
      plugin.reactClass
    )
  }
  render() {
    const navClass = classNames({
      'grid-menu': this.props.useGridMenu,
    })
    const tabbedPlugins = this.tabbedPlugins()
    const activePlugin = tabbedPlugins.length == 0 ? {} :
      tabbedPlugins.find((p) => p.packageName === this.state.activePluginName) || tabbedPlugins[0]
    const activePluginName = activePlugin.packageName
    const defaultPluginTitle = <span><FontAwesome name='sitemap' />{__(' Plugins')}</span>
    const pluginDropdownContents = this.props.plugins.length == 0 ? (
      <MenuItem key={1002} disabled>
        {window.i18n.setting.__("Install plugins in settings")}
      </MenuItem>
    ) : (
      this.listedPlugins().map((plugin, index) =>
        <MenuItem key={plugin.id} eventKey={this.state.activeMainTab === plugin.id ? '' : plugin.id} onSelect={plugin.handleClick}>
          {plugin.displayName}
        </MenuItem>
      )
    )
    const pluginContents = this.tabbedPlugins().map((plugin) =>
      <PluginWrap
        key={plugin.id}
        plugin={plugin}
        onSelected={(key) => this.setState({activePluginName: key})}
      />
    )

    return !this.props.doubleTabbed ? (
      <div>
        <Nav bsStyle="tabs" activeKey={this.state.activeMainTab} id="top-nav" className={navClass}
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
        <TabContentsUnion ref='tabKeyUnion'
          onChange={(key) => this.setState({activeMainTab: key})}>
          <div id={mainview.name} className="poi-app-tabpane" key='mainView'>
            <mainview.reactClass activeFleetId={this.state.activeFleetId} />
          </div>
          <div id={shipview.name} className="poi-app-tabpane" key='shipView'>
            <shipview.reactClass activeFleetId={this.state.activeFleetId} />
          </div>
          {pluginContents}
          <div id={settings.name} className="poi-app-tabpane" key='settings'>
            <settings.reactClass />
          </div>
        </TabContentsUnion>
      </div>
    ) : (
      <div className='poi-tabs-container'>
        <div className="no-scroll">
          <Nav bsStyle="tabs" activeKey={this.state.activeMainTab} onSelect={this.handleSelectTab} id='split-main-nav'>
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
          <TabContentsUnion
            onChange={(key) => this.setState({activeMainTab: key})}>
            <div id={mainview.name} className="poi-app-tabpane" key='mainView'>
              <mainview.reactClass activeMainTab={this.state.activeMainTab} activeFleetId={this.state.activeFleetId} />
            </div>
            <div id={shipview.name} className="poi-app-tabpane" key='shipView'>
              <shipview.reactClass activeMainTab={this.state.activeMainTab} activeFleetId={this.state.activeFleetId} />
            </div>
            <div id={settings.name} className="poi-app-tabpane" key='settings'>
              <settings.reactClass activeMainTab={this.state.activeMainTab}/>
            </div>
          </TabContentsUnion>
        </div>
        <div className="no-scroll">
          <Nav bsStyle="tabs" onSelect={this.handleSelectTab} id='split-plugin-nav' className={navClass}>
            <NavDropdown id='plugin-dropdown' pullRight onSelect={this.handleSelectDropdown}
              title={(activePlugin || {}).displayName || defaultPluginTitle}>
            {pluginDropdownContents}
            </NavDropdown>
          </Nav>
          <TabContentsUnion ref='tabKeyUnion'>
            {pluginContents}
          </TabContentsUnion>
        </div>
      </div>
    )
  }
})
