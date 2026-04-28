import { Button, FormGroup, Intent, Callout } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import { remove } from 'fs-extra'
import { join } from 'path'
import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { styled } from 'styled-components'
import { FolderPickerConfig } from 'views/components/settings/components/folder-picker'
import { IntegerConfig } from 'views/components/settings/components/integer'
import { Section, Wrapper, FillAvailable } from 'views/components/settings/components/section'

declare const APPDATA_PATH: string

const { session } = remote.require('electron')

const _rawCachePath = remote.getGlobal('DEFAULT_CACHE_PATH')
const defaultCachePath = typeof _rawCachePath === 'string' ? _rawCachePath : ''

const ButtonArea = styled(Wrapper)`
  button + button {
    margin-left: 10px;
  }

  .bp5-callout {
    margin-top: 0.5em;
  }
`
const InlineFormGroup = styled(FormGroup)`
  .bp5-form-content {
    display: flex;
    align-items: center;
  }

  label {
    flex-shrink: 0;
  }
`
const EndLabel = styled.div`
  margin-left: 8px;
`

export const StorageConfig = () => {
  const { t } = useTranslation('setting')
  const [cacheSize, setCacheSize] = useState(0)

  const handleUpdateCacheSize = useCallback(async () => {
    setCacheSize(await session.defaultSession.getCacheSize())
  }, [])

  useEffect(() => {
    handleUpdateCacheSize().catch(() => null)
    const cycle = setInterval(handleUpdateCacheSize, 6000000)
    return () => clearInterval(cycle)
  }, [handleUpdateCacheSize])

  const handleClearCookie = () => {
    void remove(join(APPDATA_PATH, 'Cookies')).catch(() => null)
    void remove(join(APPDATA_PATH, 'Cookies-journal')).catch(() => null)
    remote
      .getCurrentWebContents()
      .session.clearStorageData({ storages: ['cookies'] })
      .then(() => {
        window.toggleModal(t('Delete cookies'), t('Success!'), [])
      })
  }

  const handleClearCache = () => {
    remote
      .getCurrentWebContents()
      .session.clearCache()
      .then(() => {
        window.toggleModal(t('Delete cache'), t('Success!'), [])
      })
  }

  const handleRevokeCert = () => {
    config.set('poi.misc.trustedCerts', [])
    config.set('poi.misc.untrustedCerts', [])
  }

  return (
    <Section title={t('Storage')}>
      <Wrapper>
        <Wrapper>
          <FormGroup inline label={t('Current cache size')}>
            {Math.round(cacheSize / 1048576)}MB{' '}
            <Button minimal intent={Intent.PRIMARY} onClick={() => void handleUpdateCacheSize()}>
              {t('Update')}
            </Button>
          </FormGroup>
        </Wrapper>

        <Wrapper>
          <InlineFormGroup inline label={t('Maximum cache size')}>
            <IntegerConfig
              clampValueOnBlur
              min={0}
              max={20480}
              configName="poi.misc.cache.size"
              defaultValue={640}
            />
            <EndLabel>MB</EndLabel>
          </InlineFormGroup>
        </Wrapper>

        <FillAvailable>
          <InlineFormGroup inline label={t('Clear')}>
            <ButtonArea>
              <Button minimal intent={Intent.WARNING} onClick={handleClearCookie}>
                {t('Delete cookies')}
              </Button>
              <Button minimal intent={Intent.WARNING} onClick={handleClearCache}>
                {t('Delete cache')}
              </Button>
              <Button minimal intent={Intent.WARNING} onClick={handleRevokeCert}>
                {t('Revoke trusted / ignored certificates')}
              </Button>
              <Callout>{t('If connection error occurs frequently, delete both of them')}</Callout>
            </ButtonArea>
          </InlineFormGroup>
        </FillAvailable>

        <FillAvailable>
          <FormGroup inline label={t('3rd party cache')}>
            <FolderPickerConfig
              label={t('3rd party cache')}
              configName="poi.misc.cache.path"
              defaultValue={defaultCachePath}
            />
          </FormGroup>
        </FillAvailable>
      </Wrapper>
    </Section>
  )
}
