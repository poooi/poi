/* global config */
import React from 'react'
import { FormGroup, Button, Intent } from '@blueprintjs/core'
import { withNamespaces } from 'react-i18next'
import * as remote from '@electron/remote'

import { checkUpdate } from 'views/services/update'
import { Section, Wrapper } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'

import { DownloadProgress } from './download-progress'
import { FCD } from './fcd'
import { WctfDB } from './wctf-db'
import styled from 'styled-components'

const { changeChannel } = process.platform !== 'linux' ? remote.require('./lib/updater') : {}

config.on('config.set', (path, value) => {
  if (path === 'poi.update.beta' && process.platform !== 'linux') {
    changeChannel(value ? 'beta' : 'latest')
  }
})

const FullWidthFormGroup = styled(FormGroup)`
  width: 100%;

  & > div {
    width: 100%;
  }
`

export const Update = withNamespaces(['setting'])(({ t }) => (
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
            {t('setting:Check Update')}
          </Button>
        </FormGroup>
      </Wrapper>
      <Wrapper>
        <FormGroup inline>
          <SwitchConfig
            label={t('setting:Check update of beta version')}
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
))
