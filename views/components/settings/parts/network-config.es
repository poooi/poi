import { FormControl, FormGroup, ControlLabel, Checkbox, Grid, Col, Button, Alert, Collapse } from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import { connect } from 'react-redux'
import React from 'react'
import Divider from './divider'
import { get } from 'lodash'

const {config, i18n, toggleModal} = window
const __ = i18n.setting.__.bind(i18n.setting)
const {Component} = React

const basic = {
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
  allowLAN: false,
  showAdvanced: false,
}

const NetworkConfig = connect(() => (
  (state, props) => {
    const ret = get(state, 'config.proxy') || {}
    for (const key of Object.keys(basic)) {
      if (ret[key] === undefined) {
        ret[key] = basic[key]
      }
    }
    return ret
  }
))(class netWorkConfig extends Component {
  constructor(props) {
    super(props)
    this.state = Object.clone(props)
  }
  handleChangeUse = (e) => {
    const use = e.target.value
    this.setState({
      use,
    })
  }
  handleSaveConfig = (e) => {
    const proxy = Object.clone(this.state)
    let retries = parseInt(this.state.retries)
    if (isNaN(retries) || retries < 0) {
      retries = 0
      proxy.retries = 0
    }
    let port = parseInt(this.state.port)
    if (isNaN(port) || port < 1024 || port > 65535) {
      port = 0
      proxy.port = 0
    }
    delete proxy.showAdvanced
    config.set('proxy', proxy)
    this.setState({
      retries,
      port,
    })
    toggleModal(__('Proxy setting'), __('Success! It will be available after a restart.'))
  }
  handleHttpHostChange = (e) => {
    const http = Object.clone(this.state.http)
    http.host = e.target.value
    this.setState({
      http,
    })
  }
  handleHttpPortChange = (e) => {
    const http = Object.clone(this.state.http)
    http.port = parseInt(e.target.value) || 0
    this.setState({
      http,
    })
  }
  handleSetHttpRequirePassword = (e) => {
    const http = Object.clone(this.state.http)
    http.requirePassword = !http.requirePassword
    this.setState({
      http,
    })
  }
  handleHttpUsernameChange = (e) => {
    const http = Object.clone(this.state.http)
    http.username = e.target.value
    this.setState({
      http,
    })
  }
  handleHttpPasswordChange = (e) => {
    const http = Object.clone(this.state.http)
    http.password = e.target.value
    this.setState({
      http,
    })
  }
  handleSocksHostChange = (e) => {
    const socks5 = Object.clone(this.state.socks5)
    socks5.host = e.target.value
    this.setState({
      socks5,
    })
  }
  handleSocksPortChange = (e) => {
    const socks5 = Object.clone(this.state.socks5)
    socks5.port = parseInt(e.target.value) || 0
    this.setState({
      socks5,
    })
  }
  handlePACAddrChange = (e) => {
    this.setState({
      pacAddr: e.target.value,
    })
  }
  handleSetRetries = (e) => {
    this.setState({
      retries: parseInt(e.target.value) || 0,
    })
  }
  handleSetPort = (e) => {
    this.setState({
      port: parseInt(e.target.value) || 0,
    })
  }
  handleSetAllowLAN = (e) => {
    this.setState({
      allowLAN: !this.state.allowLAN,
    })
  }
  handleShowAdvanced = (e) => {
    this.setState({
      showAdvanced: !this.state.showAdvanced,
    })
  }
  render() {
    return (
      <form>
        <Divider text={__('Proxy server information')} />
        <Grid>
          <Col xs={12}>
            <FormControl componentClass="select" value={this.state.use || "none"} onChange={this.handleChangeUse}>
              <option key={0} value="http">HTTP {__("proxy")}</option>
              <option key={1} value="socks5">Socks5 {__("proxy")}</option>
              <option key={2} value="pac">PAC {__("file")} ({__("Experimental")})</option>
              <option key={3} value="none">{__("No proxy")}</option>
            </FormControl>
          </Col>
        </Grid>
        {
          (this.state.use === 'http') ?
            <Grid>
              <Col xs={6}>
                <FormGroup>
                  <ControlLabel>{__('Proxy server address')}</ControlLabel>
                  <FormControl type="text" placeholder={__('Proxy server address')} value={this.state.http.host} onChange={this.handleHttpHostChange} />
                </FormGroup>
              </Col>
              <Col xs={6}>
                <FormGroup>
                  <ControlLabel>{__('Proxy server port')}</ControlLabel>
                  <FormControl type="text" placeholder={__('Proxy server port')} value={this.state.http.port} onChange={this.handleHttpPortChange} />
                </FormGroup>
              </Col>
              <Col xs={12}>
                <Checkbox checked={!!this.state.http.requirePassword} onChange={this.handleSetHttpRequirePassword}>
                  {__('Proxy server requires password')}
                </Checkbox>
              </Col>
              <div style={(!this.state.http.requirePassword) ? {display: 'none'} : {}} >
                <Col xs={6}>
                  <FormGroup>
                    <ControlLabel>{__('Username')}</ControlLabel>
                    <FormControl type="text" placeholder={__('Username')} value={this.state.http.username} onChange={this.handleHttpUsernameChange} />
                  </FormGroup>
                </Col>
                <Col xs={6}>
                  <FormGroup>
                    <ControlLabel>{__('Password')}</ControlLabel>
                    <FormControl type="password" placeholder={__('Password')} value={this.state.http.password} onChange={this.handleHttpPasswordChange} />
                  </FormGroup>
                </Col>
              </div>

            </Grid>
            :(this.state.use == 'socks5') ?
              <Grid>
                <Col xs={6}>
                  <FormGroup>
                    <ControlLabel>{__('Proxy server address')}</ControlLabel>
                    <FormControl type="text" placeholder={__('Proxy server address')} value={this.state.socks5.host} onChange={this.handleSocksHostChange} />
                  </FormGroup>
                </Col>
                <Col xs={6}>
                  <FormGroup>
                    <ControlLabel>{__('Proxy server port')}</ControlLabel>
                    <FormControl type="text" placeholder={__('Proxy server port')} value={this.state.socks5.port} onChange={this.handleSocksPortChange} />
                  </FormGroup>
                </Col>
              </Grid>
              : (this.state.use === 'pac') ?
                <Grid>
                  <Col xs={12}>
                    <FormGroup>
                      <ControlLabel>{__('PAC address')}</ControlLabel>
                      <FormControl type="text" placeholder={__('PAC address')} value={this.state.pacAddr} onChange={this.handlePACAddrChange} />
                    </FormGroup>
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
            <FormControl type="number" value={this.state.retries} onChange={this.handleSetRetries} />
          </Col>
          <Col xs={12}>
            <Alert bsStyle='danger'>
              {__('It may be unsafe!')}
            </Alert>
          </Col>
        </Grid>
        <Divider onClick={this.handleShowAdvanced} text={
          <span>
            <span>{__('Advanced (require restart)')}</span>
            <FontAwesome name={this.state.showAdvanced ? 'angle-up' : 'angle-down'} />
          </span>
        } />
        <Grid>
          <Collapse in={this.state.showAdvanced}>
            <div>
              <Col xs={12}>
                <ControlLabel>{__("poi port")}</ControlLabel>
                <FormControl type="number" value={this.state.port} onChange={this.handleSetPort} placeholder={__("Default: 0 (Use random port)")} />
              </Col>
              <Col xs={12}>
                <Checkbox checked={this.state.allowLAN} onChange={this.handleSetAllowLAN}>{__("Allow connections from LAN")}</Checkbox>
              </Col>
            </div>
          </Collapse>
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
