import React, { PureComponent } from 'react'
import { ipcRenderer } from 'electron'
import { withNamespaces } from 'react-i18next'
import { Dialog, FormGroup, InputGroup, Classes, Button, Intent } from '@blueprintjs/core'

const BALogin = (usr, pwd) => {
  ipcRenderer.send('basic-auth-info', usr, pwd)
}

@withNamespaces()
class BasicAuth extends PureComponent {
  state = {
    showModal: false,
    user: '',
    password: '',
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

  handleUser = e => {
    this.setState({ user: e.target.value })
  }

  handlePassword = e => {
    this.setState({ password: e.target.value })
  }

  componentDidMount = () => {
    ipcRenderer.on('http-basic-auth', (event, arg) => {
      this.open()
    })
  }

  render() {
    const { t } = this.props
    const { showModal, user, password } = this.state
    return (
      <Dialog
        isCloseButtonShown
        autoFocus={true}
        animation={true}
        isOpen={showModal}
        onClose={this.close}
        title={t('Website requires login')}
      >
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={t('Username')}>
            <InputGroup
              value={user}
              type="username"
              placeholder={t('Username')}
              onChange={this.handleUser}
            />
          </FormGroup>

          <FormGroup label={t('Password')}>
            <InputGroup
              value={password}
              type="password"
              placeholder={t('Password')}
              onChange={this.handlePassword}
            />
          </FormGroup>
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={this.close}>{t('Cancel')}</Button>
            <Button intent={Intent.PRIMARY} onClick={this.login}>
              {t('Confirm')}
            </Button>
          </div>
        </div>
      </Dialog>
    )
  }
}

export { BasicAuth }
