import React, { useCallback } from 'react'
import { FolderPickerConfig } from '../components/folder-picker'
import { useTranslation } from 'react-i18next'
import { Button, Callout, Intent } from '@blueprintjs/core'
import { get } from 'lodash'
import { useSelector } from 'react-redux'
import { FileFilter } from 'electron'

const filters: FileFilter[] = [{ name: 'PEM', extensions: ['pem'] }]

export const CustomCertificateAuthority = () => {
  const { t } = useTranslation('setting')

  const value = useSelector((state: any) =>
    get(state.config, 'poi.network.customCertificateAuthority', ''),
  )

  const handleDelete = useCallback(() => {
    config.set('poi.network.customCertificateAuthority', '')
  }, [])

  return (
    <div>
      <FolderPickerConfig
        label={t('setting:Custom Certificate Authority')}
        configName="poi.network.customCertificateAuthority"
        isFolder={false}
        filters={filters}
        extraControl={
          value && (
            <Button intent={Intent.DANGER} minimal onClick={handleDelete}>
              {t('setting:Delete')}
            </Button>
          )
        }
      />
      <Callout>{t('setting:custom-certificate-authority-description')}</Callout>
    </div>
  )
}
