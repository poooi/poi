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

  setNewKey: (nxtKey) ->
    nowKey = @state.nowKey || @props.children[0]?.key
    return if !nowKey? || nxtKey == nowKey
    @setState
      nowKey: nxtKey
    @props.onNewKey? nxtKey

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
    key: 0
    pluginKey: if config.get 'poi.tabarea.double', false then 2 else -2
    dropdownOpen: false
    nowTime: 0
    plugins: []
    tabbedPlugins: []
    doubleTabbed: config.get 'poi.tabarea.double', false
    activePluginName: null
  toggleDoubleTabbed: (doubleTabbed) ->
    key = @state.key
    if @state.doubleTabbed
      if key > 2 || key < 1000
        key = 0
    @setState {doubleTabbed, key}
  componentWillUpdate: (nextProps, nextState) ->
    @nowTime = (new Date()).getTime()
  componentDidUpdate: (prevProps, prevState) ->
    cur = (new Date()).getTime()
    console.log "the cost of tab-module's render: #{cur-@nowTime}ms" if process.env.DEBUG?
  renderPlugins: async ->
    plugins = yield PluginManager.getValidPlugins()
    plugins = plugins.filter (plugin) ->
      plugin.show isnt false
    plugins = _.sortBy plugins, 'priority'
    tabbedPlugins = plugins.filter (plugin) ->
      !plugin.handleClick?
    if @isMounted()
      @setState
        plugins: plugins
        tabbedPlugins: tabbedPlugins
  handleToggleDropdown: ->
    dropdownOpen = !@state.dropdownOpen
    @setState {dropdownOpen}
  handleSelect: (key) ->
    if @state.doubleTabbed
      unionKey = switch key
        when 0 then 'mainView'
        when 1 then 'shipView'
        when 1000 then 'settings'
      if unionKey?
        @refs.mainTabUnion.setTabShow unionKey
      if key < 2 || key == 1000
        @setState
          key: key
      else
        @setState
          pluginKey: key
    else
      if key isnt @state.key
        if key is -2 then @handleToggleDropdown()
        @setState
          key: if key isnt -2 then key else @state.key
          pluginKey: if key > 1 && key < 1000 then key else @state.pluginKey
  handleSelectPlugin: (e, key) ->
    @refs.pluginTabUnion.setNewKey key
  handleSelectMenuItem: (e, key) ->
    e.preventDefault()
    if @state.doubleTabbed
      @setState
        pluginKey: key
    else
      @setState
        key: key
        pluginKey: key
  handleCtrlOrCmdTabKeyDown: ->
    @handleSelect 0
  handleCtrlOrCmdNumberKeyDown: (num) ->
    @refs.pluginTabUnion.setNewKey @state.plugins[num-3]?.name
    if num <= 2 + @state.tabbedPlugins.length
      @handleSelect num - 1
  handleShiftTabKeyDown: ->
    @refs.pluginTabUnion.setTabOffset -1
    next = if @state.key? then (@state.key + @state.tabbedPlugins.length) % (1 + @state.tabbedPlugins.length) else @state.tabbedPlugins.length
    @handleSelect next
  handleTabKeyDown: ->
    @refs.pluginTabUnion.setTabOffset 1
    next = if @state.key? then (@state.key + 1) % (1 + @state.tabbedPlugins.length) else 1
    @handleSelect next
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
    window.addEventListener 'PluginManager.PLUGIN_RELOAD', @renderPlugins
    window.toggleDoubleTabbed = @toggleDoubleTabbed
    @renderPlugins()
  componentWillUnmount: ->
    window.removeEventListener 'PluginManager.PLUGIN_RELOAD', @renderPlugins
  render: ->
    activePluginName = @state.activePluginName || @state.plugins[0]?.name
    plugin = @state.plugins.find (p) => p.name == activePluginName
    if !@state.doubleTabbed
      <div>
        <Nav bsStyle="tabs" activeKey={@state.key} id="top-nav">
          <NavItem key={0} eventKey={0} onSelect={@handleSelect}>
            {mainview.displayName}
          </NavItem>
          <NavItem key={1} eventKey={1} onSelect={@handleSelect}>
            {shipview.displayName}
          </NavItem>
          <NavItem key={1001} eventKey={@state.pluginKey} onSelect={@handleSelect}>
             {
               if @state.pluginKey >= 2 and @state.pluginKey < 1000
                 <span>{@state.tabbedPlugins[@state.pluginKey - 2].displayName}</span>
               else
                 <span><FontAwesome name='sitemap' />{__ ' Plugins'}</span>
             }
          </NavItem>
          <NavDropdown id='plugin-dropdown' key={-1} eventKey={-1} pullRight open={@state.dropdownOpen} onToggle={@handleToggleDropdown} title=''>
          {
            counter = 1
            @state.plugins.map (plugin, index) =>
              if plugin.handleClick?
                <MenuItem key={2 + index} eventKey={@state.key} onSelect={plugin.handleClick}>
                  {plugin.displayName}
                </MenuItem>
              else
                key = (counter += 1)
                <MenuItem key={2 + index} eventKey={key} onSelect={@handleSelectMenuItem}>
                  {plugin.displayName}
                </MenuItem>
          }
          {
            if @state.plugins.length == 0
              <MenuItem key={1002} disabled>{window.i18n.setting.__ "Install plugins in settings"}</MenuItem>
          }
          </NavDropdown>
          <NavItem key={1000} eventKey={1000} onSelect={@handleSelect} className="tab-narrow">
            <FontAwesome key={0} name='cog' />
          </NavItem>
        </Nav>
        <TabContentsUnion selectedKey={@state.key}
                          tabCount={@state.tabbedPlugins.length + 3}>
          <div id={mainview.name} className="poi-app-tabpane">
            {
              React.createElement mainview.reactClass,
                selectedKey: @state.key
                index: 0
            }
          </div>
          <div id={shipview.name} className="poi-app-tabpane">
            {
              React.createElement shipview.reactClass,
                selectedKey: @state.key
                index: 1
            }
          </div>
          {
            counter = 1
            @state.plugins.map (plugin, index) =>
              if !plugin.handleClick?
                key = (counter += 1)
                <div id={plugin.name} key={key} className="poi-app-tabpane poi-plugin">
                  <PluginWrap plugin={plugin} selectedKey={@state.key} index={key} />
                </div>
          }
          <div id={settings.name} className="poi-app-tabpane poi-plugin">
            {
              React.createElement settings.reactClass,
                selectedKey: @state.key
                index: 1000
            }
          </div>
        </TabContentsUnion>
      </div>
    else
      <div className='poi-tabs-container'>
        <div className="no-scroll">
          <Nav bsStyle="tabs" activeKey={@state.key}>
            <NavItem key={0} eventKey={0} onSelect={@handleSelect}>
              {mainview.displayName}
            </NavItem>
            <NavItem key={1} eventKey={1} onSelect={@handleSelect}>
              {shipview.displayName}
            </NavItem>
            <NavItem key={1000} eventKey={1000} className='poi-app-tabpane' onSelect={@handleSelect}>
              {settings.displayName}
            </NavItem>
          </Nav>
          <TabContentsUnion ref='mainTabUnion'>
            <div id={mainview.name} className="poi-app-tabpane" key='mainView'>
              <mainview.reactClass
                selectedKey={@state.key}
                index=0
                />
            </div>
            <div id={shipview.name} className="poi-app-tabpane" key='shipView'>
              <shipview.reactClass
                selectedKey={@state.key}
                index=1
                />
            </div>
            <div id={settings.name} className="poi-app-tabpane" key='settings'>
              <settings.reactClass
                selectedKey={@state.key}
                index=1000
                />
            </div>
          </TabContentsUnion>
        </div>
        <div className="no-scroll">
          <Nav bsStyle="tabs" activeKey={@state.pluginKey} onSelect={@handleSelectPlugin}>
            <NavDropdown id='plugin-dropdown' key={-1} eventKey={-1} pullRight open={@state.dropdownOpen} onToggle={@handleToggleDropdown}
                         title={plugin?.displayName || <span><FontAwesome name='sitemap' />{__ ' Plugins'}</span>}>
            {
              @state.plugins.map (plugin, index) =>
                <MenuItem key={plugin.name} eventKey={plugin.name} onSelect={plugin.handleClick}>
                  {plugin.displayName}
                </MenuItem>
            }
            {
              if @state.plugins.length == 0
                <MenuItem key={1002} disabled>{window.i18n.setting.__ "Install plugins in settings"}</MenuItem>
            }
            </NavDropdown>
          </Nav>
          <TabContentsUnion ref='pluginTabUnion'
            onNewKey={(key) => @setState {activePluginName: key}}>
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
