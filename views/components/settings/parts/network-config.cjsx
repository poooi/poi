path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT, toggleModal} = window
{config} = window
{FormControl, ControlLabel, FormGroup, Checkbox, Grid, Col, Button, Alert} = ReactBootstrap
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
  handleChangeUse: (e) ->
    use = e.target.value
    @setState {use}
  handleSaveConfig: (e) ->
    use = @state.use
    switch use
      when 'http'
        config.set 'proxy.use', 'http'
        config.set 'proxy.http', @state.http
      when 'socks5'
        config.set 'proxy.use', 'socks5'
        config.set 'proxy.socks5', @state.socks5
      when 'pac'
        config.set 'proxy.use', 'pac'
        config.set 'proxy.pacAddr', @state.pacAddr
      else
        config.set 'proxy.use', 'none'
    retries = parseInt @state.retries
    retries = 0 if isNaN(retries)
    config.set 'poi.proxy.retries', retries
    port = parseInt @state.port
    port = 0 if isNaN(port) || port < 1024 || port > 65535
    config.set 'proxy.port', port
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
          <FormControl componentClass="select" value={@state.use || "none"} onChange={@handleChangeUse}>
            <option key={0} value="http">HTTP {__ "proxy"}</option>
            <option key={1} value="socks5">Socks5 {__ "proxy"}</option>
            <option key={2} value="pac">PAC {__ "file"} ({__ "Experimental"})</option>
            <option key={3} value="none">{__ "No proxy"}</option>
          </FormControl>
        </Col>
      </Grid>
      <Divider text={__ 'Proxy server information'} />
      {
        if @state.use == 'http'
          <Grid>
            <Col xs={6}>
              <FormGroup>
                <ControlLabel>{__ 'Proxy server address'}</ControlLabel>
                <FormControl type="text" placeholder={__ 'Proxy server address'} value={@state?.http?.host} onChange={@handleHttpHostChange} />
              </FormGroup>
            </Col>
            <Col xs={6}>
              <FormGroup>
                <ControlLabel>{__ 'Proxy server port'}</ControlLabel>
                <FormControl type="text" placeholder={__ 'Proxy server port'} value={@state?.http?.port} onChange={@handleHttpPortChange} />
              </FormGroup>
            </Col>
            <Col xs={12}>
              <Checkbox type='checkbox' checked={!!@state?.http?.requirePassword} onChange={@handleSetHttpRequirePassword}>
                {__ 'Proxy server requires password'}
              </Checkbox>
            </Col>
            {
                <div style={if !@state.http.requirePassword then {display: 'none'} else {}} >
                  <Col xs={6}>
                    <FormGroup>
                      <ControlLabel><{__ 'Username'}</ControlLabel>
                      <FormControl type="text" placeholder={__ 'Username'} value={@state?.http?.username} onChange={@handleHttpUsernameChange} />
                    </FormGroup>
                  </Col>
                  <Col xs={6}>
                    <FormGroup>
                      <ControlLabel>{__ 'Password'}</ControlLabel>
                      <FormControl type="password" placeholder={__ 'Password'} value={@state?.http?.password} onChange={@handleHttpPasswordChange} />
                    </FormGroup>
                  </Col>
                </div>
            }
          </Grid>
        else if @state.use == 'socks5'
          <Grid>
            <Col xs={6}>
              <FormGroup>
                <ControlLabel>{__ 'Proxy server address'}</ControlLabel>
                <FormControl type="text" placeholder={__ 'Proxy server address'} value={@state?.socks5?.host} onChange={@handleSocksHostChange} />
              </FormGroup>
            </Col>
            <Col xs={6}>
              <FormGroup>
                <ControlLabel>{__ 'Proxy server port'}</ControlLabel>
                <FormControl type="text" placeholder={__ 'Proxy server port'} value={@state?.socks5?.port} onChange={@handleSocksPortChange} />
              </FormGroup>
            </Col>
          </Grid>
        else if @state.use == 'pac'
          <Grid>
            <Col xs={12}>
              <FormGroup>
                <ControlLabel>{__ 'PAC address'}</ControlLabel>
                <FormControl type="text" placeholder={__ 'PAC address'} value={@state?.pacAddr} onChange={@handlePACAddrChange} />
              </FormGroup>
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
          <FormControl type="number" value={@state.retries} onChange={@handleSetRetries} />
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
          <FormControl type="number" value={@state.port} onChange={@handleSetPort} placeholder={__ "Default: 0 (Use random port)"} />
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
