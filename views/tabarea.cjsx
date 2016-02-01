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

  componentDidMount: ->
    window.addEventListener 'TabContentsUnion.show', @handleShowEvent
  componentWillUnmount: ->
    window.removeEventListener 'TabContentsUnion.show', @handleShowEvent

  componentWillReceiveProps: (nextProps) ->
    if !@state.nowKey? && nextProps.children.length != 0
      @setNewKey nextProps.children[0].key, true

  handleShowEvent: (e) ->
    @setNewKey e.detail.key

  findChildByKey: (key) ->
    _.filter((React.Children.map @props.children, 
        (child) -> if child.key == key then child),
      Boolean)[0]

  setNewKey: (nxtKey, force=false) ->
    nxtChild = @findChildByKey nxtKey
    if !force
      nowKey = @state.nowKey || @props.children[0]?.key
      return if (nowKey && nxtKey == nowKey) || !nxtChild
    @setState
      nowKey: nxtKey
    @props.onChange? nxtKey
    nxtChild.props.onSelected? nxtKey

  activeKey: ->
    @state.nowKey || @props.children[0]?.key

  setTabShow: (key) ->
    React.Children.forEach @props.children, (child) =>
      if child.key == key
        @setNewKey key

  setTabOffset: (offset) ->
    return if !@props.children?
    nowKey = @activeKey()
    React.Children.forEach @props.children, (child, index) =>
      if child.key == nowKey
        nextIndex = (index+offset+@props.children.length) % @props.children.length
        @setNewKey @props.children[nextIndex].key

  render: ->
    onTheLeft = true
    activeKey = @activeKey()
    <div className='poi-tab-contents'>
      {
        React.Children.map @props.children, (child) =>
          if child.key == activeKey
            onTheLeft = false
          positionLeft = if child.key == activeKey
            0
          else if onTheLeft
            -100
          else 
            100
          <div className='poi-tab-child-sizer'>
            <div className='poi-tab-child-positioner' style={left: "#{positionLeft}%"}>
              {child}
            </div>
          </div>
      }
    </div>

ControlledTabArea = React.createClass
  getInitialState: ->
    dropdownOpen: false
    plugins: []
    doubleTabbed: config.get 'poi.tabarea.double', false
  toggleDoubleTabbed: (doubleTabbed) ->
    @setState {doubleTabbed}
  componentWillUpdate: (nextProps, nextState) ->
    @nowTime = (new Date()).getTime()
  componentDidUpdate: (prevProps, prevState) ->
    cur = (new Date()).getTime()
    console.log "the cost of tab-module's render: #{cur-@nowTime}ms" if process.env.DEBUG?
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
  handleCtrlOrCmdNumberKeyDown: (num) ->
    switch num
      when 1 
        key = 'mainView'
      when 2
        key = 'shipView'
      else
        key = @state.plugins[num-3]?.name
        isPlugin = if key? then 'plugin'
    @selectTab key
    @selectTab isPlugin if !@state.doubleTabbed
  handleShiftTabKeyDown: ->
    @refs.pluginTabUnion.setTabOffset -1
  handleTabKeyDown: ->
    @refs.pluginTabUnion.setTabOffset 1
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
        if e.keyCode >= 49 and e.keyCode <= 57
          @handleCtrlOrCmdNumberKeyDown(e.keyCode - 48)
        else if e.keyCode is 48
          @handleCtrlOrCmdNumberKeyDown 10
  componentDidMount: ->
    window.dispatchEvent new Event('resize')
    window.addEventListener 'game.start', @handleKeyDown
    window.addEventListener 'tabarea.reload', @forceUpdate
    window.addEventListener 'PluginManager.PLUGIN_RELOAD', @cachePluginList
    window.toggleDoubleTabbed = @toggleDoubleTabbed
    @cachePluginList()
  componentWillUnmount: ->
    window.removeEventListener 'PluginManager.PLUGIN_RELOAD', @cachePluginList
  render: ->
    activePluginName = @state.activePluginName || @state.plugins[0]?.name
    plugin = @state.plugins.find (p) => p.name == activePluginName
    defaultPluginTitle = <span><FontAwesome name='sitemap' />{__ ' Plugins'}</span>
    defaultPluginContents = 
      <MenuItem key={1002} disabled>
        {window.i18n.setting.__ "Install plugins in settings"}
      </MenuItem>
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
            {plugin?.displayName || defaultPluginTitle}
          </NavItem>
          <NavDropdown id='plugin-dropdown' pullRight title=''
             onSelect={@handleSelectDropdown}>
          {
            @state.plugins.map (plugin, index) =>
              <MenuItem key={plugin.name} eventKey={plugin.name} onSelect={plugin.handleClick}>
                {plugin.displayName}
              </MenuItem>
          }
          {
            if @state.plugins.length == 0
              defaultPluginContents
          }
          </NavDropdown>
          <NavItem key='settings' eventKey='settings' className="tab-narrow">
            <FontAwesome key={0} name='cog' />
          </NavItem>
        </Nav>
        <TabContentsUnion ref='mainTabUnion'
          onChange={(key) => @setState {activeMainTab: key}}>
          <div id={mainview.name} className="poi-app-tabpane" key='mainView'>
            <mainview.reactClass />
          </div>
          <div id={shipview.name} className="poi-app-tabpane" key='shipView'>
            <shipview.reactClass />
          </div>
          {
            for plugin, index in @state.plugins when !plugin.handleClick?
              <div id={plugin.name} key={plugin.name} className="poi-app-tabpane poi-plugin"
                onSelected={(key) => @setState {activePluginName: key}}>
                <PluginWrap plugin={plugin} />
              </div>
          }
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
          <TabContentsUnion ref='mainTabUnion'
            onChange={(key) => @setState {activeMainTab: key}}>
            <div id={mainview.name} className="poi-app-tabpane" key='mainView'>
              <mainview.reactClass />
            </div>
            <div id={shipview.name} className="poi-app-tabpane" key='shipView'>
              <shipview.reactClass />
            </div>
            <div id={settings.name} className="poi-app-tabpane" key='settings'>
              <settings.reactClass />
            </div>
          </TabContentsUnion>
        </div>
        <div className="no-scroll">
          <Nav bsStyle="tabs" onSelect={@handleSelectDropdown}>
          </Nav>
          <TabContentsUnion ref='pluginTabUnion'
            onChange={(key) => @setState {activePluginName: key}}>
          {
            for plugin, index in @state.plugins when !plugin.handleClick?
              <div id={plugin.name} key={plugin.name} className="poi-app-tabpane poi-plugin">
                <PluginWrap plugin={plugin} />
              </div>
          }
          </TabContentsUnion>
        </div>
      </div>
module.exports = ControlledTabArea
