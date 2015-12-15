path = require 'path-extra'
glob = require 'glob'
{__, __n} = require 'i18n'
fs = require 'fs-extra'
npm = require 'npm'
semver = require 'semver'
{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Input, Alert, Button, ButtonGroup, DropdownButton, MenuItem, Label} = ReactBootstrap
{config} = window
shell = require 'shell'
Divider = require './divider'

# Plugin version
packages = fs.readJsonSync path.join ROOT, 'plugin.json'

# Mirror server
mirror = fs.readJsonSync path.join ROOT, 'mirror.json'

plugins = glob.sync(path.join(PLUGIN_PATH, 'node_modules', 'poi-plugin-*'))
fails = []
failsName = []
for plugin, index in plugins
  try
    test = require plugin
  catch error
    fail = path.basename plugin
    fails.push plugin
    if packages[fail]?
      failsName.push packages[fail][window.language]
    else
      failsName.push fail
if fails.length > 0
  title = __ 'Plugin error'
  content = "#{failsName.join(' ')} #{__ "failed to load. Maybe there are some compatibility problems."}"
  notify content,
    type: 'plugin error'
    title: title
    icon: path.join(ROOT, 'assets', 'img', 'material', '7_big.png')
    audio: "file://#{ROOT}/assets/audio/fail.mp3"
plugins = plugins.filter (filePath) ->
  if filePath in fails
    return false
  else
    return true
plugins = plugins.map (filePath) ->
  plugin = require filePath
  packageData = {}
  try
    packageData = fs.readJsonSync path.join filePath, 'package.json'
  catch error
    if env.process.DEBUG? then console.log error
  if packageData?.name?
    plugin.packageName =  packageData.name
  else
    plugin.packageName = plugin.name
  if packageData?.version?
    plugin.version = packageData.version
  plugin.priority = 10000 unless plugin.priority?
  plugin
plugins = _.sortBy(plugins, 'priority')

status = plugins.map (plugin) ->
  # 0: enabled 1: manually disabled 2: disabled because too old
  if packages[plugin.packageName]?.version?
    lowest = packages[plugin.packageName].version
  else
    lowest = "v0.0.0"
  if semver.lt(plugin.version, lowest)
    status = 2
  else if config.get "plugin.#{plugin.name}.enable", true
    status = 0
  else status = 1

updating = plugins.map (plugin) ->
  updating = false

removeStatus = plugins.map (plugin) ->
  # 0: exist 1: removing 2: removed
  removeStatus = 0

latest = {}
installTargets = packages
for plugin, index in plugins
  latest[plugin.packageName] = plugin.version
  delete installTargets[plugin.packageName]

installStatus = []
for installTarget of installTargets
  # 0: not installed 1: installing 2: installed
  installStatus.push 0

npmConfig = {
  prefix: "#{PLUGIN_PATH}",
  registry: mirror[config.get "packageManager.mirror", 0].server,
  http_proxy: 'http://127.0.0.1:12450'
}

