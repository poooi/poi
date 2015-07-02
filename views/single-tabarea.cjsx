path = require 'path-extra'
glob = require 'glob'
{_, $, $$, ROOT, notify, layout, React, ReactBootstrap} = window
{Grid, Col, Row, TabbedArea, TabPane, Navbar, Nav, NavItem, MenuItem, DropdownButton} = ReactBootstrap

# Get components
components = glob.sync(path.join(ROOT, 'views', 'components', '*'))
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
indivPlugins = plugins.filter (plugin) ->
  plugin.handleClick?

settings = require path.join(ROOT, 'views', 'components', 'settings')
compactmain = require path.join(ROOT, 'views', 'components', 'compactmain')
timegauge = require path.join(ROOT, 'views', 'components', 'timegauge')
fleet = require path.join(ROOT, 'views', 'components', 'ship')
prophet = require path.join(ROOT, 'plugins', 'prophet')

lockedTab = false

ControlledTabArea = React.createClass
  getInitialState: ->
    key: 0
    xs: if layout == 'horizonal' then 6 else 4
    activepanelleft: 0
    activepanelright: 0
    teitoku: null
  handleSelect: (key) ->
    @setState {key}
  handleSelectRightPanel: (key) ->
    console.log "#{@state.key}"
    @setState
      activepanelright: key
  handleSelectLeftPanel: (key) ->
    @setState
      activepanelleft: key
  handleCtrlOrCmdTabKeyDown: ->
    @setState
      key: 0
  handleCtrlOrCmdNumberKeyDown: (num) ->
    if num <= components.length + tabbedPlugins.length
      @setState
        key: num - 1
  handleShiftTabKeyDown: ->
    @setState
      key: if @state.key? then (@state.key - 1 + components.length + tabbedPlugins.length) % (components.length + tabbedPlugins.length) else components.length + tabbedPlugins.length - 1
  handleTabKeyDown: ->
    @setState
      key: if @state.key? then (@state.key + 1) % (components.length + tabbedPlugins.length) else 1
  componentDidMount: ->
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
  render: ->
    ### FIXME
    # Animation disabled
    # Relate to https://github.com/react-bootstrap/react-bootstrap/issues/287
    ###
    <div>
      <Navbar fluid brand={"compactmain.handleNavbar this"}>
      {
        <Nav navbar right activeKey={@state.key} onSelect={@handleSelect}>
          <DropdownButton key={1} eventKey={1} title='面板'>
            <MenuItem key={0} eventKey={0} id={timegauge.name} className='poi-app-tabpane toggle' onSelect={@handleSelectLeftPanel}>
              {timegauge.displayName}
            </MenuItem>
            <MenuItem key={1} eventKey={1} id={fleet.name} className='poi-app-tabpane toggle' onSelect={@handleSelectLeftPanel}>
              {fleet.displayName}
            </MenuItem>
            <MenuItem key={2} eventKey={2} id={prophet.name} className='poi-app-tabpane toggle'
             onSelect={@handleSelectLeftPanel}>
              {prophet.displayName}
            </MenuItem>
          </DropdownButton>
          <DropdownButton key={2} eventKey={2} title='插件'>
          {
            keys = [0..indivPlugins.length - 1].map (a) -> (a+tabbedPlugins.length)
            [
              <MenuItem key={0} eventKey={0} id={fleet.name} className='poi-app-tabpane toggle' onSelect={@handleSelectRightPanel}>
                {fleet.displayName}
              </MenuItem>
              for i in [0..tabbedPlugins.length - 1]
                plugin = tabbedPlugins[i]
                <MenuItem key={i + 1} eventKey={i + 1} id={plugin.name} className='poi-app-tabpane' onSelect={@handleSelectRightPanel}>
                  {plugin.displayName}
                </MenuItem>
              for i in keys
                plugin = indivPlugins[i - tabbedPlugins.length]
                <MenuItem key={i} eventKey={i} id={plugin.name} onSelect={plugin.handleClick}>
                  {plugin.displayName}
                </MenuItem>
            ]
          }
          </DropdownButton>
          <NavItem key={1000} eventKey={1000} tab={settings.displayName} id={settings.name} className='poi-app-tabpane toggle' onSelect={@handleSelectRightPanel}>
            {settings.displayName}
          </NavItem>
        </Nav>
      }
      </Navbar>
      <div id='teitoku-panel' ref='teitoku-panel'>
      {
        React.createElement compactmain.reactClass
      }
      </div>
      <Grid className="dual-panel-container">
        <Col xs={@state.xs} className='panel-col ship-panel' ref="left-panel">
          <div key={0} eventKey={0} tab={timegauge.displayName} id={timegauge.name} className='poi-app-tabpane' className={if @state.activepanelleft == 0 then 'show' else 'hidden'}>
          {
            React.createElement timegauge.reactClass
          }
          </div>
          <div key={1} eventKey={1} tab={fleet.displayName} id={fleet.name} className='poi-app-tabpane' className={if @state.activepanelleft == 1 then 'show' else 'hidden'}>
          {
            React.createElement fleet.reactClass
          }
          </div>
          <div key={2} eventKey={2} tab={prophet.displayName} id={prophet.name} className='poi-app-tabpane' className={if @state.activepanelleft == 2 then 'show' else 'hidden'}>
          {
            React.createElement prophet.reactClass
          }
          </div>
        </Col>
        <Col xs={@state.xs} className="panel-col plugin-panel" ref="right-panel">
          <div key={0} eventKey={0} tab={fleet.displayName} id={fleet.name} className='poi-app-tabpane' className={if @state.activepanelright == 0 then 'show' else 'hidden'}>
          {
            React.createElement fleet.reactClass
          }
          </div>
          {
            for i in [0..tabbedPlugins.length - 1]
              plugin = tabbedPlugins[i]
              <div key={i + 1} eventKey={i + 1} id={plugin.name} className='poi-app-tabpane' className={if @state.activepanelright == i + 1 then 'show' else 'hidden'}>
              {
                React.createElement plugin.reactClass
              }
              </div>
          }
          <div key={1000} eventKey={1000} tab={settings.displayName} id={settings.name} className='poi-app-tabpane' className={if @state.activepanelright == 1000 then 'show' else 'hidden'}>
          {
            React.createElement settings.reactClass
          }
          </div>
        </Col>
      </Grid>
    </div>


module.exports = ControlledTabArea
