import React from 'react'
import { FormGroup, Button, Intent } from '@blueprintjs/core'
import { translate } from 'react-i18next'

import { checkUpdate } from 'views/services/update'
import { Section, Wrapper } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'

import { DownloadProgress } from './download-progress'
import { FCD } from './fcd'
import { WctfDB } from './wctf-db'

export const Update = translate(['setting'])(({ t }) => (
  <Section title={t('Update')}>
    <Wrapper>
      <Wrapper>
        <FormGroup inline>
          <DownloadProgress />
        </FormGroup>
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
        <FormGroup inline label={t('Poi internal data')}>
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
