path = require 'path-extra'
glob = require 'glob'
{$, $$, _, React, ReactBootstrap, ROOT} = window
{Grid, Col, Input} = ReactBootstrap
{config} = window
Divider = require './divider'

plugins = glob.sync(path.join(ROOT, 'plugins', '*'))
plugins = plugins.map (filePath) ->
  plugin = require filePath
  plugin.priority = 10000 unless plugin.priority?
  plugin
plugins = _.sortBy(plugins, 'priority')
enabled = plugins.map (plugin) ->
  config.get "plugin.#{plugin.name}.enable", true

PluginConfig = React.createClass
  getInitialState: ->
    enabled: enabled
  handleChange: (index) ->
    enabled[index] = !enabled[index]
    config.set "plugin.#{plugins[index].name}.enable", enabled[index]
    @setState
      enabled: enabled
  render: ->
    <form>
      <Divider text="全部插件" />
      <Grid>
      {
        plugins.map (plugin, index) =>
          <Col key={index} xs={12}>
            <Input type="checkbox" label={[plugin.displayName, ' @ ', plugin.author || 'Unknown', '：', plugin.description, <br key={-1} />, 'Version ',  plugin.version || '1.0.0']} checked={@state.enabled[index]} onChange={@handleChange.bind @, index } />
          </Col>
      }
      </Grid>
    </form>

module.exports = PluginConfig
