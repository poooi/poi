path = require 'path-extra'
glob = require 'glob'
__ = i18n.setting.__.bind(i18n.setting)
__n = i18n.setting.__n.bind(i18n.setting)
fs = require 'fs-extra'
npm = require 'npm'
semver = require 'semver'
{$, $$, _, React, ReactBootstrap, FontAwesome, ROOT} = window
{Grid, Col, Row, Input, Alert, Button, ButtonGroup, Label, Collapse, Well, OverlayTrigger, Tooltip} = ReactBootstrap
{config} = window
shell = require 'shell'
{dialog} = remote.require 'electron'
Divider = require './divider'

# Plugin version
packages = fs.readJsonSync path.join ROOT, 'assets', 'data', 'plugin.json'

# Mirror server
mirror = fs.readJsonSync path.join ROOT, 'assets', 'data', 'mirror.json'

plugins = glob.sync(path.join(PLUGIN_PATH, 'node_modules', 'poi-plugin-*'))
fails = []
failsName = []
for plugin, index in plugins
  try
    test = require plugin
  catch error
    console.error error
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
    if process.env.DEBUG? then console.log error
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

for fail, index in fails
  delete installTargets[path.basename fail]

installStatus = []
for installTarget of installTargets
  # 0: not installed 1: installing 2: installed
  installStatus.push 0

failStatus = []
for fail, index in fails
  # 0: broken 1: installing 2: installed 3: removing 4: removed
  failStatus.push 0

npmConfig = {
  prefix: "#{PLUGIN_PATH}",
  registry: mirror[config.get "packageManager.mirror", 0].server,
  http_proxy: 'http://127.0.0.1:12450'
}

ifStableVersion = (version) ->
  semver.satisfies version,
    ">= #{semver.major version}.#{semver.minor version}.#{semver.patch version}"

needUpdate = (now, check) ->
  if ifStableVersion now
    semver.lt now, check
  else if not ifStableVersion(now) and not ifStableVersion(check)
    semver.lt now, check
  else
    true

