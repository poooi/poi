import type { ChangeChannel } from 'lib/updater'

import { FormGroup, Button, Intent } from '@blueprintjs/core'
import * as remote from '@electron/remote'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { styled } from 'styled-components'
import { Section, Wrapper } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'
import { checkUpdate } from 'views/services/update'

import { DownloadProgress } from './download-progress'
import { FCD } from './fcd'
import { WctfDB } from './wctf-db'

const changeChannel: ChangeChannel | undefined =
  process.platform !== 'linux' ? remote.require('./lib/updater').changeChannel : undefined

config.on('config.set', (path: string, value: unknown) => {
  if (path === 'poi.update.beta' && process.platform !== 'linux') {
    changeChannel?.(value ? 'beta' : 'latest')
  }
})

const FullWidthFormGroup = styled(FormGroup)`
  width: 100%;

  & > div {
    width: 100%;
  }
`

export const Update = () => {
  const { t } = useTranslation('setting')
  return (
    <Section title={t('Update')}>
      <Wrapper>
        <Wrapper>
          <FullWidthFormGroup inline>
            <DownloadProgress />
          </FullWidthFormGroup>
        </Wrapper>
        <Wrapper>
          <FormGroup inline>
            <Button minimal intent={Intent.PRIMARY} onClick={checkUpdate}>
              {t('Check Update')}
            </Button>
          </FormGroup>
        </Wrapper>
        <Wrapper>
          <FormGroup inline>
            <SwitchConfig
              label={t('Check update of beta version')}
              configName="poi.update.beta"
              defaultValue={false}
            />
          </FormGroup>
        </Wrapper>

        <Wrapper>
          <FormGroup inline label={t('poi internal data')}>
            <FCD />
          </FormGroup>
        </Wrapper>

        <Wrapper>
          <FormGroup inline label={t('Who Calls The Fleet Database')}>
            <WctfDB />
          </FormGroup>
        </Wrapper>
      </Wrapper>
    </Section>
  )
}
