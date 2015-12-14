Promise = require 'bluebird'
path = require 'path-extra'
glob = require 'glob'
{__, __n} = require 'i18n'
fs = require 'fs-extra'
npm = require 'npm'
semver = require 'semver'
{$, $$, _, PluginManager, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Input, Alert, Button, ButtonGroup, DropdownButton, MenuItem, Label} = ReactBootstrap
{config} = window
shell = require 'shell'
Divider = require './divider'


PluginConfig = React.createClass
  getInitialState: ->
    checkingUpdate: false
    hasUpdates: false
    npmWorkding: false
    installingAll: false
    installingPluginNames: []
    mirrorName: ''
    mirrors: []
    plugins: []
    uninstalledPluginSettings: []
    updatingAll: false
    reloading: false
  emitReload: ->
    PluginManager.emitReload()
  readPlugins: ->
    initState = @getInitialState()
    initState.reloading = true
    @setState initState
    PluginManager.getMirrors().then (mirrors) =>
      PluginManager.getMirror().then (mirror) =>
        PluginManager.readPlugins().then =>
          @updateFromPluginManager {
            mirrors: mirrors
            mirrorName: mirror.name
            reloading: false
          }
  updateFromPluginManager: (state) ->
    state ?= {}
    PluginManager.getInstalledPlugins().then (plugins) =>
      PluginManager.getUninstalledPluginSettings().then (settings) =>
        state.plugins = plugins
        state.uninstalledPluginSettings = settings
        @setState state
  handleClickAuthorLink: (link, e) ->
    shell.openExternal link
    e.preventDefault()
  onSelectServer: (index) ->
    PluginManager.selectMirror(index).then (mirror) =>
      @setState mirrorName: mirror.name
  handleEnable: (index) ->
    PluginManager.getInstalledPlugins().then (plugins) =>
      plugin = plugins[index]
      switch PluginManager.getStatusOfPlugin plugin
        when PluginManager.DISABLED
          PluginManager.enablePlugin plugin
        when PluginManager.VALID
          PluginManager.disablePlugin plugin
      @updateFromPluginManager()
  handleUpdate: (index) ->
    if !@props.disabled
      @setState npmWorkding: true
      PluginManager.getInstalledPlugins().then (plugins) =>
        plugin = plugins[index]
        PluginManager.updatePlugin(plugin).then =>
          @updateFromPluginManager npmWorkding: false
  handleInstallAll: ->
    @setState installingAll: true
    PluginManager.getUninstalledPluginSettings().then (settings) =>
      Promise.coroutine( =>
        for name, value of settings
          yield @handleInstall name
        @setState installingAll: false
      )()
  handleUpdateAll: ->
    if !@props.disabled
      @setState updatingAll: true
      PluginManager.getOutdatedPlugins().then (plugins) =>
        Promise.coroutine( =>
          for plugin, index in plugins
            yield @handleUpdate index
        ).then =>
          @setState updatingAll: false
  handleRemove: (index) ->
    if !@props.disabled
      PluginManager.getInstalledPlugins().then (plugins) =>
        plugin = plugins[index]
        @setState npmWorkding: true
        PluginManager.uninstallPlugin(plugin).then =>
          @updateFromPluginManager npmWorkding: false
  handleInstall: (name) ->
    if !@props.disabled
      installingPluginNames = @state.installingPluginNames
      installingPluginNames.push name
      @setState installingPluginNames: installingPluginNames, npmWorkding: true
      PluginManager.installPlugin(name).then =>
        installingPluginNames = @state.installingPluginNames
        index = installingPluginNames.indexOf name
        if index > -1
          installingPluginNames.splice index, 1
          @updateFromPluginManager {
            installingPluginNames: installingPluginNames
            npmWorkding: false
          }
  onSelectOpenFolder: ->
    shell.openItem path.join PLUGIN_PATH, 'node_modules'
  checkUpdate: ->
    @setState checkingUpdate: true
    PluginManager.getOutdatedPlugins().then (plugins) =>
      @updateFromPluginManager {
        hasUpdates: plugins.length isnt 0
        checkingUpdate: false
      }
  componentDidMount: ->
    PluginManager.getMirrors().then (mirrors) =>
      PluginManager.getMirror().then (mirror) =>
        @updateFromPluginManager mirrors: mirrors, mirrorName: mirror.name
  render: ->
    <form>
      <Divider text={__ 'Plugins'} />
      <Grid>
        <Col xs={12} style={padding: '10px 15px'}>
          <ButtonGroup bsSize='small' style={width: '75%'}>
            <Button onClick={@checkUpdate}
                    disabled={@state.checkingUpdate}
                    className="control-button"
                    style={width: '33%'}>
              <FontAwesome name='refresh' spin={@state.checkingUpdate} />
              <span> {__ "Check Update"}</span>
            </Button>
            <Button onClick={@handleUpdateAll}
                    disabled={@state.npmWorkding ||
                      !@state.hasUpdates || @state.checkingUpdate}
                    className="control-button"
                    style={width: '33%'}>
              <FontAwesome name={if @state.updatingAll then 'spinner' else 'cloud-download'}
                           pulse={@state.updatingAll}/>
              <span> {__ "Update all"}</span>
            </Button>
            <Button onClick={@handleInstallAll}
                    disabled={@state.npmWorkding}
                    className="control-button"
                    style={width: '33%'}>
              <FontAwesome name={if @state.installingAll then 'spinner' else 'download'}
                           pulse={@state.installingAll}/>
              <span> {__ "Install all"}</span>
            </Button>
          </ButtonGroup>
          <ButtonGroup bsSize='small' style={width: '25%', paddingLeft: 6}>
            <DropdownButton style={width: '100%'}
                            className="control-button"
                            pullRight
                            title={
                              React.createElement("span",
                                null, React.createElement(FontAwesome, {
                                  "name": 'server'
                                }), " ", @state.mirrorName)
                            }
                            id="mirror-select">
              {
                for mirror, index in @state.mirrors
                  <MenuItem key={index}
                            onSelect={@onSelectServer.bind @, index}>
                    {mirror.menuname}
                  </MenuItem>
              }
              <MenuItem divider />
              <MenuItem key={index}
                        onSelect={@onSelectOpenFolder}>
                {__ "Manually install"}
              </MenuItem>
            </DropdownButton>
          </ButtonGroup>
          <ButtonGroup bsSize='small' style={width: '100%', marginTop: 10}>
            <Button onClick={@readPlugins}
                    disabled={@state.reloading}
                    className="control-button"
                    style={width: '50%'}>
              <FontAwesome name={if @state.reloading then 'spinner' else 'repeat'}
                           pulse={@state.reloading}/>
              <span> {__ "Reload all"}</span>
            </Button>
            <Button onClick={@emitReload}
                    className="control-button"
                    style={width: '50%'}>
              <FontAwesome name='rocket' />
              <span> {__ "Apply Change"}</span>
            </Button>
          </ButtonGroup>
        </Col>
      {
        for plugin, index in @state.plugins
          <Col key={index} xs={12} style={marginBottom: 8}>
            <Col xs={12} className='div-row'>
              <span style={fontSize: '150%'}> {plugin.displayName} </span>
              <span style={paddingTop: 2}> @
                <span onClick={@handleClickAuthorLink.bind @, plugin.link}>
                  {plugin.author}
                </span>
              </span>
              <div style={paddingTop: 2}>
                <Label bsStyle='primary'
                       className="#{if not plugin.isOutdated then 'hidden'}">
                  <FontAwesome name='cloud-upload' />
                  Version {plugin.lastVersion}
                </Label>
              </div>
              <div style={paddingTop: 2, marginLeft: 'auto'}>
                Version {plugin.version || plugin.packageData.version || '1.0.0'}
              </div>
            </Col>
            <Col xs={12} style={marginTop: 4}>
              <Col xs={5}>{plugin.description}</Col>
              <Col xs={7} style={padding: 0}>
                <div style={marginLeft: 'auto'}>
                  <ButtonGroup bsSize='small' style={width: '100%'}>
                    <Button bsStyle='info'
                            disabled={PluginManager.getStatusOfPlugin(plugin) == PluginManager.NEEDUPDATE}
                            onClick={@handleEnable.bind @, index}
                            style={width: "33%"}
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
                      {
                        switch PluginManager.getStatusOfPlugin plugin
                          when PluginManager.VALID
                            __ "Disable"
                          when PluginManager.DISABLED
                            __ "Enable"
                          when PluginManager.NEEDUPDATE
                            __ "Outdated"
                          when PluginManager.BROKEN
                            __ "Broken"
                      }
                    </Button>
                    <Button bsStyle='primary'
                            disabled={not plugin.isOutdated || plugin.isUpdating || @state.npmWorkding || @state.checkingUpdate}
                            onClick={@handleUpdate.bind @, index}
                            style={width: "33%"}
                            className="plugin-control-button">
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
                           __ "Update"
                        else
                           __ "Latest"
                      }
                    </Button>
                    <Button bsStyle='danger'
                            onClick={@handleRemove.bind @, index}
                            disabled={not plugin.isInstalled}
                            style={width: "33%"}
                            className="plugin-control-button">
                      <FontAwesome name={if plugin.isInstalled then 'trash' else 'trash-o'} />
                      {
                        if plugin.isUninstalling
                          __ "Removing"
                        else if plugin.isInstalled
                          __ "Remove"
                        else
                          __ "Removed"
                      }
                    </Button>
                  </ButtonGroup>
                </div>
              </Col>
            </Col>
          </Col>
      }
      {
        for name, index in Object.keys(@state.uninstalledPluginSettings)
          value = @state.uninstalledPluginSettings[name]
          <Col key={index} xs={12} style={marginBottom: 8}>
            <Col xs={12} className='div-row'>
              <span style={fontSize: '150%'}>
                <FontAwesome name={value.icon} />
                  {value[window.language]}
                </span>
              <span style={paddingTop: 2}> @
                <span onClick={@handleClickAuthorLink.bind @, value.link}>
                  {value.author}
                </span>
              </span>
            </Col>
            <Col xs={12} style={marginTop: 4}>
              <Col xs={8}>{value["des#{window.language}"]}</Col>
              <Col xs={4} style={padding: 0}>
                <div style={marginLeft: 'auto'}>
                  <ButtonGroup bsSize='small' style={width: '100%'}>
                    <Button bsStyle='primary'
                            disabled={@state.npmWorkding}
                            onClick={@handleInstall.bind @, name}
                            style={width: "100%"}
                            className="plugin-control-button">
                      <FontAwesome name={
                                     if name in @state.installingPluginNames
                                       'downloading'
                                     else
                                       'download'
                                   }
                                   pulse={name in @state.installingPluginNames}/>
                      {
                        if name in @state.installingPluginNames
                          __ "Installing"
                        else
                          __ "Install"
                      }
                    </Button>
                  </ButtonGroup>
                </div>
              </Col>
            </Col>
          </Col>
      }
      </Grid>
    </form>

module.exports = PluginConfig
