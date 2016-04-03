path = require 'path-extra'
glob = require 'glob'
Promise = require 'bluebird'
__ = i18n.others.__.bind(i18n.others)
__n = i18n.others.__n.bind(i18n.others)
semver = require 'semver'
fs = require 'fs-extra'
{_, React, ReactBootstrap, FontAwesome} = window
{Nav, NavItem, NavDropdown, MenuItem} = ReactBootstrap
async = Promise.coroutine
classnames = require 'classnames'

PluginWrap = React.createClass
  shouldComponentUpdate: (nextProps, nextState)->
    false
  render: ->
    React.createElement @props.plugin.reactClass

settings = require path.join(ROOT, 'views', 'components', 'settings')
mainview = require path.join(ROOT, 'views', 'components', 'main')
shipview = require path.join(ROOT, 'views', 'components', 'ship')

lockedTab = false

TabContentsUnion = React.createClass
  getInitialState: ->
    nowKey: null
    preKey: null
    enableTransition: config.get 'poi.transition.enable', true
  componentDidMount: ->
    window.addEventListener 'TabContentsUnion.show', @handleShowEvent
    window.addEventListener 'display.transition.change', @handleSetTransition
  componentWillUnmount: ->
    window.removeEventListener 'TabContentsUnion.show', @handleShowEvent
    window.removeEventListener 'display.transition.change', @handleSetTransition
  componentWillReceiveProps: (nextProps) ->
    if !@state.nowKey? && nextProps.children.length != 0
      @setNewKey nextProps.children[0].key, true
  handleShowEvent: (e) ->
    @setNewKey e.detail.key
  handleSetTransition: (e) ->
    @setState
      enableTransition: config.get 'poi.transition.enable', true
  findChildByKey: (key) ->
    _.filter((React.Children.map @props.children,
        (child) -> if child.key == key then child),
      Boolean)[0]
  setNewKey: (nxtKey, force=false) ->
    nxtChild = @findChildByKey nxtKey
    preKey = @state.nowKey
    return if !nxtChild
    if !force
      nowKey = @state.nowKey || @props.children[0]?.key
      return if (nowKey && nxtKey == nowKey)
    @setState
      nowKey: nxtKey
      preKey: preKey
    @props.onChange? nxtKey
    nxtChild.props.onSelected? nxtKey
  activeKey: ->
    @state.nowKey || @props.children[0]?.key
  prevKey: ->
    @state.preKey || @props.children[0]?.key
  setTabShow: (key) ->
    React.Children.forEach @props.children, (child) =>
      if child.key == key
        @setNewKey key
  setTabOffset: (offset) ->
    return if !@props.children?
    nowKey = @activeKey()
    childrenCount = React.Children.count @props.children
    React.Children.forEach @props.children, (child, index) =>
      if child.key == nowKey
        nextIndex = (index+offset+childrenCount) % childrenCount
        # Always use the same method to preserve the definition of index
        React.Children.forEach @props.children, (child_, index_) =>
          if index_ == nextIndex
            @setNewKey child_.key
  render: ->
    onTheLeft = true
    activeKey = @activeKey()
    prevKey = @prevKey()
    <div className='poi-tab-contents'>
      {
        React.Children.map @props.children, (child, index) =>
          if child.key == activeKey
            onTheLeft = false
          positionLeft = if child.key == activeKey
            0
          else if onTheLeft
            -100
          else
            100
          <div className='poi-tab-child-sizer'>
            <div className={classnames "poi-tab-child-positioner",
              'poi-tab-child-positioner-transition': (child.key is activeKey or child.key is prevKey) and @state.enableTransition
              'transparent': child.key isnt activeKey
              }
              style={left: "#{positionLeft}%"}>
              {child}
            </div>
          </div>
      }
    </div>

