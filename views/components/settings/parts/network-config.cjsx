path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT, toggleModal} = window
{config} = window
{Input, Grid, Col, Button, Alert} = ReactBootstrap
Divider = require './divider'

shadowsocksMethods = ["aes-256-cfb", "aes-192-cfb", "aes-128-cfb", "bf-cfb",
                      "camellia-256-cfb", "camellia-192-cfb", "camellia-128-cfb",
                      "cast5-cfb", "des-cfb", "idea-cfb", "rc2-cfb", "rc4", "rc4-md5"]

basic =
  use: 'none',
  http:
    host: '127.0.0.1'
    port: 8099
  socks5:
    host: "127.0.0.1",
    port: 1080
  shadowsocks:
    server:
      host: "116.251.209.211",
      port: 27017
    local:
      port: 12451
    password: "@_PoiPublic_@",
    method: "aes-256-cfb",
    timeout: 600000,
    port: "@_PoiPublic_@"
  retries: config.get 'poi.proxy.retries', 0

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
      when 'socks5'
        config.set 'proxy.use', 'socks5'
        config.set 'proxy.socks5.host', @refs.socksHost.getValue()
        config.set 'proxy.socks5.port', @refs.socksPort.getValue()
      when 'shadowsocks'
        config.set 'proxy.use', 'shadowsocks'
        config.set 'proxy.shadowsocks.server.host', @refs.shadowsocksServerHost.getValue()
        config.set 'proxy.shadowsocks.server.port', @refs.shadowsocksServerPort.getValue()
        config.set 'proxy.shadowsocks.password', @refs.shadowsocksPassword.getValue()
        config.set 'proxy.shadowsocks.method', @refs.shadowsocksMethod.getValue()
      else
        config.set 'proxy.use', 'none'
    toggleModal '代理设置', '保存成功，重启软件后生效。'
    e.preventDefault()
  handleHttpHostChange: (e) ->
    {http} = @state
    http.host = e.target.value
    @setState {http}
  handleHttpPortChange: (e) ->
    {http} = @state
    http.port = e.target.value
    @setState {http}
  handleSocksHostChange: (e) ->
    {socks5} = @state
    socks5.host = e.target.value
    @setState {socks5}
  handleSocksPortChange: (e) ->
    {socks5} = @state
    socks5.port = e.target.value
    @setState {socks5}
  handleShadowsocksServerHostChange: (e) ->
    {shadowsocks} = @state
    shadowsocks.server.host = e.target.value
    @setState {shadowsocks}
  handleShadowsocksServerPortChange: (e) ->
    {shadowsocks} = @state
    shadowsocks.server.port = e.target.value
    @setState {shadowsocks}
  handleShadowsocksPasswordChange: (e) ->
    {shadowsocks} = @state
    shadowsocks.password = e.target.value
    @setState {shadowsocks}
  handleShadowsocksMethodChange: (e) ->
    {shadowsocks} = @state
    shadowsocks.method = e.target.value
    @setState {shadowsocks}
  handleSetRetries: (e) ->
    @setState
      retries: e.target.value
    r = parseInt(e.target.value)
    return if isNaN(r) || r < 0
    config.set 'poi.proxy.retries', r
  render: ->
    <form>
      <Divider text="代理类型" />
      <Grid>
        <Col xs={12}>
          <Input type="select" ref="use" value={@state.use || "none"} onChange={@handleChangeUse}>
            <option key={0} value="http">HTTP 代理</option>
            <option key={1} value="socks5">Socks5 代理</option>
            <option key={2} value="shadowsocks">Shadowsocks</option>
            <option key={3} value="none">不使用代理</option>
          </Input>
        </Col>
      </Grid>
      <Divider text="代理详情" />
      {
        if @state.use == 'http'
          <Grid>
            <Col xs={6}>
              <Input type="text" ref="httpHost" label="代理地址" placeholder="输入代理地址" value={@state?.http?.host} onChange={@handleHttpHostChange} />
            </Col>
            <Col xs={6}>
              <Input type="text" ref="httpPort" label="代理端口" placeholder="输入代理端口" value={@state?.http?.port} onChange={@handleHttpPortChange} />
            </Col>
          </Grid>
        else if @state.use == 'socks5'
          <Grid>
            <Col xs={6}>
              <Input type="text" ref="socksHost" label="代理地址" placeholder="输入代理地址" value={@state?.socks5?.host} onChange={@handleSocksHostChange} />
            </Col>
            <Col xs={6}>
              <Input type="text" ref="socksPort" label="代理端口" placeholder="输入代理端口" value={@state?.socks5?.port} onChange={@handleSocksPortChange} />
            </Col>
          </Grid>
        else if @state.use == 'shadowsocks'
          <Grid>
            <Col xs={6}>
              <Input type="text" ref="shadowsocksServerHost" label="服务器地址" placeholder="Shadowsocks 服务器地址" value={@state?.shadowsocks?.server?.host} onChange={@handleShadowsocksServerHostChange} />
            </Col>
            <Col xs={6}>
              <Input type="text" ref="shadowsocksServerPort" label="服务器端口" placeholder="Shadowsocks 服务器端口" value={@state?.shadowsocks?.server?.port} onChange={@handleShadowsocksServerPortChange} />
            </Col>
            <Col xs={6}>
              <Input type="password" ref="shadowsocksPassword" label="密码" placeholder="Shadowsocks 密码" value={@state?.shadowsocks?.password} onChange={@handleShadowsocksPasswordChange} />
            </Col>
            <Col xs={6}>
              <Input type="select" ref="shadowsocksMethod" label="加密方法" placeholder="Shadowsocks 加密方式" value={@state?.shadowsocks?.method} onChange={@handleShadowsocksMethodChange}>
              {
                shadowsocksMethods.map (method, index) ->
                  <option key={index} value={method}>{method.toUpperCase()}</option>
              }
              </Input>
            </Col>
          </Grid>
        else
          <Grid>
            <Col xs={12}>
              <center>将会直接连接网络或者通过全局 VPN 访问网络</center>
            </Col>
          </Grid>
      }
      <Divider text="网络错误重试次数" />
      <Grid>
        <Col xs={12}>
          <Input type="number" ref="retries" value={@state.retries} onChange={@handleSetRetries} />
        </Col>
        <Col xs={12}>
          <Alert bsStyle='danger'>
            任何本地重试都不能保证绝对安全，斟酌使用。
          </Alert>
        </Col>
      </Grid>
      <Divider text="保存设置" />
      <Grid>
        <Col xs={12}>
          <Button bsStyle="success" onClick={@handleSaveConfig} style={width: '100%'}>点击保存</Button>
        </Col>
      </Grid>
    </form>

module.exports = NetworkConfig
