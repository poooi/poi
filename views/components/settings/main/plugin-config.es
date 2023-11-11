import React from 'react'
import { FormGroup } from '@blueprintjs/core'
import { withNamespaces } from 'react-i18next'
import { map, entries } from 'lodash'
import path from 'path'

import { SwitchConfig } from 'views/components/settings/components/switch'
import { Section, Wrapper } from 'views/components/settings/components/section'
import { RadioConfig } from 'views/components/settings/components/radio'

const MIRROR_JSON_PATH = path.join(global.ROOT, 'assets', 'data', 'mirror.json')
const MIRRORS = require(MIRROR_JSON_PATH)

const MIRROR_OPTIONS = map(entries(MIRRORS), ([server, { name }]) => ({
  name,
  value: server,
}))

export const PluginConfig = withNamespaces(['setting'])(({ t }) => (
  <Section title={t('Plugin')}>
    <Wrapper>
      <Wrapper>
        <FormGroup inline>
          <SwitchConfig
            label={t('setting:Switch to Plugin Automatically')}
            configName="poi.autoswitch.enabled"
            defaultValue={true}
          />
        </FormGroup>
      </Wrapper>

      <Wrapper>
        <FormGroup inline>
          <SwitchConfig
            label={t('setting:Enable autoswitch for main panel')}
            configName="poi.autoswitch.main"
            defaultValue={true}
          />
        </FormGroup>
      </Wrapper>

      <Wrapper>
        <FormGroup inline label={t('npm server')}>
          <RadioConfig
            configName="packageManager.mirrorName"
            defaultValue={navigator.language === 'zh-CN' ? 'taobao' : 'npm'}
            availableVal={MIRROR_OPTIONS}
          />
        </FormGroup>
      </Wrapper>

      <Wrapper>
        <FormGroup inline>
          <SwitchConfig
            label={t('Update plugins at startup')}
            configName="packageManager.enableAutoUpdate"
            defaultValue={true}
          />
        </FormGroup>
      </Wrapper>

      <Wrapper>
        <FormGroup inline>
          <SwitchConfig
            label={t('Try plugin beta version')}
            configName="packageManager.enableBetaPluginCheck"
            defaultValue={false}
          />
        </FormGroup>
      </Wrapper>
    </Wrapper>
  </Section>
))
