import { ipcRenderer } from 'electron'
import React, { PureComponent } from 'react'
import { Modal, Form, FormGroup, Col, ControlLabel, FormControl, Button } from 'react-bootstrap'
import { translate } from 'react-i18next'

const BALogin = (usr,pwd) => {
  ipcRenderer.send('basic-auth-info', usr, pwd)
}

@translate()
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
    const { t } = this.props
    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Modal.Header closeButton>
          <Modal.Title>{t('Website requires login')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form horizontal>
            <FormGroup controlId="formHorizontalEmail">
              <Col componentClass={ControlLabel} sm={2}>
                {t('Username')}
              </Col>
              <Col sm={10}>
                <FormControl value={this.state.user} type="username" placeholder={t("Username")} onChange={this.handleUser} />
              </Col>
            </FormGroup>

            <FormGroup controlId="formHorizontalPassword">
              <Col componentClass={ControlLabel} sm={2}>
                {t('Password')}
              </Col>
              <Col sm={10}>
                <FormControl value={this.state.password} type="password" placeholder={t("Password")} onChange={this.handlePassword}/>
              </Col>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>{t('Cancel')}</Button>
          <Button bsStyle="primary" onClick={this.login}>{t('Confirm')}</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

export { BasicAuth }
