import { FormGroup } from '@blueprintjs/core'
import { get } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { IntegerConfig } from 'views/components/settings/components/integer'
import { Wrapper, HalfWrapper } from 'views/components/settings/components/section'
import { SwitchConfig } from 'views/components/settings/components/switch'
import { TextConfig } from 'views/components/settings/components/text'

const DEFAULT = {
  http: {
    host: '127.0.0.1',
    port: 8099,
    requirePassword: false,
    username: '',
    password: '',
  },
  socks5: {
    host: '127.0.0.1',
    port: 1080,
  },
}

type ProxyType = keyof typeof DEFAULT

interface Props {
  type: ProxyType
  enablePassword?: boolean
}

type ConfigState = { config: Record<string, unknown> }

export const ProxyConfig = ({ type, enablePassword }: Props) => {
  const { t } = useTranslation('setting')
  const requirePassword = Boolean(
    useSelector((state: ConfigState) =>
      get(state.config, ['proxy', type, 'requirePassword'], false),
    ),
  )

  return (
    <>
      <HalfWrapper>
        <FormGroup inline label={t('Proxy server address')}>
          <TextConfig
            configName={`proxy.${type}.host`}
            defaultValue={get(DEFAULT, [type, 'host'], '')}
          />
        </FormGroup>
      </HalfWrapper>

      <HalfWrapper>
        <FormGroup inline label={t('Proxy server port')}>
          <IntegerConfig
            clampValueOnBlur
            min={0}
            max={65535}
            configName={['proxy', type, 'port'].join('.')}
            defaultValue={get(DEFAULT, [type, 'port'], 0)}
          />
        </FormGroup>
      </HalfWrapper>

      {enablePassword && (
        <>
          <Wrapper>
            <FormGroup inline>
              <SwitchConfig
                label={t('Proxy server requires password')}
                configName={['proxy', type, 'requirePassword'].join('.')}
                defaultValue={false}
              />
            </FormGroup>
          </Wrapper>

          <HalfWrapper>
            <FormGroup inline label={t('Username')}>
              <TextConfig
                disabled={!requirePassword}
                configName={`proxy.${type}.username`}
                defaultValue={get(DEFAULT, [type, 'username'], '')}
              />
            </FormGroup>
          </HalfWrapper>

          <HalfWrapper>
            <FormGroup inline label={t('Password')}>
              <TextConfig
                disabled={!requirePassword}
                configName={`proxy.${type}.password`}
                defaultValue={get(DEFAULT, [type, 'password'], '')}
              />
            </FormGroup>
          </HalfWrapper>
        </>
      )}
    </>
  )
}
