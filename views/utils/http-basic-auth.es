import { ipcRenderer } from 'electron'
import React, { PureComponent } from 'react'
import { Modal, Form, FormGroup, Col, ControlLabel, FormControl, Button } from 'react-bootstrap'
const {i18n} = window
const __ = i18n.others.__.bind(i18n.others)

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
          <Modal.Title>{__("Website requires login")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <FormGroup controlId="formHorizontalEmail">
              <Col componentClass={ControlLabel} sm={2}>
                {__("Username")}
              </Col>
              <Col sm={10}>
                <FormControl value={this.state.user} type="username" placeholder={__("Username")} onChange={this.handleUser} />
              </Col>
            </FormGroup>
  
            <FormGroup controlId="formHorizontalPassword">
              <Col componentClass={ControlLabel} sm={2}>
                {__("Password")}
              </Col>
              <Col sm={10}>
                <FormControl value={this.state.password} type="password" placeholder={__("Password")} onChange={this.handlePassword}/>
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>{__("Cancel")}</Button>
          <Button bsStyle="primary" onClick={this.login}>{__("Confirm")}</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

export { BasicAuth }
