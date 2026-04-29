import { HTMLSelect, FormGroup, Callout } from '@blueprintjs/core'
import { get } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Section, Wrapper } from 'views/components/settings/components/section'
import { TextConfig } from 'views/components/settings/components/text'

import { ConnectionTest } from './connection-test'
import { CustomCertificateAuthority } from './custom-certificate-authority'
import { ProxyConfig } from './proxy-config'

type ConfigState = { config: Record<string, unknown> }

export const ProxiesConfig = () => {
  const { t } = useTranslation('setting')
  const use = String(useSelector((state: ConfigState) => get(state, 'config.proxy.use', 'none')))

  const handleChangeUse = (e: React.ChangeEvent<HTMLSelectElement>) => {
    config.set('proxy.use', e.currentTarget.value)
  }

  return (
    <Section title={t('Proxy')}>
      <Wrapper>
        <Wrapper>
          <FormGroup inline label={t('Type')}>
            <HTMLSelect value={use} onChange={handleChangeUse}>
              <option key={0} value="http">
                HTTP {t('proxy')}
              </option>
              <option key={1} value="socks5">
                Socks5 {t('proxy')}
              </option>
              <option key={2} value="pac">
                PAC {t('file')} ({t('Experimental')})
              </option>
              <option key={3} value="none">
                {t('No proxy')}
              </option>
            </HTMLSelect>
          </FormGroup>
        </Wrapper>

        {use === 'http' && <ProxyConfig type="http" enablePassword />}
        {use === 'socks5' && <ProxyConfig type="socks5" />}
        {use === 'pac' && (
          <FormGroup inline label={t('PAC address')}>
            <TextConfig configName="proxy.pacAddr" defaultValue={''} />
          </FormGroup>
        )}
        {use === 'none' && <Callout>{t('Will connect to server directly')}</Callout>}
      </Wrapper>
    </Section>
  )
}

export const NetworkConfig = () => {
  const { t } = useTranslation('setting')
  return (
    <div>
      <ProxiesConfig />
      <Section title={t('Connection test')}>
        <ConnectionTest />
      </Section>
      <Section title={t('Custom Certificate Authority')}>
        <CustomCertificateAuthority />
      </Section>
    </div>
  )
}
