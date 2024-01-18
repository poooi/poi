import React, { useState, useEffect, FC } from 'react'
import { ipcRenderer } from 'electron'
import { Dialog, FormGroup, InputGroup, Classes, Button, Intent } from '@blueprintjs/core'
import { useTranslation } from 'react-i18next'

const BALogin = (usr: string, pwd: string) => {
  ipcRenderer.send('basic-auth-info', usr, pwd)
}

const BasicAuth: FC = () => {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')

  const login = () => {
    BALogin(user, password)
    setShowModal(false)
    setUser('')
    setPassword('')
  }

  const close = () => {
    setShowModal(false)
  }

  const open = () => {
    setShowModal(true)
  }

  const handleUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser(e.target.value)
  }

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  useEffect(() => {
    ipcRenderer.on('http-basic-auth', () => {
      open()
    })
  }, [])

  return (
    <Dialog
      isCloseButtonShown
      autoFocus={true}
      isOpen={showModal}
      onClose={close}
      title={t('Website requires login')}
    >
      <div className={Classes.DIALOG_BODY}>
        <FormGroup label={t('Username')}>
          <InputGroup
            value={user}
            type="username"
            placeholder={t('Username')}
            onChange={handleUser}
          />
        </FormGroup>

        <FormGroup label={t('Password')}>
          <InputGroup
            value={password}
            type="password"
            placeholder={t('Password')}
            onChange={handlePassword}
          />
        </FormGroup>
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={close}>{t('Cancel')}</Button>
          <Button intent={Intent.PRIMARY} onClick={login}>
            {t('Confirm')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default BasicAuth