ControlledTabArea = React.createClass
  getInitialState: ->
    plugins: []
    doubleTabbed: config.get 'poi.tabarea.double', false
  toggleDoubleTabbed: (e) ->
    doubleTabbed = e.detail.doubleTabbed
    @setState {doubleTabbed}
  componentWillUpdate: (nextProps, nextState) ->
    @nowTime = (new Date()).getTime()
  componentDidUpdate: (prevProps, prevState) ->
    cur = (new Date()).getTime()
    dbg.extra('moduleRenderCost').log "the cost of tab-module's render: #{cur-@nowTime}ms"
  cachePluginList: async ->
    plugins = yield PluginManager.getValidPlugins()
    plugins = plugins.filter (plugin) ->
      plugin.show isnt false
    plugins = _.sortBy plugins, 'priority'
    if @isMounted()
      @setState
        plugins: plugins
  selectTab: (key) ->
    return if !key?
    event = new CustomEvent 'TabContentsUnion.show',
      bubbles: true
      cancelable: false
      detail:
        key: key
    window.dispatchEvent event
  handleSelectTab: (key) ->
    @selectTab key
  handleSelectDropdown: (e, key) ->
    @selectTab key
  handleCtrlOrCmdTabKeyDown: ->
    @selectTab 'mainView'
  handleCmdCommaKeyDown: ->
    @selectTab 'settings'
  handleCtrlOrCmdNumberKeyDown: (num) ->
    switch num
      when 1
        key = 'mainView'
      when 2
        key = 'shipView'
      else
        key = @state.plugins[num-3]?.packageName
        isPlugin = if key? then 'plugin'
    @selectTab key
    @selectTab isPlugin if !@state.doubleTabbed
  handleShiftTabKeyDown: ->
    @refs.tabKeyUnion.setTabOffset -1
  handleTabKeyDown: ->
    @refs.tabKeyUnion.setTabOffset 1
  handleKeyDown: ->
    return if @listener?
    @listener = true
    window.addEventListener 'keydown', (e) =>
      if e.keyCode is 9
        e.preventDefault()
        return if lockedTab and e.repeat
        lockedTab = true
        setTimeout ->
          lockedTab = false
        , 200
        if e.ctrlKey or e.metaKey
          @handleCtrlOrCmdTabKeyDown()
        else if e.shiftKey
          @handleShiftTabKeyDown()
        else
          @handleTabKeyDown()
      else if e.ctrlKey or e.metaKey
        if e.keyCode >= '1'.charCodeAt() and e.keyCode <= '9'.charCodeAt()
          @handleCtrlOrCmdNumberKeyDown(e.keyCode - 48)
        else if e.keyCode is '0'.charCodeAt()
          @handleCtrlOrCmdNumberKeyDown 10
  handleTabChange: (e) ->
    @selectTab e.detail.tab
  componentDidUpdate: (prevProps, prevState) ->
    if prevState.doubleTabbed != @state.doubleTabbed
      @setState
        activeMainTab: 'mainView'
  componentDidMount: ->
    @handleKeyDown()
    window.addEventListener 'game.start', @handleKeyDown
    window.addEventListener 'tabarea.reload', @forceUpdate
    window.addEventListener 'PluginManager.PLUGIN_RELOAD', (e) => @cachePluginList()
    window.addEventListener 'doubleTabbed.change', @toggleDoubleTabbed
    window.addEventListener 'tabarea.change', @handleTabChange
    @cachePluginList()
    window.openSettings = @handleCmdCommaKeyDown
  componentWillUnmount: ->
    window.removeEventListener 'game.start', @handleKeyDown
    window.removeEventListener 'tabarea.reload', @forceUpdate
    window.removeEventListener 'PluginManager.PLUGIN_RELOAD', (e) => @cachePluginList()
    window.removeEventListener 'doubleTabbed.change', @toggleDoubleTabbed
    window.removeEventListener 'tabarea.change', @handleTabChange
  render: ->
    activePluginName = @state.activePluginName || @state.plugins[0]?.packageName
    activePlugin = @state.plugins.find (p) => p.packageName == activePluginName
    defaultPluginTitle = <span><FontAwesome name='sitemap' />{__ ' Plugins'}</span>
    pluginDropdownContents = if @state.plugins.length == 0
      <MenuItem key={1002} disabled>
        {window.i18n.setting.__ "Install plugins in settings"}
      </MenuItem>
    else
      @state.plugins.map (plugin, index) =>
        if !plugin.enabled then return
        <MenuItem key={plugin.id} eventKey={plugin.id} onSelect={plugin.handleClick}>
          {plugin.displayName}
        </MenuItem>
    pluginContents = for plugin, index in @state.plugins when !plugin.handleClick? && !plugin.windowURL? && plugin.enabled
      <div id={plugin.id} key={plugin.id} className="poi-app-tabpane poi-plugin"
        onSelected={(key) => @setState {activePluginName: key}}>
        <PluginWrap plugin={plugin} />
      </div>

    # Return
    if !@state.doubleTabbed
      <div>
        <Nav bsStyle="tabs" activeKey={@state.activeMainTab} id="top-nav"
          onSelect={@handleSelectTab}>
          <NavItem key='mainView' eventKey='mainView'>
            {mainview.displayName}
          </NavItem>
          <NavItem key='shipView' eventKey='shipView'>
            {shipview.displayName}
          </NavItem>
          <NavItem key='plugin' eventKey={activePluginName} onSelect={@handleSelect}>
            {activePlugin?.displayName || defaultPluginTitle}
          </NavItem>
          <NavDropdown id='plugin-dropdown' pullRight title=''
            onSelect={@handleSelectDropdown}>
            {pluginDropdownContents}
          </NavDropdown>
          <NavItem key='settings' eventKey='settings' className="tab-narrow">
            <FontAwesome key={0} name='cog' />
          </NavItem>
        </Nav>
        <TabContentsUnion ref='tabKeyUnion'
          onChange={(key) => @setState {activeMainTab: key}}>
          <div id={mainview.name} className="poi-app-tabpane" key='mainView'>
            <mainview.reactClass />
          </div>
          <div id={shipview.name} className="poi-app-tabpane" key='shipView'>
            <shipview.reactClass />
          </div>
          {pluginContents}
          <div id={settings.name} className="poi-app-tabpane" key='settings'>
            <settings.reactClass />
          </div>
        </TabContentsUnion>
      </div>
    else
      <div className='poi-tabs-container'>
        <div className="no-scroll">
          <Nav bsStyle="tabs" activeKey={@state.activeMainTab} onSelect={@handleSelectTab}>
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
            onChange={(key) => @setState {activeMainTab: key}}>
            <div id={mainview.name} className="poi-app-tabpane" key='mainView'>
              <mainview.reactClass activeMainTab={@state.activeMainTab}/>
            </div>
            <div id={shipview.name} className="poi-app-tabpane" key='shipView'>
              <shipview.reactClass activeMainTab={@state.activeMainTab}/>
            </div>
            <div id={settings.name} className="poi-app-tabpane" key='settings'>
              <settings.reactClass activeMainTab={@state.activeMainTab}/>
            </div>
          </TabContentsUnion>
        </div>
        <div className="no-scroll">
          <Nav bsStyle="tabs" onSelect={@handleSelectDropdown}>
            <NavDropdown id='plugin-dropdown' pullRight
              title={activePlugin?.displayName || defaultPluginTitle}>
            {pluginDropdownContents}
            </NavDropdown>
          </Nav>
          <TabContentsUnion ref='tabKeyUnion'>
            {pluginContents}
          </TabContentsUnion>
        </div>
      </div>
module.exports = ControlledTabArea
