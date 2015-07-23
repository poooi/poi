path = require 'path-extra'
glob = require 'glob'
{_, $, React, ReactBootstrap, FontAwesome} = window
{TabbedArea, TabPane, DropdownButton} = ReactBootstrap

$('poi-main').className += 'double-tabbed'
window.doubleTabbed = true

# Get components
components = glob.sync(path.join(ROOT, 'views', 'components', '*'))

PluginWrap = React.createClass
  shouldComponentUpdate: (nextProps, nextState)->
    false
  render: ->
    React.createElement @props.plugin.reactClass

# Discover plugins and remove unused plugins
plugins = glob.sync(path.join(ROOT, 'plugins', '*'))
exPlugins = glob.sync(path.join(EXROOT, 'plugins', '*'))
plugins = plugins.concat(exPlugins)
plugins = plugins.filter (filePath) ->
  # Every plugin will be required
  try
    plugin = require filePath
    return config.get "plugin.#{plugin.name}.enable", true
  catch e
    return false

components = components.map (filePath) ->
  component = require filePath
  component.priority = 10000 unless component.priority?
  component
components = components.filter (component) ->
  component.show isnt false and component.name != 'SettingsView'
components = _.sortBy(components, 'priority')

plugins = plugins.map (filePath) ->
  plugin = require filePath
  plugin.priority = 10000 unless plugin.priority?
  plugin
plugins = plugins.filter (plugin) ->
  plugin.show isnt false
plugins = _.sortBy(plugins, 'priority')
tabbedPlugins = plugins.filter (plugin) ->
  !plugin.handleClick?
settings = require path.join(ROOT, 'views', 'components', 'settings')

lockedTab = false
ControlledTabArea = React.createClass
  getInitialState: ->
    key: [0, 0]
  handleSelect: (key) ->
    @setState {key} if key[0] isnt @state.key[0] or key[1] isnt @state.key[1]
  handleSelectLeft: (key) ->
    @handleSelect [key, @state.key[1]]
  handleSelectRight: (key) ->
    @handleSelect [@state.key[0], key]
  handleCtrlOrCmdTabKeyDown: ->
    @handleSelect [(@state.key[0] + 1) % components.length, @state.key[1]]
  handleCtrlOrCmdNumberKeyDown: (num) ->
    if num <= tabbedPlugins.length
      @handleSelect [@state.key[0], num - 1]
  handleShiftTabKeyDown: ->
    @handleSelect [@state.key[0], if @state.key[1]? then (@state.key[1] - 1 + tabbedPlugins.length) % tabbedPlugins.length else tabbedPlugins.length - 1]
  handleTabKeyDown: ->
    @handleSelect [@state.key[0], if @state.key[1]? then (@state.key[1] + 1) % tabbedPlugins.length else 1]
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
  render: ->
    ### FIXME
    # Animation disabled
    # Relate to https://github.com/react-bootstrap/react-bootstrap/issues/287
    ###
    <div className='poi-tabs-container'>
      <TabbedArea activeKey={@state.key[0]} onSelect={@handleSelectLeft} animation={false}>
      {
        [
          components.map (component, index) =>
            <TabPane key={index} eventKey={index} tab={component.displayName} id={component.name} className='poi-app-tabpane'>
            {
              React.createElement component.reactClass,
                selectedKey: @state.key[0]
                index: index
            }
            </TabPane>
          <TabPane key={1000} eventKey={1000} tab={settings.displayName} id={settings.name} className='poi-app-tabpane'>
          {
            React.createElement settings.reactClass,
              selectedKey: @state.key[0]
              index: 1000
          }
          </TabPane>
        ]
      }
      </TabbedArea>
      <TabbedArea activeKey={@state.key[1]} onSelect={@handleSelectRight} animation={false}>
        <DropdownButton key={-1} eventKey={-1} tab={<span>{plugins[@state.key[1]]?.displayName || <span><FontAwesome name='sitemap' /> 插件</span>}</span>} navItem={true}>
        {
          counter = -1
          plugins.map (plugin, index) =>
            if plugin.handleClick
              <div key={index} eventKey={0} tab={plugin.displayName} id={plugin.name} onClick={plugin.handleClick} />
            else
              eventKey = (counter += 1)
              <TabPane key={index} eventKey={eventKey} tab={plugin.displayName} id={plugin.name} className='poi-app-tabpane'>
                <PluginWrap plugin={plugin} selectedKey={@state.key[1]} index={eventKey} />
              </TabPane>
        }
        </DropdownButton>
      </TabbedArea>
    </div>

module.exports = ControlledTabArea
