import React, { useCallback } from 'react'
import { FolderPickerConfig } from '../components/folder-picker'
import { useTranslation } from 'react-i18next'
import { Button, Callout, Intent } from '@blueprintjs/core'
import { get } from 'lodash'
import { useSelector } from 'react-redux'
import { FileFilter } from 'electron'
import fs from 'fs-extra'
import { X509Certificate } from 'crypto'
import assert from 'assert'

const filters: FileFilter[] = [{ name: 'PEM', extensions: ['pem'] }]

export const CustomCertificateAuthority = () => {
  const { t } = useTranslation('setting')

  const value = useSelector((state: any) =>
    get(state.config, 'poi.network.customCertificateAuthority', ''),
  )

  const handleDelete = useCallback(() => {
    config.set('poi.network.customCertificateAuthority', '')
  }, [])

  const handleTest = useCallback(async () => {
    try {
      const ca = await fs.readFile(value, 'utf8')
      const cert = new X509Certificate(ca)
      assert(cert.ca)
      window.toast(t('setting:Certificate is valid'), {
        type: 'success',
        title: t('setting:Custom Certificate Authority test'),
      })
    } catch (e) {
      console.error(e)
      window.toast(t('setting:Certificate is invalid'), {
        type: 'error',
        title: t('setting:Custom Certificate Authority test'),
      })
    }
  }, [value, t])

  return (
    <div>
      <FolderPickerConfig
        label={t('setting:Custom Certificate Authority')}
        configName="poi.network.customCertificateAuthority"
        isFolder={false}
        filters={filters}
        extraControl={
          value && (
            <>
              <Button intent={Intent.PRIMARY} minimal onClick={handleTest}>
                {t('setting:Test')}
              </Button>
              <Button intent={Intent.DANGER} minimal onClick={handleDelete}>
                {t('setting:Delete')}
              </Button>
            </>
          )
        }
      />
      <Callout>{t('setting:custom-certificate-authority-description')}</Callout>
    </div>
  )
}
