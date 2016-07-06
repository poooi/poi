import path from 'path-extra'
import {Input, Grid, Col, Button, Alert} from 'react-bootstrap'
import { connect } from 'react-redux'
import { Component } from 'react'
import Divider from './divider'

const {config} = window
const __ = i18n.setting.__.bind(i18n.setting)
const __n = i18n.setting.__n.bind(i18n.setting)

let basic = {
  use: 'none',
  pacAddr: '',
  http: {
    host: '127.0.0.1',
    port: 8099,
    requirePassword: false,
    username: '',
    password: '',
  },
  socks5: {
    host: "127.0.0.1",
    port: 1080,
  },
  retries: 0,
  port: 0,
}

const NetworkConfig = connect(() => (
  (state, props) => (
    Object.assign(basic, state.config.proxy)
  )
))(class extends Component {
  constructor(props) {
    super(props)
    this.state = Object.clone(props)
  }
  handleChangeUse = () => {
    let use = this.refs.use.getValue()
    this.setState({
      use: use
    })
  }
  handleSaveConfig = (e) => {
    let use = this.refs.use.getValue()
    switch (use) {
      case 'http':
        config.set('proxy.use', 'http')
        config.set('proxy.http.host', this.refs.httpHost.getValue())
        config.set('proxy.http.port', this.refs.httpPort.getValue())
        config.set('proxy.http.requirePassword', this.refs.httpRequirePassword.getChecked())
        config.set('proxy.http.username', this.refs.httpUsername.getValue())
        config.set('proxy.http.password', this.refs.httpPassword.getValue())
        break
      case 'socks5':
        config.set('proxy.use', 'socks5')
        config.set('proxy.socks5.host', this.refs.socksHost.getValue())
        config.set('proxy.socks5.port', this.refs.socksPort.getValue())
        break
      case 'pac':
        config.set('proxy.use', 'pac')
        config.set('proxy.pacAddr', this.refs.pacAddr.getValue())
        break
      default:
        config.set('proxy.use', 'none')
    }
    let retries = parseInt(this.refs.retries.getValue())
    if (isNaN(retries)) {
      retries = 0
    }
    config.set('proxy.retries', retries)
    let port = parseInt(this.refs.port.getValue())
    if (isNaN(port) || port < 1024 || port > 65535) {
      port = 0
    }
    config.set('proxy.port', port)
    this.setState({
      retries: retries,
      port: port
    })
    toggleModal(__('Proxy setting'), __('Success! It will be available after a restart.'))
    e.preventDefault()
  }
  handleHttpHostChange = (e) => {
    let http = Object.clone(this.state.http)
    http.host = e.target.value
    this.setState({
      http: http
    })
  }
  handleHttpPortChange = (e) => {
    let http = Object.clone(this.state.http)
    http.port = e.target.value
    this.setState({
      http: http
    })
  }
  handleSetHttpRequirePassword = (e) => {
    let http = Object.clone(this.state.http)
    http.requirePassword = !http.requirePassword
    this.setState({
      http: http
    })
  }
  handleHttpUsernameChange = (e) => {
    let http = Object.clone(this.state.http)
    http.username = e.target.value
    this.setState({
      http: http
    })
  }
  handleHttpPasswordChange = (e) => {
    let http = Object.clone(this.state.http)
    http.password = e.target.value
    this.setState({
      http: http
    })
  }
  handleSocksHostChange = (e) => {
    let socks5 = Object.clone(this.state.socks5)
    socks5.host = e.target.value
    this.setState({
      socks5: socks5
    })
  }
  handleSocksPortChange = (e) => {
    let socks5 = Object.clone(this.state.socks5)
    socks5.port = e.target.value
    this.setState({
      socks5: socks5
    })
  }
  handlePACAddrChange = (e) => {
    this.setState({
      pacAddr: e.target.value
    })
  }
  handleSetRetries = (e) => {
    this.setState({
      retries: e.target.value
    })
  }
  handleSetPort = (e) => {
    this.setState({
      port: e.target.value
    })
  }
  render() {
    return (
      <form>
        <Divider text={__('Proxy protocol')} />
        <Grid>
          <Col xs={12}>
            <Input type="select" ref="use" value={this.state.use || "none"} onChange={this.handleChangeUse}>
              <option key={0} value="http">HTTP {__("proxy")}</option>
              <option key={1} value="socks5">Socks5 {__("proxy")}</option>
              <option key={2} value="pac">PAC {__("file")} ({__("Experimental")})</option>
              <option key={3} value="none">{__("No proxy")}</option>
            </Input>
          </Col>
        </Grid>
        <Divider text={__('Proxy server information')} />
        {
          (this.state.use === 'http') ?
            <Grid>
              <Col xs={6}>
                <Input type="text" ref="httpHost" label={__('Proxy server address')} placeholder={__('Proxy server address')} value={this.state.http.host} onChange={this.handleHttpHostChange} />
              </Col>
              <Col xs={6}>
                <Input type="text" ref="httpPort" label={__('Proxy server port')} placeholder={__('Proxy server port')} value={this.state.http.port} onChange={this.handleHttpPortChange} />
              </Col>
              <Col xs={12}>
                <Input type='checkbox' ref="httpRequirePassword" label={__('Proxy server requires password')} checked={!!this.state.http.requirePassword} onChange={this.handleSetHttpRequirePassword} />
              </Col>
              <div style={(!this.state.http.requirePassword) ? {display: 'none'} : {}} >
                <Col xs={6}>
                  <Input type="text" ref="httpUsername" label={__('Username')} placeholder={__('Username')} value={this.state.http.username} onChange={this.handleHttpUsernameChange} />
                </Col>
                <Col xs={6}>
                  <Input type="password" ref="httpPassword" label={__('Password')} placeholder={__('Password')} value={this.state.http.password} onChange={this.handleHttpPasswordChange} />
                </Col>
              </div>

            </Grid>
          :(this.state.use == 'socks5') ?
            <Grid>
              <Col xs={6}>
                <Input type="text" ref="socksHost" label={__('Proxy server address')} placeholder={__('Proxy server address')} value={this.state.socks5.host} onChange={this.handleSocksHostChange} />
              </Col>
              <Col xs={6}>
                <Input type="text" ref="socksPort" label={__('Proxy server port')} placeholder={__('Proxy server port')} value={this.state.socks5.port} onChange={this.handleSocksPortChange} />
              </Col>
            </Grid>
          : (this.state.use === 'pac') ?
            <Grid>
              <Col xs={12}>
                <Input type="text" ref="pacAddr" label={__('PAC address')} placeholder={__('PAC address')} value={this.state.pacAddr} onChange={this.handlePACAddrChange} />
              </Col>
            </Grid>
          :
            <Grid>
              <Col xs={12}>
                <center>{__('Will connect to server directly.')}</center>
              </Col>
            </Grid>
        }
        <Divider text={__('Times of reconnect')} />
        <Grid>
          <Col xs={12}>
            <Input type="number" ref="retries" value={this.state.retries} onChange={this.handleSetRetries} />
          </Col>
          <Col xs={12}>
            <Alert bsStyle='danger'>
              {__('It may be unsafe!')}
            </Alert>
          </Col>
        </Grid>
        <Divider text={__('poi port')} />
        <Grid>
          <Col xs={12}>
            <Input type="number" ref="port" value={this.state.port} onChange={this.handleSetPort} placeholder={__("Default: 0 (Use random port)")} />
          </Col>
        </Grid>
        <Divider text={__('Save settings')} />
        <Grid>
          <Col xs={12}>
            <Button bsStyle="success" onClick={this.handleSaveConfig} style={{width: '100%'}}>{__('Save')}</Button>
          </Col>
        </Grid>
      </form>
    )
  }
})

export default NetworkConfig
