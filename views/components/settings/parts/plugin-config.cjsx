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
classnames = require 'classnames'
updateNotif = config.get 'packageManager.enablePluginCheck', true

openLink = (link, e) ->
  shell.openExternal link
  e.preventDefault()

PluginSettingWrap = React.createClass
  shouldComponentUpdate: (nextProps, nextState)->
    false
  render: ->
    React.createElement @props.plugin.settingsClass

# A collapsible panel that automatically hides itself after collapsed
# to avoid the two borders that still remains when height=0
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
    className = classnames @props.className,
      'hidden': @state.hide
    <Panel {...@props} className={className} />

InstalledPlugin = React.createClass
  getInitialState: ->
    settingOpen: false

  toggleSettingPop: ->
    @setState
      settingOpen: !@state.settingOpen

  render: ->
    plugin = @props.plugin
    <Row className='plugin-wrapper'>
      <Col xs={12}>
        <Row>
          <Col xs={12} className='div-row'>
            <span className='plugin-name'>
              {plugin.displayName}
            </span>
            <div className='author-wrapper'>{'@'}
              <span className='author-link'
                onClick={_.partial openLink, plugin.link}>
                {plugin.author}
              </span>
            </div>
            <div className='update-wrapper'>
              <div>
                <Label bsStyle="#{if plugin?.lastestVersion?.indexOf('beta') == -1 then 'primary' else 'warning'}"
                       className="update-label #{if not plugin.isOutdated then 'hidden'}"
                       onClick={@props.handleUpdate}>
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
          <Col xs={5}>
            <ButtonGroup bsSize='small' className="plugin-buttongroup btn-xs-#{if plugin.settingsClass? then 12 else 8}">
              {
                if plugin.settingsClass?
                  <OverlayTrigger placement='top' overlay={
                     <Tooltip id="#{plugin.id}-set-btn">
                       {__ 'Settings'}
                     </Tooltip>
                     }>
                     <Button ref='setting-btn'
                             bsStyle='primary' bsSize='xs'
                             onClick={@toggleSettingPop}
                             className='plugin-control-button btn-xs-4'>
                       <FontAwesome name='gear' />
                     </Button>
                   </OverlayTrigger>
              }
              <OverlayTrigger placement='top' overlay={
                <Tooltip id="#{plugin.id}-enb-btn">
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
                  onClick={@props.handleEnable}
                  className="plugin-control-button btn-xs-#{if plugin.settingsClass? then 4 else 6}">
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
                <Tooltip id="#{plugin.id}-rm-btn">
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
                  onClick={@props.handleRemove}
                  disabled={not plugin.isInstalled}
                  className="plugin-control-button btn-xs-#{if plugin.settingsClass? then 4 else 6}">
                  <FontAwesome name={if plugin.isInstalled then 'trash' else 'trash-o'} />
                </Button>
              </OverlayTrigger>
            </ButtonGroup>
          </Col>
        </Row>
        <Row>
          {
            if plugin.settingsClass?
              <Collapse in={@state.settingOpen} className='plugin-setting-wrapper'>
                <Col xs={12}>
                  <Well>
                    <PluginSettingWrap plugin={plugin} />
                  </Well>
                </Col>
              </Collapse>
          }
        </Row>
      </Col>
    </Row>

UninstalledPlugin = React.createClass
  render: ->
    plugin = @props.plugin
    <Row className='plugin-wrapper'>
      <Col xs={12}>
        <Row>
          <Col xs={12} className='div-row'>
            <span className='plugin-name'>
              <FontAwesome name={plugin.icon} />
                {' ' + plugin[window.language]}
            </span>
            <div className='author-wrapper'>{'@'}
              <span className='author-link'
                onClick={_.partial openLink, plugin.link}>
                {plugin.author}
              </span>
            </div>
          </Col>
        </Row>
        <Row>
          <Col xs={7}>{plugin["des#{window.language}"]}</Col>
          <Col xs={5}>
            <ButtonGroup bsSize='small' className='plugin-buttongroup btn-xs-4'>
              <OverlayTrigger placement='top' overlay={
                <Tooltip id="#{plugin.id}-ins-btn">
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
                  onClick={@props.handleInstall}
                  className='plugin-control-button btn-xs-12'>
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
          </Col>
        </Row>
      </Col>
    </Row>

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
  updateFromPluginManager: async (newState) ->
    newState ?= {}
    plugins = yield PluginManager.getInstalledPlugins()
    settings = yield PluginManager.getUninstalledPluginSettings()
    newState.plugins = plugins
    newState.uninstalledPluginSettings = settings
    @setState newState
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
    PluginManager.getPlugins(true)
    config = yield PluginManager.getConf()
    @updateFromPluginManager {
      checkingUpdate: true
      mirrors: mirrors
      config: config
    }
    plugins = yield PluginManager.getOutdatedPlugins(updateNotif)
    @updateFromPluginManager {
      hasUpdates: plugins.length isnt 0
      checkingUpdate: false
      mirrors: mirrors
      config: config
    }
  render: ->
    <form className='contents-wrapper'>
      <Grid className='correct-container'>
        <Row>
          <Divider text={__ 'Plugins'} />
        </Row>
        <Row className='plugin-rowspace'>
          <Col xs={12}>
            <ButtonGroup bsSize='small' className='plugin-buttongroup'>
              <Button onClick={@checkUpdate}
                      disabled={@state.checkingUpdate}
                      className='control-button col-xs-3'>
                <FontAwesome name='refresh' spin={@state.checkingUpdate} />
                <span> {__ "Check Update"}</span>
              </Button>
              <Button onClick={@handleUpdateAll}
                      disabled={@state.npmWorkding ||
                        !@state.hasUpdates || @state.checkingUpdate}
                      className='control-button col-xs-3'>
                <FontAwesome name={if @state.updatingAll then 'spinner' else 'cloud-download'}
                             pulse={@state.updatingAll}/>
                <span> {__ "Update all"}</span>
              </Button>
              <Button onClick={@handleInstallAll}
                      disabled={@state.npmWorkding}
                      className='control-button col-xs-3'>
                <FontAwesome name={if @state.installingAll then 'spinner' else 'download'}
                             pulse={@state.installingAll}/>
                <span> {__ "Install all"}</span>
              </Button>
              <Button onClick={@handleAdvancedShow}
                      className='control-button col-xs-3'>
                <FontAwesome name="gear" />
                <span> {__ "Advanced"} </span>
                <FontAwesome name="#{if @state.advanced then 'angle-up' else 'angle-down'}" />
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Collapse in={@state.advanced}>
              <div>
                <Well>
                  <Row>
                    <Col xs=12>
                      <Row>
                        <Col xs=12>
                          <label className='control-label'>
                            {__ 'Select npm server'}
                          </label>
                        </Col>
                      </Row>
                      <Row>
                      {
                        index = -1
                        for server of @state.mirrors
                          index++
                          <OverlayTrigger placement='top' key={index} overlay={<Tooltip id="npm-server-#{index}">{@state.mirrors[server].menuname}</Tooltip>}>
                            <Col key={index} xs=6 className='select-npm-server'>
                              <Input type='radio'
                                     label={@state.mirrors[server].name}
                                     checked={@state.config.mirror.server == @state.mirrors[server].server}
                                     onChange={@onSelectServer.bind @, server} />
                            </Col>
                          </OverlayTrigger>
                      }
                      </Row>
                    </Col>
                    <Col xs=12>
                      <Row>
                        <Col xs=12>
                          <label className='control-label'>
                            {__ 'Others'}
                          </label>
                        </Col>
                      </Row>
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
                      <Row>
                        <ButtonGroup className='plugin-buttongroup'>
                          <Button className='col-xs-6' onClick={@onSelectOpenFolder}>
                            {__ 'Open plugin folder'}
                          </Button>
                          <Button className='col-xs-6' onClick={@onSelectOpenSite}>
                            {__ 'Search for plugins'}
                          </Button>
                        </ButtonGroup>
                      </Row>
                    </Col>
                  </Row>
                </Well>
              </div>
            </Collapse>
          </Col>
        </Row>
        <Row className='plugin-rowspace'>
          <Collapse in={@state.manuallyInstallStatus > 0}>
            <Col xs=12>
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
                      __ "Plugins are installed successfully."
                    when 3
                      __ "Install failed. Maybe the selected files are not plugin packages."
                }
              </Alert>
            </Col>
          </Collapse>
        </Row>
        <Row className='plugin-rowspace'>
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
          <Col xs={12}>
            <div className="folder-picker"
                 onClick={@onSelectInstallFromFile}
                 onDrop={@onDropInstallFromFile}
                 onDragEnter={(e)=> e.preventDefault()}
                 onDragOver={(e)=> e.preventDefault()}
                 onDragLeave={(e)=> e.preventDefault()}>
              {__ "Drop plugin packages here to install it, or click here to select them"}
            </div>
          </Col>
        </Row>
        {
          for plugin, index in @state.plugins
            <InstalledPlugin
              key={plugin.id}
              plugin={plugin}
              handleUpdate={_.partial @handleUpdate, index}
              handleEnable={_.partial @handleEnable, index}
              handleRemove={_.partial @handleRemove, index}
              />
        }
        {
          for name, index in Object.keys(@state.uninstalledPluginSettings)
            value = @state.uninstalledPluginSettings[name]
            <UninstalledPlugin
              key={name}
              plugin={value}
              npmWorkding={@state.npmWorkding}
              installing={name in @state.installingPluginNames}
              handleInstall={_.partial @handleInstall, name}
              />
        }
      </Grid>
    </form>

module.exports = PluginConfig