PluginConfig = React.createClass
  getInitialState: ->
    status: status
    latest: latest
    updating: updating
    installStatus: installStatus
    removeStatus: removeStatus
    failStatus: failStatus
    checking: false
    updatingAll: false
    installing: false
    mirror: config.get "packageManager.mirror", 0
    isUpdateAvailable: false
    advanced: false
    manuallyInstallPackage: ''
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
  handleAdvancedShow: ->
    advanced = !@state.advanced
    @setState {advanced}
  changeInstalledPackage: (e) ->
    manuallyInstallPackage = e.target.value
    @setState {manuallyInstallPackage}
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
      npm.load npmConfig, (err) =>
        if ifStableVersion @state.latest[plugins[index].packageName]
          npm.commands.update [plugins[index].packageName], (er, data) ->
            callback(index, er)
        else
          npm.commands.install ["#{plugins[index].packageName}@#{@state.latest[plugins[index].packageName]}"], (er,data) ->
            callback(index, er)
      @setState {updating}
  handleInstallAllComplete: (data, er) ->
    failStatus = @state.failStatus
    installStatus = @state.installStatus
    for arr in data
      name = arr[0].split('@')[0]
      for fail, index in fails
        if name == path.basename fail
          failStatus[index] = if er then 0 else 2
      index = -1
      for installTarget of installTargets
        index++
        if name == installTarget
          installStatus[index] = if er then 0 else 2
    @setState
      failStatus: failStatus
      installStatus: installStatus
      installing: false
  handleInstallAll: (callback) ->
    if !@props.disabled
      failStatus = @state.failStatus
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
      for fail, index in fails
        if failStatus[index] == 0
          toInstall.push path.basename fail
          failStatus[index] = 1
      npm.load npmConfig, (err) ->
        npm.commands.install toInstall, (er, data) ->
          callback(data, er)
      @setState
        installStatus: installAllStatus
        installing: true
  isInstallAllAvailable: ->
    count = 0
    for installTarget of installTargets
      if @state.installStatus[index] == 0
        count++
    for fail, index in fails
      if failStatus[index] == 0
        count++
    return if count == 0 then false else true
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
      toInstall = []
      for plugin, index in plugins
        if needUpdate(plugin.version, @state.latest[plugin.packageName]) && @state.removeStatus[index] == 0
          updating[index] = true
          toInstall.push "#{plugin.packageName}@#{@state.latest[plugin.packageName]}"
      npm.load npmConfig, (err) ->
        npm.commands.install toInstall, (er, data) ->
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
  solveUpdate: (err, updateData, isfirst) ->
    if not err?
      latest = @state.latest
      latestVersion = updateData.latest ? "0.0.0"
      if config.get('enableBetaPluginCheck', false) and semver.lt(latestVersion, updateData.beta ? "0.0.0")
        latestVersion = updateData.beta
      if latest[updateData.packageName]? && needUpdate(latest[updateData.packageName], latestVersion)
        latest[updateData.packageName] = latestVersion
        @isUpdateAvailable = true
    #console.log "checkCount: #{@checkCount}"
    @checkCount--
    if (@checkCount is 0)
      if isfirst && @isUpdateAvailable
        title = __ 'Plugin update'
        outdatedPlugins = []
        for plugin, index in plugins
          if needUpdate(plugin.version, latest[plugin.packageName])
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
    npm.load npmConfig, (err) =>
      @checkCount = plugins.length
      for plugin in plugins
        packageName = plugin.packageName
        npm.commands.distTag ['ls', plugin.packageName], do (packageName) ->
          (err, data) ->
            callback(err, Object.assign({packageName: packageName}, data), isfirst)
    @setState
      checking: true
      latest: latest
  onSelectOpenFolder: ->
    shell.openItem path.join PLUGIN_PATH, 'node_modules'
  onSelectOpenSite: (e) ->
    shell.openExternal "https://www.npmjs.com/search?q=poi-plugin"
    e.preventDefault()
  onSelectInstallFromFileComplete: (data, er) ->
    if er
      notify __ 'Install failed. Maybe the selected files are not plugin packages.',
        type: 'plugin error'
        title: __ 'Install failed'
        icon: path.join(ROOT, 'assets', 'img', 'material', '7_big.png')
        audio: "file://#{ROOT}/assets/audio/fail.mp3"
    else
      installStatus = @state.installStatus
      for arr in data
        name = arr[0].split('@')[0]
        index = -1
        for installTarget of installTargets
          index++
          if installTarget == name
            installStatus[index] = 2
      notify __ 'Plugins are installed successfully. Please restart poi to take effect.',
        type: 'plugin installed'
        title: __ 'Install complete'
        icon: path.join(ROOT, 'assets', 'img', 'material', '7_big.png')
        audio: "file://#{ROOT}/assets/audio/update.mp3"
      @setState {installStatus}
  onSelectInstallFromFile: (callback) ->
    @synchronize =>
      filenames = dialog.showOpenDialog
        title: __ 'Select files'
        defaultPath: remote.require('electron').app.getPath('downloads')
        properties: ['openFile', 'multiSelections']
      if filenames
        npm.load npmConfig, (err) =>
          npm.commands.install filenames, (er, data) ->
            callback(data, er)
  onDropInstallFromFile: (callback, e) ->
    e.preventDefault()
    droppedFiles = e.dataTransfer.files
    filenames = []
    for droppedFile in droppedFiles
      filenames.push droppedFile.path
    if filenames
      npm.load npmConfig, (err) =>
        npm.commands.install filenames, (er, data) ->
          callback(data, er)
  handleManuallyInstall: (name, callback) ->
    npm.load npmConfig, (err) =>
      npm.commands.install [name], (er, data) ->
        callback(data, er)
  handleReinstall: (index) ->
    if !@props.disabled
      failStatus = @state.failStatus
      failStatus[index] = 1
      name = path.basename fails[index]
      @handleManuallyInstall name, @handleReinstallComplete
      @setState {failStatus}
  handleReinstallComplete: (data, er) ->
    failStatus = @state.failStatus
    for arr in data
      name = arr[0].split('@')[0]
      for fail, index in fails
        if name == path.basename fail
          failStatus[index] = if er then 0 else 2
    @setState {failStatus}
  handleRemoveBroken: (index, callback) ->
    if !@props.disabled
      name = path.basename fails[index]
      failStatus = @state.failStatus
      failStatus[index] = 3
      npm.load npmConfig, (err) ->
        npm.commands.uninstall [name], (er, data) ->
          callback(index, er)
      @setState {failStatus}
  handleRemoveBrokenComplete: (index ,er) ->
    failStatus = @state.failStatus
    failStatus[index] = if er then 0 else 4
    @setState {failStatus}
  synchronize: (callback) ->
    return if @lock
    @lock = true
    callback()
    @lock = false
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
          <ButtonGroup bsSize='small' style={width: '100%'}>
            <Button onClick={@checkUpdate.bind(@, @solveUpdate, false)}
                    disabled={@state.checking}
                    className="control-button"
                    style={width: '25%'}>
              <FontAwesome name='refresh' spin={@state.checking} />
              <span> {__ "Check Update"}</span>
            </Button>
            <Button onClick={@handleUpdateAll.bind(@, @handleUpdateAllComplete)}
                    disabled={@state.updatingAll || !@state.isUpdateAvailable || @state.checking}
                    className="control-button"
                    style={width: '25%'}>
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
                    disabled={@state.installing || !@isInstallAllAvailable()}
                    className="control-button"
                    style={width: '25%'}>
              <FontAwesome name={
                             if @state.installing
                               "spinner"
                             else
                               "download"
                           }
                           pulse={@state.installing}/>
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
                        <Button bsStyle='primary' onClick={@handleManuallyInstall.bind @, @state.manuallyInstallPackage, @onSelectInstallFromFileComplete}>
                          {__ 'Install'}
                        </Button>
                      <Input type="text"
                             value={@state.manuallyInstallPackage}
                             onChange={@changeInstalledPackage}
                             label={__ 'Install directly from npm'}
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
                      for server, index in mirror
                        <OverlayTrigger placement='top' key={index} overlay={<Tooltip id="npm-server-#{index}">{server.menuname}</Tooltip>}>
                          <Col key={index} xs=4 style={padding: '0px 5px'}>
                            <Input type="radio"
                                   label={server.name}
                                   checked={@state.mirror == index}
                                   onChange={@onSelectServer.bind @, index} />
                          </Col>
                        </OverlayTrigger>
                    }
                  </Col>
                  <Col xs=12>
                    <label className='control-label' style={width: '100%'}>
                      {__ 'Others'}
                    </label>
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
        <Col xs={12} style={paddingBottom: 10}>
          <div className="folder-picker"
               onClick={@onSelectInstallFromFile.bind @, @onSelectInstallFromFileComplete}
               onDrop={@onDropInstallFromFile.bind @, @onSelectInstallFromFileComplete}
               onDragEnter={(e)=> e.preventDefault()}
               onDragOver={(e)=> e.preventDefault()}
               onDragLeave={(e)=> e.preventDefault()}>
            {__ "Drop plugin packages here to install it, or click here to select them"}
          </div>
        </Col>
      {
        for plugin, index in plugins
          <Col key={index} xs={12} style={marginBottom: 8}>
            <Col xs={12} className='div-row'>
              <span style={fontSize: '150%'}>{plugin.displayName} </span>
              <span style={paddingTop: 2}> @<span onClick={@handleClickAuthorLink.bind @, plugin.link}>{plugin.author}</span></span>
              <div style={paddingTop: 2}>
                <Label bsStyle="#{if ifStableVersion @state.latest[plugin.packageName] then 'primary' else 'warning'}"
                       className="#{if @state.updating[index] || not needUpdate(plugin.version, @state.latest[plugin.packageName]) || @state.removeStatus[index] != 0 then 'hidden' else ''}">
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
                            disabled={@state.updating[index] || not needUpdate(plugin.version, @state.latest[plugin.packageName]) || @state.removeStatus[index] != 0}
                            onClick={@handleUpdate.bind @, index, @handleUpdateComplete}
                            style={width: "33%"}
                            className="plugin-control-button">
                      <FontAwesome name={
                                     if @state.updating[index]
                                       "spinner"
                                     else if needUpdate(plugin.version, @state.latest[plugin.packageName])
                                       "cloud-download"
                                     else
                                       "check"
                                   }
                                   pulse={@state.updating[index]}/>
                      {
                        if @state.updating[index]
                           __ "Updating"
                        else if needUpdate(plugin.version, @state.latest[plugin.packageName])
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
        packages = fs.readJsonSync path.join ROOT, 'assets', 'data', 'plugin.json'
        for fail, index in fails
          fail = path.basename fail
          plugin = {}
          if packages[fail]?
            plugin.displayName =
              <span><FontAwesome name={packages[fail]['icon']} /> {packages[fail][window.language]} </span>
            plugin.author = packages[fail]['author']
            plugin.link = packages[fail]['link']
            plugin.description = packages[fail]["des#{window.language}"]
            plugin.version = __ 'unknown'
          else
            plugin.displayName =
              <span><FontAwesome name='ban' /> {fail} </span>
            plugin.author = __ 'unknown'
            plugin.link = 'https://github.com/poooi'
            plugin.version = __ 'unknown'
            plugin.description = __ 'unknown'
          <Col key={index} xs={12} style={marginBottom: 8}>
            <Col xs={12} className='div-row'>
              <span style={fontSize: '150%'}>{plugin.displayName} </span>
              <span style={paddingTop: 2}> @<span onClick={@handleClickAuthorLink.bind @, plugin.link}>{plugin.author}</span></span>
              <div style={paddingTop: 2, marginLeft: 'auto'}>Version {plugin.version || '1.0.0'}</div>
            </Col>
            <Col xs={12} style={marginTop: 4}>
              <Col xs={5}>{plugin.description}</Col>
              <Col xs={7} style={padding: 0}>
                <div style={marginLeft: 'auto'}>
                  <ButtonGroup bsSize='small' style={width: '100%'}>
                    <Button bsStyle='info'
                            disabled=true
                            onClick={(e)=> e.preventDefault}
                            style={width: "33%"}
                            className="plugin-control-button">
                      <FontAwesome name="ban" />
                      {__ 'Error'}
                    </Button>
                    <Button bsStyle='primary'
                            disabled={@state.failStatus[index] != 0}
                            onClick={@handleReinstall.bind @, index}
                            style={width: "33%"}
                            className="plugin-control-button">
                      <FontAwesome name={
                                     switch @state.failStatus[index]
                                       when 1
                                         "spinner"
                                       when 2
                                         "check"
                                       else
                                         "download"
                                   }
                                   pulse={@state.failStatus[index] == 1}/>
                      {
                        switch @state.failStatus[index]
                          when 1
                             __ "Installing"
                          when 2
                             __ "Installed"
                          else
                            __ "Reinstall"
                      }
                    </Button>
                    <Button bsStyle='danger'
                            onClick={@handleRemoveBroken.bind @, index, @handleRemoveBrokenComplete}
                            disabled={@state.failStatus[index] != 0}
                            style={width: "33%"}
                            className="plugin-control-button">
                      <FontAwesome name={if @state.failStatus[index] == 0 then 'trash' else 'trash-o'} />
                      {
                        switch @state.failStatus[index]
                          when 3
                             __ "Removing"
                          when 4
                             __ "Removed"
                          else
                             __ "Remove"
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
