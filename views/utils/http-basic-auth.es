import { ipcRenderer } from 'electron'
import React, { PureComponent } from 'react'
import { Modal, Form, FormGroup, Col, ControlLabel, FormControl, Button } from 'react-bootstrap'
import { Trans } from 'react-i18next'
import i18next from 'views/env-parts/i18next'

const BALogin = (usr,pwd) => {
  ipcRenderer.send('basic-auth-info', usr, pwd)
}
class BasicAuth extends PureComponent {
  state ={
    showModal: false,
    user:'',
    password:'',
  }
  login = (usr, passwd) => {
    BALogin(this.state.user, this.state.password)
    this.setState({
      showModal: false,
      user: '',
      password: '',
    })
  }
  close = () => {
    this.setState({ showModal: false })
  }
  open = () => {
    this.setState({ showModal: true })
  }
  handleUser = (e) => {
    this.setState({ user: e.target.value })
  }
  handlePassword = (e) => {
    this.setState({ password: e.target.value })
  }
  componentDidMount = () => {
    ipcRenderer.on('http-basic-auth', (event, arg) => {
      this.open()
    })
  }
  render() {
    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Modal.Header closeButton>
          <Modal.Title><Trans>Website requires login</Trans></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <FormGroup controlId="formHorizontalEmail">
              <Col componentClass={ControlLabel} sm={2}>
                <Trans>Username</Trans>
              </Col>
              <Col sm={10}>
                <FormControl value={this.state.user} type="username" placeholder={i18next.t("Username")} onChange={this.handleUser} />
              </Col>
            </FormGroup>

            <FormGroup controlId="formHorizontalPassword">
              <Col componentClass={ControlLabel} sm={2}>
                <Trans>Password</Trans>
              </Col>
              <Col sm={10}>
                <FormControl value={this.state.password} type="password" placeholder={i18next.t("Password")} onChange={this.handlePassword}/>
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}><Trans>Cancel</Trans></Button>
          <Button bsStyle="primary" onClick={this.login}><Trans>Confirm</Trans></Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

export { BasicAuth }
