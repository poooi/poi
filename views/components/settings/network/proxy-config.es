import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, mapValues } from 'lodash'
import { FormGroup } from '@blueprintjs/core'
import { translate } from 'react-i18next'

import { Wrapper, HalfWrapper } from 'views/components/settings/components/section'
import { TextConfig } from 'views/components/settings/components/text'
import { SwitchConfig } from 'views/components/settings/components/switch'
import { IntegerConfig } from 'views/components/settings/components/integer'

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

@translate(['setting'])
@connect((state, { type }) =>
  mapValues(DEFAULT[type], (value, key) => get(state, ['config', 'proxy', type, key], value)),
)
export class ProxyConfig extends PureComponent {
  static propTypes = {
    type: PropTypes.oneOf(Object.keys(DEFAULT)).isRequired,
    host: PropTypes.string.isRequired,
    port: PropTypes.number.isRequired,
    enablePassword: PropTypes.bool,
    requirePassword: PropTypes.bool,
    username: PropTypes.string,
    password: PropTypes.password,
  }

  render() {
    const { requirePassword, enablePassword, type, t } = this.props

    return (
      <>
        <HalfWrapper>
          <FormGroup inline label={t('setting:Proxy server address')}>
            <TextConfig
              configName={`proxy.${type}.host`}
              defaultValue={get(DEFAULT, [type, 'host'])}
            />
          </FormGroup>
        </HalfWrapper>

        <HalfWrapper>
          <FormGroup inline label={t('setting:Proxy server port')}>
            <IntegerConfig
              clampValueOnBlur
              min={0}
              max={65535}
              configName={['proxy', type, 'port'].join('.')}
              defaultValue={get(DEFAULT, [type, 'port'])}
            />
          </FormGroup>
        </HalfWrapper>

        {enablePassword && (
          <>
            <Wrapper>
              <FormGroup inline>
                <SwitchConfig
                  label={t('setting:Proxy server requires password')}
                  configName={['proxy', type, 'requirePassword'].join('.')}
                  defaultValue={false}
                />
              </FormGroup>
            </Wrapper>

            <HalfWrapper>
              <FormGroup inline label={t('setting:Username')}>
                <TextConfig
                  disabled={!requirePassword}
                  configName={`proxy.${type}.username`}
                  defaultValue={get(DEFAULT, [type, 'username'])}
                />
              </FormGroup>
            </HalfWrapper>

            <HalfWrapper>
              <FormGroup inline label={t('setting:Password')}>
                <TextConfig
                  disabled={!requirePassword}
                  configName={`proxy.${type}.password`}
                  defaultValue={get(DEFAULT, [type, 'password'])}
                />
              </FormGroup>
            </HalfWrapper>
          </>
        )}
      </>
    )
  }
}
