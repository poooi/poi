Promise = require 'bluebird'
path = require 'path-extra'
glob = require 'glob'
__ = i18n.setting.__.bind(i18n.setting)
__n = i18n.setting.__n.bind(i18n.setting)
fs = require 'fs-extra'
npm = require 'npm'
semver = require 'semver'
{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT, PluginManager} = window
{Grid, Col, Row, Input, Alert, Button, ButtonGroup, Label, Collapse, Well, OverlayTrigger, Tooltip, Panel} = ReactBootstrap
{config} = window
shell = require 'shell'
{dialog} = remote.require 'electron'
Divider = require './divider'
async = Promise.coroutine

PluginSettingWrap = React.createClass
  shouldComponentUpdate: (nextProps, nextState)->
    true
  render: ->
    React.createElement @props.plugin.settingsClass

CollapsiblePanel = React.createClass
  getInitialState: ->
    expanded: @props.expanded
    hide: !@props.expanded
  
  componentWillReceiveProps: (nextProps) ->
    transitionTime = @props.transitionTime || 400
    if @props.expanded && !nextProps.expanded
      @setState {expanded: false}
      _.delay (=> @setState {hide: true}), transitionTime
    else if !@props.expanded && nextProps.expanded
      @setState {hide: false}
      _.defer (=> @setState {expanded: true})

  render: ->
    style = Object.assign {}, @props.style, 
      if @state.hide then {display: 'none'} else {}
    <Panel {...@props} style={style} />

InstalledPlugin = React.createClass
  getInitialState: ->
    settingOpen: false

  toggleSettingPop: ->
    @setState
      settingOpen: !@state.settingOpen

  render: ->
    plugin = @props.plugin
    index = @props.index
    <div style={marginLeft: 15, marginRight: 15, marginBottom: 8}>
      <Row>
        <Col xs={12} className='div-row'>
          <span style={fontSize: '150%'}>
            {plugin.displayName}
          </span>
          <span style={paddingTop: 2; paddingLeft: 2}> @<span className='author-link' onClick={_.partial @props.handleClickAuthorLink, plugin.link}>{plugin.author}</span></span>
          <div style={paddingTop: 2, marginLeft: 'auto', display: 'flex'}>
            <div>
              <Label bsStyle="#{if plugin.lastestVersion.indexOf('beta') == -1 then 'primary' else 'warning'}"
                     className="update-label #{if not plugin.isOutdated then 'hidden'}"
                     onClick={_.partial @props.handleUpdate, index}>
                <FontAwesome name={
                               if plugin.isUpdating
                                 "spinner"
                               else if plugin.isOutdated
                                 "cloud-download"
                               else
                                 "check"
                             }
                             pulse={plugin.isUpdating}/>
                {
                  if plugin.isUpdating
                     __ "Updating"
                  else if plugin.isOutdated
                     "Version #{plugin.lastestVersion}"
                  else
                     __ "Latest"
                }
              </Label>
            </div>
            <div>
              Version {plugin.version || '1.0.0'}
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={7}>{plugin.description}</Col>
        <Col xs={5} style={padding: 0}>
          <div style={width: "#{if plugin.settingsClass? then '100%' else 'calc(100% * 2 / 3)'}", marginLeft: 'auto'}>
            <ButtonGroup bsSize='small' style={width: '100%'}>
              {
                if plugin.settingsClass?
                  <OverlayTrigger placement='top' overlay={
                     <Tooltip>
                       {__ 'Settings'}
                     </Tooltip>
                     }>
                     <Button ref="setting-btn"
                             bsStyle='primary' bsSize='xs'
                             style={width: 'calc(100% / 3)'}
                             onClick={@toggleSettingPop}
                             className="plugin-control-button">
                       <FontAwesome name='gear' />
                     </Button>
                   </OverlayTrigger>
              }
              <OverlayTrigger placement='top' overlay={
                <Tooltip>
                {
                  switch PluginManager.getStatusOfPlugin plugin
                    when PluginManager.VALID
                      __ "Disable"
                    when PluginManager.DISABLED
                      __ "Enable"
                    when PluginManager.NEEDUPDATE
                      __ "Outdated"
                    when PluginManager.BROKEN
                      __ "Error"
                }
                </Tooltip>
                }>
                <Button bsStyle='info'
                  disabled={PluginManager.getStatusOfPlugin(plugin) == PluginManager.NEEDUPDATE}
                  onClick={_.partial @props.handleEnable, index}
                  style={width: "#{if plugin.settingsClass? then 'calc(100% / 3)' else '50%'}"}
                  className="plugin-control-button">
                  <FontAwesome name={
                    switch PluginManager.getStatusOfPlugin plugin
                      when PluginManager.VALID
                        "pause"
                      when PluginManager.DISABLED
                        "play"
                      when PluginManager.NEEDUPDATE
                        "ban"
                      when PluginManager.BROKEN
                        "close"
                    }/>
                </Button>
              </OverlayTrigger>
              <OverlayTrigger placement='top' overlay={
                <Tooltip>
                {
                  if plugin.isUninstalling
                    __ "Removing"
                  else if plugin.isInstalled
                    __ "Remove"
                  else
                    __ "Removed"
                }
                </Tooltip>
                }>
                <Button bsStyle='danger'
                  onClick={_.partial @props.handleRemove, index}
                  disabled={not plugin.isInstalled}
                  style={width: "#{if plugin.settingsClass? then 'calc(100% / 3)' else '50%'}"}
                  className="plugin-control-button">
                  <FontAwesome name={if plugin.isInstalled then 'trash' else 'trash-o'} />
                </Button>
              </OverlayTrigger>
            </ButtonGroup>
          </div>
        </Col>
      </Row>
      <Row>
        {
          if plugin.settingsClass?
            <CollapsiblePanel collapsible expanded={@state.settingOpen}
              style={margin: 0} >
              <PluginSettingWrap plugin={plugin} />
            </CollapsiblePanel>
        }
      </Row>
    </div>

