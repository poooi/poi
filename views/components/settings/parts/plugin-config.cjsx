path = require 'path-extra'
glob = require 'glob'
{__, __n} = require 'i18n'
fs = require 'fs-extra'
npm = require 'npm'
semver = require 'semver'
{$, $$, _, React, ReactBootstrap, ROOT} = window
{Grid, Col, Input, Alert, Button, ButtonGroup} = ReactBootstrap
{config} = window
shell = require 'shell'
Divider = require './divider'

# Plugin version
packages = fs.readJsonSync path.join ROOT, 'views', 'plugin.json'

plugins = glob.sync(path.join(PLUGIN_PATH, 'node_modules', 'poi-plugin-*'))
plugins = plugins.map (filePath) ->
  plugin = require filePath
  packageData = fs.readJsonSync path.join filePath, 'package.json'
  plugin.packageName = packageData.name
  plugin.priority = 10000 unless plugin.priority?
  plugin
plugins = _.sortBy(plugins, 'priority')

status = plugins.map (plugin) ->
  # 0: enabled 1: manually disabled 2: disabled because too old
  if packages[plugin.packageName].version isnt undefined && packages[plugin.packageName].version isnt null
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

console.log packages

latest = {}
toInstall = packages
for plugin, index in plugins
  latest[plugin.packageName] = plugin.version


getAuthorLink = (author, link) ->
  handleClickAuthorLink = (e) ->
    shell.openExternal e.target.dataset.link
    e.preventDefault()
  <a onClick={handleClickAuthorLink} data-link={link}>{author}</a>

PluginConfig = React.createClass
  getInitialState: ->
    status: status
    latest: latest
    updating: updating
  handleEnable: (index) ->
    status = @state.status
    if status[index] isnt 2
      status[index] = (status[index] + 1) % 2
      if status[index] == 0 then enable = true
      if status[index] == 1 then enable = false
      config.set "plugin.#{plugins[index].name}.enable", enable
    @setState
      status: status
  handleUpdate: (index) ->
  handleRemove: (index) ->
  solveUpdate: (updateData) ->
    latest = @state.latest
    for updateObject, index in updateData
      latest[updateObject[1]] = updateObject[4]
    console.log latest
    @setState {latest}
  checkUpdate: (callback) ->
    npm.load {prefix: "#{PLUGIN_PATH}"}, (err) ->
      npm.config.set 'depth', 1
      npm.commands.outdated [], (er, data) ->
        callback(data)
  componentDidMount: ->
    @checkUpdate(@solveUpdate)
  render: ->
    <form>
      <Divider text={__ 'Plugins'} />
      <Grid>
        <Col xs={12}>
          <Alert bsStyle='info'>
            {__ 'You must reboot the app for the changes to take effect.'}
          </Alert>
        </Col>
        <Col xs={12}>
          <Button onClick={@checkUpdate.bind(@, @solveUpdate)}>Check Update</Button>
        </Col>
      </Grid>
      <Grid>
      {
        for plugin, index in plugins
          <Col key={index} xs={12} style={marginBottom: 8}>
            <Col xs={12} className='div-row'>
              <span style={fontSize: '150%'}>{plugin.displayName} </span>
              <span style={paddingTop: 2}> @ {getAuthorLink(plugin.author, plugin.link)} </span>
              <div style={paddingTop: 2, marginLeft: 'auto'}>Version {plugin.version || '1.0.0'}</div>
            </Col>
            <Col xs={12} style={marginTop: 4}>
              <Col xs={7}>{plugin.description}</Col>
              <Col xs={5} style={padding: 0}>
                <div style={marginLeft: 'auto'}>
                  <ButtonGroup bsSize='small' style={width: '100%'}>
                    <Button bsStyle='info'
                            disabled={if @state.status[index] == 2 then true else false}
                            onClick={@handleEnable.bind @, index}
                            style={width: "33%"}>
                      {
                        switch @state.status[index]
                          when 0
                            "Enabled"
                          when 1
                            "Disabled"
                          when 2
                            "Outdated"
                      }
                    </Button>
                    <Button bsStyle='primary'
                            disabled={@state.updating[index] || semver.gte(plugin.version, @state.latest[plugin.packageName])}
                            onClick={@handleUpdate.bind @, index}
                            style={width: "33%"}>
                      {
                        if @state.updating[index]
                          "Updating"
                        else if semver.lt(plugin.version, @state.latest[plugin.packageName])
                          "Update"
                        else
                          "Latest"
                      }
                    </Button>
                    <Button bsStyle='danger'
                            onClick={@handleRemove.bind @, index}
                            style={width: "33%"}>
                      {"Remove"}
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
