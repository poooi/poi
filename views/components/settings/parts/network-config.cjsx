path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT, toggleModal} = window
{config} = window
{Input, Grid, Col, Button, Alert} = ReactBootstrap
__ = i18n.setting.__.bind(i18n.setting)
__n = i18n.setting.__n.bind(i18n.setting)
Divider = require './divider'

basic =
  use: 'none',
  pacAddr: ''
  http:
    host: '127.0.0.1'
    port: 8099
    requirePassword: false
    username: ''
    password: ''
  socks5:
    host: "127.0.0.1",
    port: 1080
  retries: config.get 'poi.proxy.retries', 0
  port: 0

NetworkConfig = React.createClass
  getInitialState: ->
    _.extend basic, Object.remoteClone(config.get 'proxy', {})
  handleChangeUse: ->
    use = @refs.use.getValue()
    @setState {use}
  handleSaveConfig: (e) ->
    use = @refs.use.getValue()
    switch use
      when 'http'
        config.set 'proxy.use', 'http'
        config.set 'proxy.http.host', @refs.httpHost.getValue()
        config.set 'proxy.http.port', @refs.httpPort.getValue()
        config.set 'proxy.http.requirePassword', @refs.httpRequirePassword.getChecked()
        config.set 'proxy.http.username', @refs.httpUsername.getValue()
        config.set 'proxy.http.password', @refs.httpPassword.getValue()
      when 'socks5'
        config.set 'proxy.use', 'socks5'
        config.set 'proxy.socks5.host', @refs.socksHost.getValue()
        config.set 'proxy.socks5.port', @refs.socksPort.getValue()
      when 'pac'
        config.set 'proxy.use', 'pac'
        config.set 'proxy.pacAddr', @refs.pacAddr.getValue()
      else
        config.set 'proxy.use', 'none'
    retries = parseInt @refs.retries.getValue()
    retries = 0 if isNaN(retries)
    config.set 'poi.proxy.retries', retries
    port = parseInt @refs.port.getValue()
    port = 0 if isNaN(port) || port < 1024 || port > 65535
    config.set 'proxy.port', port
    @setState
      retries: retries
      port: port
    toggleModal __('Proxy setting'), __('Success! It will be available after a restart.')
    e.preventDefault()
  handleHttpHostChange: (e) ->
    {http} = @state
    http.host = e.target.value
    @setState {http}
  handleHttpPortChange: (e) ->
    {http} = @state
    http.port = e.target.value
    @setState {http}
  handleSetHttpRequirePassword: (e) ->
    {http} = @state
    http.requirePassword = !http.requirePassword
    @setState {http}
  handleHttpUsernameChange: (e) ->
    {http} = @state
    http.username = e.target.value
    @setState {http}
  handleHttpPasswordChange: (e) ->
    {http} = @state
    http.password = e.target.value
    @setState {http}
  handleSocksHostChange: (e) ->
    {socks5} = @state
    socks5.host = e.target.value
    @setState {socks5}
  handleSocksPortChange: (e) ->
    {socks5} = @state
    socks5.port = e.target.value
    @setState {socks5}
  handlePACAddrChange: (e) ->
    pacAddr = e.target.value
    @setState {pacAddr}
  handleSetRetries: (e) ->
    @setState
      retries: e.target.value
  handleSetPort: (e) ->
    @setState
      port: e.target.value
  render: ->
    <form>
      <Divider text={__ 'Proxy protocol'} />
      <Grid>
        <Col xs={12}>
          <Input type="select" ref="use" value={@state.use || "none"} onChange={@handleChangeUse}>
            <option key={0} value="http">HTTP {__ "proxy"}</option>
            <option key={1} value="socks5">Socks5 {__ "proxy"}</option>
            <option key={2} value="pac">PAC {__ "file"} ({__ "Experimental"})</option>
            <option key={3} value="none">{__ "No proxy"}</option>
          </Input>
        </Col>
      </Grid>
      <Divider text={__ 'Proxy server information'} />
      {
        if @state.use == 'http'
          <Grid>
            <Col xs={6}>
              <Input type="text" ref="httpHost" label={__ 'Proxy server address'} placeholder={__ 'Proxy server address'} value={@state?.http?.host} onChange={@handleHttpHostChange} />
            </Col>
            <Col xs={6}>
              <Input type="text" ref="httpPort" label={__ 'Proxy server port'} placeholder={__ 'Proxy server port'} value={@state?.http?.port} onChange={@handleHttpPortChange} />
            </Col>
            <Col xs={12}>
              <Input type='checkbox' ref="httpRequirePassword" label={__ 'Proxy server requires password'} checked={!!@state?.http?.requirePassword} onChange={@handleSetHttpRequirePassword} />
            </Col>
            {

                <div style={if !@state.http.requirePassword then {display: 'none'} else {}} >
                  <Col xs={6}>
                    <Input type="text" ref="httpUsername" label={__ 'Username'} placeholder={__ 'Username'} value={@state?.http?.username} onChange={@handleHttpUsernameChange} />
                  </Col>
                  <Col xs={6}>
                    <Input type="password" ref="httpPassword" label={__ 'Password'} placeholder={__ 'Password'} value={@state?.http?.password} onChange={@handleHttpPasswordChange} />
                  </Col>
                </div>
            }
          </Grid>
        else if @state.use == 'socks5'
          <Grid>
            <Col xs={6}>
              <Input type="text" ref="socksHost" label={__ 'Proxy server address'} placeholder={__ 'Proxy server address'} value={@state?.socks5?.host} onChange={@handleSocksHostChange} />
            </Col>
            <Col xs={6}>
              <Input type="text" ref="socksPort" label={__ 'Proxy server port'} placeholder={__ 'Proxy server port'} value={@state?.socks5?.port} onChange={@handleSocksPortChange} />
            </Col>
          </Grid>
        else if @state.use == 'pac'
          <Grid>
            <Col xs={12}>
              <Input type="text" ref="pacAddr" label={__ 'PAC address'} placeholder={__ 'PAC address'} value={@state?.pacAddr} onChange={@handlePACAddrChange} />
            </Col>
          </Grid>
        else
          <Grid>
            <Col xs={12}>
              <center>{__ 'Will connect to server directly.'}</center>
            </Col>
          </Grid>
      }
      <Divider text={__ 'Times of reconnect'} />
      <Grid>
        <Col xs={12}>
          <Input type="number" ref="retries" value={@state.retries} onChange={@handleSetRetries} />
        </Col>
        <Col xs={12}>
          <Alert bsStyle='danger'>
            {__ 'It may be unsafe!'}
          </Alert>
        </Col>
      </Grid>
      <Divider text={__ 'poi port'} />
      <Grid>
        <Col xs={12}>
          <Input type="number" ref="port" value={@state.port} onChange={@handleSetPort} placeholder={__ "Default: 0 (Use random port)"} />
        </Col>
      </Grid>
      <Divider text={__ 'Save settings'} />
      <Grid>
        <Col xs={12}>
          <Button bsStyle="success" onClick={@handleSaveConfig} style={width: '100%'}>{__ 'Save'}</Button>
        </Col>
      </Grid>
    </form>

module.exports = NetworkConfig
