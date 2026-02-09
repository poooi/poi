import type { FileFilter } from 'electron'

import { Button, Callout, Intent } from '@blueprintjs/core'
import assert from 'assert'
import { X509Certificate } from 'crypto'
import fs from 'fs-extra'
import { get } from 'lodash'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { FolderPickerConfig } from '../components/folder-picker'

const filters: FileFilter[] = [{ name: 'PEM', extensions: ['pem'] }]

type ConfigState = {
  config?: Record<string, unknown>
}

export const CustomCertificateAuthority = () => {
  const { t } = useTranslation('setting')

  const value = useSelector((state: ConfigState) =>
    get(state.config, 'poi.network.customCertificateAuthority', ''),
  )
  const valueStr = typeof value === 'string' ? value : ''

  const handleDelete = useCallback(() => {
    config.set('poi.network.customCertificateAuthority', '')
  }, [])

  const handleTest = useCallback(async () => {
    try {
      const ca = await fs.readFile(valueStr, 'utf8')
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
  }, [valueStr, t])

  return (
    <div>
      <FolderPickerConfig
        label={t('setting:Custom Certificate Authority')}
        configName="poi.network.customCertificateAuthority"
        isFolder={false}
        filters={filters}
        extraControl={
          valueStr && (
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
