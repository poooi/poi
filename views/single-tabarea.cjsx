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

PluginWrap = React.createClass
  shouldComponentUpdate: (nextProps, nextState)->
    false
  render: ->
    React.createElement @props.plugin.reactClass

settings = require path.join(ROOT, 'views', 'components', 'settings')
mainview = require path.join(ROOT, 'views', 'components', 'main')

lockedTab = false
ControlledTabArea = React.createClass
  getInitialState: ->
    key: 0
    pluginKey: -2
    dropdownOpen: false
    nowTime: 0
    plugins: []
    tabbedPlugins: []
  componentWillUpdate: (nextProps, nextState) ->
    @nowTime = (new Date()).getTime()
  componentDidUpdate: (prevProps, prevState) ->
    cur = (new Date()).getTime()
    console.log "the cost of tab-module's render: #{cur-@nowTime}ms" if process.env.DEBUG?
  renderPlugins: ->
    async( =>
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
    )()
  handleToggleDropdown: ->
    dropdownOpen = !@state.dropdownOpen
    @setState {dropdownOpen}
  handleSelect: (key) ->
    if key isnt @state.key
      if key is -2 then @handleToggleDropdown()
      @setState
        key: if key isnt -2 then key else @state.key
        pluginKey: if key > 1 && key < 1000 then key else @state.pluginKey
  handleSelectMenuItem: (e, key) ->
    e.preventDefault()
    if key isnt @state.key
      @setState
        key: key
        pluginKey: key
  handleSelectMainView: ->
    event = new CustomEvent 'view.main.visible',
      bubbles: true
      cancelable: false
      detail:
        visible: true
    window.dispatchEvent event
    @handleSelect 0
  handleSelectShipView: ->
    event = new CustomEvent 'view.main.visible',
      bubbles: true
      cancelable: false
      detail:
        visible: false
    window.dispatchEvent event
    @handleSelect 1
  handleMiniShipChange: (e) ->
    e.preventDefault()
    if e.detail.visible
      if @state.key is 1
        @handleSelect 0
    else
      if @state.key is 0
        @handleSelect 1
  handleCtrlOrCmdTabKeyDown: ->
    @handleSelectMainView()
  handleCtrlOrCmdNumberKeyDown: (num) ->
    if num == 1
      @handleSelectMainView()
    else
      if num == 2
        @handleSelectShipView()
      else
        if num <= 2 + @state.tabbedPlugins.length
          @handleSelect num - 1
  handleShiftTabKeyDown: ->
    next = if @state.key? then (@state.key + @state.tabbedPlugins.length) % (1 + @state.tabbedPlugins.length) else @state.tabbedPlugins.length
    if next == 0
      @handleSelectMainView()
    else
      if next == 1
        @handleSelectShipView()
      else
        @handleSelect next
  handleTabKeyDown: ->
    next = if @state.key? then (@state.key + 1) % (1 + @state.tabbedPlugins.length) else 1
    if next == 0
      @handleSelectMainView()
    else
      if next == 1
        @handleSelectShipView()
      else
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
    window.addEventListener 'game.start', @handleKeyDown
    window.addEventListener 'tabarea.reload', @forceUpdate
    window.addEventListener 'view.main.visible', @handleMiniShipChange
    async( =>
      yield @renderPlugins()
      window.addEventListener 'PluginManager.PLUGIN_RELOAD', @renderPlugins
    )()
  componentWillUnmount: ->
    window.removeEventListener 'view.main.visible', @handleMiniShipChange
    window.removeEventListener 'PluginManager.PLUGIN_RELOAD', @renderPlugins
  render: ->
    <div>
      <Nav bsStyle="tabs" activeKey={@state.key} id="top-nav">
        <NavItem key={0} eventKey={0} onSelect={@handleSelectMainView}>
          {mainview.displayName}
        </NavItem>
        <NavItem key={1} eventKey={1} onSelect={@handleSelectShipView}>
          <span><FontAwesome key={0} name='server' />{window.i18n.main.__ ' Fleet'}</span>
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
      <div>
        <div id={mainview.name} className="poi-app-tabpane #{if @state.key == 0 || @state.key == 1 then 'show' else 'hidden'}">
          {
            React.createElement mainview.reactClass,
              selectedKey: @state.key
              index: 0
          }
        </div>
        {
          counter = 1
          @state.plugins.map (plugin, index) =>
            if !plugin.handleClick?
              key = (counter += 1)
              <div id={plugin.name} key={key} className="poi-app-tabpane #{if @state.key == key then 'show' else 'hidden'}">
                <PluginWrap plugin={plugin} selectedKey={@state.key} index={key} />
              </div>
        }
        <div id={settings.name} className="poi-app-tabpane #{if @state.key == 1000 then 'show' else 'hidden'}">
          {
            React.createElement settings.reactClass,
              selectedKey: @state.key
              index: 1000
          }
        </div>
      </div>
    </div>
module.exports = ControlledTabArea