UninstalledPlugin = React.createClass
  render: ->
    value = @props.record
    <div style={marginLeft: 15, marginRight: 15, marginBottom: 8}>
      <Row>
        <Col xs={12} className='div-row'>
          <span style={fontSize: '150%'}>
            <FontAwesome name={value.icon} />
              {' ' + value[window.language]}
            </span>
          <span style={paddingLeft: 2}> @
            <span className='author-link' onClick={_.partial @props.handleClickAuthorLink, value.link}>
              {value.author}
            </span>
          </span>
        </Col>
      </Row>
      <Row>
        <Col xs={10}>{value["des#{window.language}"]}</Col>
        <Col xs={2} style={padding: 0}>
          <div style={marginLeft: 'auto'}>
            <ButtonGroup bsSize='small' style={width: '100%'}>
              <OverlayTrigger placement='top' overlay={
                <Tooltip>
                {
                  if @props.installing
                    __ "Installing"
                  else
                    __ "Install"
                }
                </Tooltip>
                }>
                <Button bsStyle='primary'
                  disabled={@props.npmWorkding}
                  onClick={_.partial @props.handleInstall, @props.name}
                  style={width: "100%"}
                  className="plugin-control-button">
                  <FontAwesome name={
                      if @props.installing
                        'spinner'
                      else
                        'download'
                    }
                    pulse={@props.installing}/>
                </Button>
              </OverlayTrigger>
            </ButtonGroup>
          </div>
        </Col>
      </Row>
    </div>

