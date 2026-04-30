import { FormGroup } from '@blueprintjs/core'
import { map, entries } from 'lodash'
import path from 'path'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RadioConfig } from 'views/components/settings/components/radio'
import { Section, Wrapper } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'
import { ROOT } from 'views/env'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MIRRORS: Record<string, { name: string }> = require(
  path.join(ROOT, 'assets', 'data', 'mirror.json'),
)

const MIRROR_OPTIONS = map(entries(MIRRORS), ([server, { name }]) => ({
  name,
  value: server,
}))

export const PluginConfig = () => {
  const { t } = useTranslation('setting')
  return (
    <Section title={t('Plugin')}>
      <Wrapper>
        <Wrapper>
          <FormGroup inline>
            <SwitchConfig
              label={t('Switch to Plugin Automatically')}
              configName="poi.autoswitch.enabled"
              defaultValue={true}
            />
          </FormGroup>
        </Wrapper>

        <Wrapper>
          <FormGroup inline>
            <SwitchConfig
              label={t('Enable autoswitch for main panel')}
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
  )
}
