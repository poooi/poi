import { HTMLSelect, FormGroup, Callout } from '@blueprintjs/core'
import { get, cloneDeep } from 'lodash'
import PropTypes from 'prop-types'
/* global config */
import React, { Component } from 'react'
import { withNamespaces } from 'react-i18next'
import { connect } from 'react-redux'
import { Section, Wrapper } from 'views/components/settings/components/section'
import { TextConfig } from 'views/components/settings/components/text'

import { ConnectionTest } from './connection-test'
import { CustomCertificateAuthority } from './custom-certificate-authority'
import { ProxyConfig } from './proxy-config'

@withNamespaces(['setting'])
@connect((state) => ({
  use: get(state, 'config.proxy.use', 'none'),
}))
export class ProxiesConfig extends Component {
  static propTypes = {
    use: PropTypes.string.isRequired,
  }

  handleChangeUse = (e) => {
    config.set('proxy.use', e.currentTarget.value)
  }

  render() {
    const { use, t } = this.props

    return (
      <Section title={t('setting:Proxy')}>
        <Wrapper>
          <Wrapper>
            <FormGroup inline label={t('Type')}>
              <HTMLSelect value={use} onChange={this.handleChangeUse}>
                <option key={0} value="http">
                  HTTP {t('setting:proxy')}
                </option>
                <option key={1} value="socks5">
                  Socks5 {t('setting:proxy')}
                </option>
                <option key={2} value="pac">
                  PAC {t('setting:file')} ({t('setting:Experimental')})
                </option>
                <option key={3} value="none">
                  {t('setting:No proxy')}
                </option>
              </HTMLSelect>
            </FormGroup>
          </Wrapper>

          {use === 'http' && <ProxyConfig type="http" enablePassword />}
          {use === 'socks5' && <ProxyConfig type="socks5" />}
          {use === 'pac' && (
            <FormGroup inline label={t('setting:PAC address')}>
              <TextConfig configName="proxy.pacAddr" defaultValue={''} />
            </FormGroup>
          )}
          {use === 'none' && <Callout>{t('Will connect to server directly')}</Callout>}
        </Wrapper>
      </Section>
    )
  }
}

@withNamespaces(['setting'])
@connect((state) => ({
  proxy: get(state, 'config.proxy', {}),
}))
export class NetworkConfig extends Component {
  state = {
    proxy: cloneDeep(this.props.proxy),
  }

  render() {
    const { t } = this.props
    return (
      <div>
        <ProxiesConfig />
        <Section title={t('setting:Connection test')}>
          <ConnectionTest />
        </Section>
        <Section title={t('setting:Custom Certificate Authority')}>
          <CustomCertificateAuthority />
        </Section>
      </div>
    )
  }
}