PluginConfig = React.createClass
  getInitialState: ->
    checkingUpdate: false
    hasUpdates: false
    npmWorkding: false
    installingAll: false
    installingPluginNames: []
    config: {}
    mirrors: {}
    plugins: []
    uninstalledPluginSettings: []
    updatingAll: false
    reloading: false
    advanced: false
    manuallyInstallPackage: ''
    manuallyInstallStatus: 0
  isUpdateAvailable: false
  checkCount: 0
  emitReload: ->
    PluginManager.emitReload()
  readPlugins: async ->
    initState = @getInitialState()
    initState.reloading = true
    @setState initState
    mirrors = yield PluginManager.getMirrors()
    config = yield PluginManager.getConf()
    yield PluginManager.readPlugins()
    @updateFromPluginManager {
      mirrors: mirrors
      config: config
      reloading: false
    }
  updateFromPluginManager: async (newState) ->
    newState ?= {}
    state = @state
    plugins = yield PluginManager.getInstalledPlugins()
    settings = yield PluginManager.getUninstalledPluginSettings()
    newState.plugins = plugins
    newState.uninstalledPluginSettings = settings
    for key of newState
      state[key] = newState[key]
    @setState state
  handleClickAuthorLink: (link, e) ->
    shell.openExternal link
    e.preventDefault()
  handleEnableBetaPluginCheck: async ->
    config = yield PluginManager.selectConfig(null, null, !@state.config.betaCheck)
    @setState
      config: config
  handleEnableProxy: async ->
    config = yield PluginManager.selectConfig(null, !@state.config.proxy, null)
    @setState
      config: config
  onSelectServer: async (state) ->
    config = yield PluginManager.selectConfig(state ,null, null)
    @setState
      config: config
  handleAdvancedShow: ->
    advanced = !@state.advanced
    @setState {advanced}
  changeInstalledPackage: (e) ->
    manuallyInstallPackage = e.target.value
    @setState {manuallyInstallPackage}
  handleEnable: async (index) ->
    plugins = yield PluginManager.getInstalledPlugins()
    plugin = plugins[index]
    switch PluginManager.getStatusOfPlugin plugin
      when PluginManager.DISABLED
        PluginManager.enablePlugin plugin
      when PluginManager.VALID
        PluginManager.disablePlugin plugin
    @updateFromPluginManager()
  handleInstall: async (name) ->
    if !@props.disabled
      installingPluginNames = @state.installingPluginNames
      installingPluginNames.push name
      @setState installingPluginNames: installingPluginNames, npmWorkding: true
      try
        yield PluginManager.installPlugin(name)
        installingPluginNames = @state.installingPluginNames
        index = installingPluginNames.indexOf name
        if index > -1
          installingPluginNames.splice index, 1
          yield @updateFromPluginManager {
            installingPluginNames: installingPluginNames
            npmWorkding: false
          }
        else
          yield @updateFromPluginManager npmWorkding: false
      catch error
        yield @updateFromPluginManager npmWorkding: false
        throw error
  handleUpdate: async (index) ->
    if !@props? || !@props.disabled
      @state.plugins[index].isUpdating = true
      @setState npmWorkding: true
      plugins = yield PluginManager.getInstalledPlugins()
      plugin = plugins[index]
      try
        yield PluginManager.updatePlugin(plugin)
        yield @updateFromPluginManager npmWorkding: false
      catch error
        yield @updateFromPluginManager npmWorkding: false
        throw error
  handleInstallAll: async ->
    @setState installingAll: true
    settings = yield PluginManager.getUninstalledPluginSettings()
    for name, value of settings
      yield @handleInstall(name)
    @setState
      installingAll: false
  handleUpdateAll: async ->
    if !@props.disabled
      @setState updatingAll: true
      err = null
      for plugin, index in @state.plugins
        if @state.plugins[index].isOutdated
          try
            yield @handleUpdate(index)
          catch error
            err = error
      if !err
        @setState
          hasUpdates: false
          updatingAll: false
      else
        @setState
          updatingAll: false
  handleRemove: async (index) ->
    if !@props.disabled
      @state.plugins[index].isUninstalling = true
      @setState npmWorkding: true
      try
        plugins = yield PluginManager.getInstalledPlugins()
        plugin = plugins[index]
        yield PluginManager.uninstallPlugin(plugin)
        @updateFromPluginManager npmWorkding: false
      catch error
        @setState npmWorkding: false
        throw error
  checkUpdate: async ->
    @setState checkingUpdate: true
    plugins = yield PluginManager.getOutdatedPlugins()
    @updateFromPluginManager {
      hasUpdates: plugins.length isnt 0
      checkingUpdate: false
    }
  onSelectOpenFolder: ->
    shell.openItem path.join PLUGIN_PATH, 'node_modules'
  onSelectOpenSite: (e) ->
    shell.openExternal "https://www.npmjs.com/search?q=poi-plugin"
    e.preventDefault()
  onSelectInstallFromFile: ->
    @synchronize async =>
      filenames = dialog.showOpenDialog
        title: __ 'Select files'
        defaultPath: remote.require('electron').app.getPath('downloads')
        properties: ['openFile', 'multiSelections']
      if filenames
        settings = yield PluginManager.getUninstalledPluginSettings()
        for filename in filenames
          @setState manuallyInstallStatus: 1
          try
            yield @handleInstall(filename)
            @setState manuallyInstallStatus: 2
          catch error
            @setState manuallyInstallStatus: 3
  onDropInstallFromFile: async (e) ->
    e.preventDefault()
    droppedFiles = e.dataTransfer.files
    filenames = []
    for droppedFile in droppedFiles
      filenames.push droppedFile.path
    if filenames
      settings = yield PluginManager.getUninstalledPluginSettings()
      for filename in filenames
        @setState manuallyInstallStatus: 1
        try
          yield @handleInstall(filename)
          @setState manuallyInstallStatus: 2
        catch error
          @setState manuallyInstallStatus: 3
  handleManuallyInstall: async (name) ->
    @setState manuallyInstallStatus: 1
    settings = yield PluginManager.getUninstalledPluginSettings()
    try
      yield @handleInstall(name)
      @setState manuallyInstallStatus: 2
    catch error
      @setState manuallyInstallStatus: 3
  synchronize: (callback) ->
    return if @lock
    @lock = true
    callback()
    @lock = false
  componentDidUpdate: (prevProps, prevState) ->
    if prevState.manuallyInstallStatus > 1 && prevState.manuallyInstallStatus == @state.manuallyInstallStatus
      @setState
        manuallyInstallStatus: 0
  componentDidMount: async ->
    mirrors = yield PluginManager.getMirrors()
    PluginManager.readPlugins(true)
    config = yield PluginManager.getConf()
    @updateFromPluginManager {
      checkingUpdate: true
      mirrors: mirrors
      config: config
    }
    plugins = yield PluginManager.getOutdatedPlugins(true)
    @updateFromPluginManager {
      hasUpdates: plugins.length isnt 0
      checkingUpdate: false
      mirrors: mirrors
      config: config
    }
  render: ->
    <form>
      <Divider text={__ 'Plugins'} />
      <Grid>
        <Col xs={12}>
          <Alert bsStyle='info'>
            {__ 'You must reboot the app for the changes to take effect.'}
          </Alert>
        </Col>
      </Grid>
      <Grid>
        <Col xs={12} style={padding: '10px 15px'}>
          <ButtonGroup bsSize='small' style={width: '100%'}>
            <Button onClick={@checkUpdate}
                    disabled={@state.checkingUpdate}
                    className="control-button"
                    style={width: '25%'}>
              <FontAwesome name='refresh' spin={@state.checkingUpdate} />
              <span> {__ "Check Update"}</span>
            </Button>
            <Button onClick={@handleUpdateAll}
                    disabled={@state.npmWorkding ||
                      !@state.hasUpdates || @state.checkingUpdate}
                    className="control-button"
                    style={width: '25%'}>
              <FontAwesome name={if @state.updatingAll then 'spinner' else 'cloud-download'}
                           pulse={@state.updatingAll}/>
              <span> {__ "Update all"}</span>
            </Button>
            <Button onClick={@handleInstallAll}
                    disabled={@state.npmWorkding}
                    className="control-button"
                    style={width: '25%'}>
              <FontAwesome name={if @state.installingAll then 'spinner' else 'download'}
                           pulse={@state.installingAll}/>
              <span> {__ "Install all"}</span>
            </Button>
            <Button onClick={@handleAdvancedShow}
                    className="control-button"
                    style={width: '25%'}>
              <FontAwesome name="gear" />
              <span> {__ "Advanced"} </span>
              <FontAwesome name="#{if @state.advanced then 'angle-up' else 'angle-down'}" />
            </Button>
          </ButtonGroup>
          <Collapse in={@state.advanced}>
            <div>
              <Well>
                <Row>
                  <Col xs=12>
                    {
                      installButton =
                        <Button bsStyle='primary'
                                disabled={@state.manuallyInstallStatus == 1 || @state.npmWorkding}
                                onClick={@handleManuallyInstall.bind @, @state.manuallyInstallPackage}>
                          {__ 'Install'}
                        </Button>
                      <Input type="text"
                             value={@state.manuallyInstallPackage}
                             onChange={@changeInstalledPackage}
                             label={__ 'Install directly from npm'}
                             disabled={@state.manuallyInstallStatus == 1 || @state.npmWorkding}
                             placeholder={__ 'Input plugin package name...'}
                             bsSize='small'
                             buttonAfter={installButton} />
                    }
                  </Col>
                  <Col xs=12>
                    <label className='control-label' style={width: '100%'}>
                      {__ 'Select npm server'}
                    </label>
                    {
                      index = -1
                      for server of @state.mirrors
                        index++
                        <OverlayTrigger placement='top' key={index} overlay={<Tooltip id="npm-server-#{index}">{@state.mirrors[server].menuname}</Tooltip>}>
                          <Col key={index} xs=6 style={padding: '0px 5px'}>
                            <Input type="radio"
                                   label={@state.mirrors[server].name}
                                   checked={@state.config.mirror.server == @state.mirrors[server].server}
                                   onChange={@onSelectServer.bind @, server} />
                          </Col>
                        </OverlayTrigger>
                    }
                  </Col>
                  <Col xs=12>
                    <label className='control-label' style={width: '100%'}>
                      {__ 'Others'}
                    </label>
                    <div>
                      <Input type="checkbox" label={__ 'Connect to npm server through proxy'}
                             checked={@state.config.proxy}
                             onChange={@handleEnableProxy} />
                    </div>
                    <div>
                      <Input type="checkbox" label={__ 'Developer option: check update of beta version'}
                             checked={@state.config.betaCheck}
                             onChange={@handleEnableBetaPluginCheck} />
                    </div>
                    <ButtonGroup style={width: '100%'}>
                      <Button style={width: '50%'} onClick={@onSelectOpenFolder}>
                        {__ 'Open plugin folder'}
                      </Button>
                      <Button style={width: '50%'} onClick={@onSelectOpenSite}>
                        {__ 'Search for plugins'}
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Well>
            </div>
          </Collapse>
        </Col>
        <Collapse in={@state.manuallyInstallStatus > 0}>
          <Col xs=12 style={paddingBottom: 10}>
            <Alert bsStyle={
                switch @state.manuallyInstallStatus
                  when 1
                    "info"
                  when 2
                    "success"
                  when 3
                    "danger"
              }>
              {
                switch @state.manuallyInstallStatus
                  when 1
                    __("Installing") + "..."
                  when 2
                    __ "Plugins are installed successfully. Please restart poi to take effect."
                  when 3
                    __ "Install failed. Maybe the selected files are not plugin packages."
              }
            </Alert>
          </Col>
        </Collapse>
        <Col xs={12} style={paddingBottom: 10}>
          <div className="folder-picker"
               onClick={@onSelectInstallFromFile}
               onDrop={@onDropInstallFromFile}
               onDragEnter={(e)=> e.preventDefault()}
               onDragOver={(e)=> e.preventDefault()}
               onDragLeave={(e)=> e.preventDefault()}>
            {__ "Drop plugin packages here to install it, or click here to select them"}
          </div>
        </Col>
      {
        for plugin, index in @state.plugins
          <InstalledPlugin
            key={plugin.name}
            index={index}
            plugin={plugin}
            handleClickAuthorLink={@handleClickAuthorLink}
            handleUpdate={@handleUpdate}
            handleEnable={@handleEnable}
            handleRemove={@handleRemove}
            />
      }
      {
        for name, index in Object.keys(@state.uninstalledPluginSettings)
          value = @state.uninstalledPluginSettings[name]
          <UninstalledPlugin
            key={name}
            name={name}
            record={value}
            npmWorkding={@state.npmWorkding}
            installing={name in @state.installingPluginNames}
            handleClickAuthorLink={@handleClickAuthorLink}
            handleInstall={@handleInstall}
            />
      }
      </Grid>
    </form>

module.exports = PluginConfig