PluginConfig = React.createClass
  getInitialState: ->
    status: status
    latest: latest
    updating: updating
    installStatus: installStatus
    removeStatus: removeStatus
    checking: false
    updatingAll: false
    installing: false
    mirror: config.get "packageManager.mirror", 0
    isUpdateAvailable: false
  isUpdateAvailable: false
  checkCount: 0
  handleClickAuthorLink: (link, e) ->
    shell.openExternal link
    e.preventDefault()
  onSelectServer: (state) ->
    config.set "packageManager.mirror", state
    server = mirror[state].server
    npmConfig = {
      prefix: "#{PLUGIN_PATH}",
      registry: mirror[state].server,
      http_proxy: 'http://127.0.0.1:12450'
    }
    @setState
      mirror: state
  handleEnable: (index) ->
    status = @state.status
    if status[index] isnt 2
      status[index] = (status[index] + 1) % 2
      if status[index] == 0 then enable = true
      if status[index] == 1 then enable = false
      config.set "plugin.#{plugins[index].name}.enable", enable
    @setState
      status: status
  handleUpdateComplete: (index, er) ->
    plugins[index].version = @state.latest[plugins[index].packageName] if !er
    updating = @state.updating
    updating[index] = false
    @checkUpdate(@solveUpdate, false)
    @setState {updating}
  handleUpdate: (index, callback) ->
    if !@props.disabled
      updating = @state.updating
      updating[index] = true
      npm.load npmConfig, (err) ->
        npm.commands.update [plugins[index].packageName], (er, data) ->
          callback(index, er)
      @setState {updating}
  handleInstallAllComplete: (er) ->
    installAllStatus = []
    index = -1
    for installTarget of installTargets
      index++
      if !er
        installAllStatus.push 2
      else
        if @state.installStatus[index] < 2
          installAllStatus.push 0
        else
          installAllStatus.push 2
    @setState
      installStatus: installAllStatus
      installing: false
  handleInstallAll: (callback) ->
    installAllStatus = []
    toInstall = []
    index = -1
    for installTarget of installTargets
      index++
      if @state.installStatus[index] == 0
        installAllStatus.push 1
        toInstall.push installTarget
      else
        installAllStatus.push @state.installStatus[index]
    npm.load npmConfig, (err) ->
      npm.commands.install toInstall, (er, data) ->
        callback(er)
    @setState
      installStatus: installAllStatus
      installing: true
  handleUpdateAllComplete: (er) ->
    updating = @state.updating
    for plugin, index in plugins
      plugin.version = @state.latest[plugin.packageName] if !er
      updating[index] = false
    @checkUpdate(@solveUpdate, false)
    @setState
      updating: updating
      updatingAll: false
  handleUpdateAll: (callback) ->
    if !@props.disabled
      updating = @state.updating
      toUpdate = []
      for plugin, index in plugins
        if semver.lt(plugin.version, @state.latest[plugin.packageName]) && @state.removeStatus[index] == 0
          updating[index] = true
          toUpdate.push plugin.packageName
      npm.load npmConfig, (err) ->
        npm.commands.update toUpdate, (er, data) ->
          callback(er)
      @setState
        updating: updating
        updatingAll: true
  handleRemoveComplete: (index) ->
    removeStatus = @state.removeStatus
    removeStatus[index] = 2
    @setState {removeStatus}
  handleRemove: (index, callback) ->
    if !@props.disabled
      removeStatus = @state.removeStatus
      removeStatus[index] = 1
      npm.load npmConfig, (err) ->
        npm.commands.uninstall [plugins[index].packageName], (er, data) ->
          callback(index)
      @setState {removeStatus}
  handleInstallComplete: (index, er) ->
    installStatus = @state.installStatus
    installStatus[index] = 2
    installStatus[index] = 0 if er
    @setState {installStatus}
  handleInstall: (name, index, callback) ->
    if !@props.disabled
      installStatus = @state.installStatus
      installStatus[index] = 1
      npm.load npmConfig, (err) ->
        npm.commands.install [name], (er, data) ->
          callback(index, er)
      @setState {installStatus}
  solveUpdate: (updateData, isfirst) ->
    if config.get 'enableBetaPluginCheck', false
      latest = @state.latest
      latestVersion = updateData.latest
      if semver.lt(latestVersion, updateData.beta ? "0.0.0")
        latestVersion = updateData.beta
      if latest[updateData.packageName]? && semver.lt(latest[updateData.packageName], latestVersion)
        latest[updateData.packageName] = latestVersion
        @isUpdateAvailable = true
      #console.log "checkCount: #{@checkCount}"
      @checkCount--
    else
      latest = @state.latest
      updateCount = 0
      for updateObject, index in updateData
        if latest[updateObject[1]]? && semver.lt(latest[updateObject[1]], updateObject[4])
          latest[updateObject[1]] = updateObject[4]
          updateCount++
      @isUpdateAvailable = updateCount > 0
    if (@checkCount is 0)
      if isfirst && @isUpdateAvailable
        title = __ 'Plugin update'
        outdatedPlugins = []
        for plugin, index in plugins
          if semver.lt(plugin.version, latest[plugin.packageName])
            if plugin.displayName.props?.children?
              displayItems = plugin.displayName.props.children
            else
              displayItems = plugin.displayName
            for child in displayItems
              if typeof child is "string"
                outdatedPlugins.push child
        content = "#{outdatedPlugins.join(' ')} #{__ "have newer version. Please update your plugins."}"
        notify content,
          type: 'plugin update'
          title: title
          icon: path.join(ROOT, 'assets', 'img', 'material', '7_big.png')
          audio: "file://#{ROOT}/assets/audio/update.mp3"
      @setState
        latest: latest
        checking: false
        isUpdateAvailable: @isUpdateAvailable
  checkUpdate: (callback, isfirst) ->
    latest = @state.latest
    for plugin in plugins
      latest[plugin.packageName] = plugin.version
    @isUpdateAvailable = false
    if config.get 'enableBetaPluginCheck', false
      npm.load npmConfig, (err) =>
        @checkCount = plugins.length
        for plugin in plugins
          packageName = plugin.packageName
          npm.commands.distTag ['ls', plugin.packageName], do (packageName) ->
            (er, data) ->
              callback(Object.assign({packageName: packageName}, data), isfirst)
    else
      npm.load npmConfig, (err) ->
        npm.config.set 'depth', 1
        npm.commands.outdated [], (er, data) ->
          callback(data, isfirst)
    @setState
      checking: true
      latest: latest
  onSelectOpenFolder: ->
    shell.openItem path.join PLUGIN_PATH, 'node_modules'
  componentDidMount: ->
    @checkUpdate(@solveUpdate, true) if config.get('poi.update.plugin', true)
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
          <ButtonGroup bsSize='small' style={width: '75%'}>
            <Button onClick={@checkUpdate.bind(@, @solveUpdate, false)}
                    disabled={@state.checking}
                    className="control-button"
                    style={width: '33%'}>
              <FontAwesome name='refresh' spin={@state.checking} />
              <span> {__ "Check Update"}</span>
            </Button>
            <Button onClick={@handleUpdateAll.bind(@, @handleUpdateAllComplete)}
                    disabled={@state.updatingAll || !@state.isUpdateAvailable || @state.checking}
                    className="control-button"
                    style={width: '33%'}>
              <FontAwesome name={
                             if @state.updatingAll
                               "spinner"
                             else
                               "cloud-download"
                           }
                           pulse={@state.updatingAll}/>
              <span> {__ "Update all"}</span>
            </Button>
            <Button onClick={@handleInstallAll.bind @, @handleInstallAllComplete}
                    disabled={@state.installing}
                    className="control-button"
                    style={width: '33%'}>
              <FontAwesome name={
                             if @state.installing
                               "spinner"
                             else
                               "download"
                           }
                           pulse={@state.installing}/>
              <span> {__ "Install all"}</span>
            </Button>
          </ButtonGroup>
          <ButtonGroup bsSize='small' style={width: '25%', paddingLeft: 6}>
            <DropdownButton style={width: '100%'}
                            className="control-button"
                            pullRight
                            title={
                              React.createElement("span", null, React.createElement(FontAwesome, {
                                "name": 'server'
                              }), " ", mirror[this.state.mirror].name);
                            }
                            id="mirror-select">
              {
                for server, index in mirror
                  <MenuItem key={index} onSelect={@onSelectServer.bind @, index}>{mirror[index].menuname}</MenuItem>
              }
              <MenuItem divider />
              <MenuItem key={index} onSelect={@onSelectOpenFolder}>{__ "Manually install"}</MenuItem>
            </DropdownButton>
          </ButtonGroup>
        </Col>
      {
        for plugin, index in plugins
          <Col key={index} xs={12} style={marginBottom: 8}>
            <Col xs={12} className='div-row'>
              <span style={fontSize: '150%'}>{plugin.displayName} </span>
              <span style={paddingTop: 2}> @<span onClick={@handleClickAuthorLink.bind @, plugin.link}>{plugin.author}</span></span>
              <div style={paddingTop: 2}>
                <Label bsStyle='primary'
                       className="#{if @state.updating[index] || semver.gte(plugin.version, @state.latest[plugin.packageName]) || @state.removeStatus[index] != 0 then 'hidden' else ''}">
                  <FontAwesome name='cloud-upload' />
                  Version {@state.latest[plugin.packageName]}
                </Label>
              </div>
              <div style={paddingTop: 2, marginLeft: 'auto'}>Version {plugin.version || '1.0.0'}</div>
            </Col>
            <Col xs={12} style={marginTop: 4}>
              <Col xs={5}>{plugin.description}</Col>
              <Col xs={7} style={padding: 0}>
                <div style={marginLeft: 'auto'}>
                  <ButtonGroup bsSize='small' style={width: '100%'}>
                    <Button bsStyle='info'
                            disabled={if @state.status[index] == 2 then true else false}
                            onClick={@handleEnable.bind @, index}
                            style={width: "33%"}
                            className="plugin-control-button">
                      <FontAwesome name={
                                     switch @state.status[index]
                                       when 0
                                         "pause"
                                       when 1
                                         "play"
                                       when 2
                                         "ban"
                                   }/>
                      {
                        switch @state.status[index]
                          when 0
                             __ "Disable"
                          when 1
                             __ "Enable"
                          when 2
                             __ "Outdated"
                      }
                    </Button>
                    <Button bsStyle='primary'
                            disabled={@state.updating[index] || semver.gte(plugin.version, @state.latest[plugin.packageName]) || @state.removeStatus[index] != 0}
                            onClick={@handleUpdate.bind @, index, @handleUpdateComplete}
                            style={width: "33%"}
                            className="plugin-control-button">
                      <FontAwesome name={
                                     if @state.updating[index]
                                       "spinner"
                                     else if semver.lt(plugin.version, @state.latest[plugin.packageName])
                                       "cloud-download"
                                     else
                                       "check"
                                   }
                                   pulse={@state.updating[index]}/>
                      {
                        if @state.updating[index]
                           __ "Updating"
                        else if semver.lt(plugin.version, @state.latest[plugin.packageName])
                           __ "Update"
                        else
                           __ "Latest"
                      }
                    </Button>
                    <Button bsStyle='danger'
                            onClick={@handleRemove.bind @, index, @handleRemoveComplete}
                            disabled={@state.removeStatus[index] != 0}
                            style={width: "33%"}
                            className="plugin-control-button">
                      <FontAwesome name={if @state.removeStatus[index] == 0 then 'trash' else 'trash-o'} />
                      {
                        switch @state.removeStatus[index]
                          when 0
                             __ "Remove"
                          when 1
                             __ "Removing"
                          when 2
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
        index = -1
        for installTarget of installTargets
          index++
          <Col key={index} xs={12} style={marginBottom: 8}>
            <Col xs={12} className='div-row'>
              <span style={fontSize: '150%'}><FontAwesome name={installTargets[installTarget]['icon']} /> {installTargets[installTarget][window.language]} </span>
              <span style={paddingTop: 2}> @<span onClick={@handleClickAuthorLink.bind @, installTargets[installTarget]['link']}>{installTargets[installTarget]['author']}</span></span>
            </Col>
            <Col xs={12} style={marginTop: 4}>
              <Col xs={8}>{installTargets[installTarget]["des#{window.language}"]}</Col>
              <Col xs={4} style={padding: 0}>
                <div style={marginLeft: 'auto'}>
                  <ButtonGroup bsSize='small' style={width: '100%'}>
                    <Button bsStyle='primary'
                            disabled={@state.installStatus[index] != 0}
                            onClick={@handleInstall.bind @, installTarget, index, @handleInstallComplete}
                            style={width: "100%"}
                            className="plugin-control-button">
                      <FontAwesome name={
                                     switch @state.installStatus[index]
                                       when 0
                                         "download"
                                       when 1
                                         "spinner"
                                       when 2
                                         "check"
                                   }
                                   pulse={@state.installStatus[index] == 1}/>
                      {
                        switch @state.installStatus[index]
                          when 0
                             __ "Install"
                          when 1
                             __ "Installing"
                          when 2
                             __ "Installed"
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
