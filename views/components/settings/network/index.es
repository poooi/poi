/* global config */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, cloneDeep, isEqual } from 'lodash'
import { translate } from 'react-i18next'
import { HTMLSelect, FormGroup, Callout, Intent } from '@blueprintjs/core'
import { compose } from 'redux'
import styled from 'styled-components'
import { rgba } from 'polished'

import { Section, Wrapper } from 'views/components/settings/components/section'
import { TextConfig } from 'views/components/settings/components/text'
import { IntegerConfig } from 'views/components/settings/components/integer'
import { SwitchConfig } from 'views/components/settings/components/switch'

import { ProxyConfig } from './proxy-config'

const StickyCallout = styled(Callout)`
  position: sticky;
  z-index: 5;
  top: 0;
  background-color: ${props => rgba(props.theme.GREEN1, 0.8)} !important;
`

@translate(['setting'])
@connect(state => ({
  use: get(state, 'config.proxy.use', 'none'),
}))
class ProxiesConfig extends Component {
  static propTypes = {
    use: PropTypes.string.isRequired,
  }

  handleChangeUse = e => {
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

const ConnectionRetries = compose(
  translate(['setting']),
  connect(state => ({
    retries: get(state, 'config.proxy.retries', 0),
  })),
)(({ retries, t }) => (
  <Section title={t('setting:Connection retries')}>
    <Wrapper>
      <FormGroup inline>
        <IntegerConfig
          clampValueOnBlur
          min={0}
          max={20}
          configName="proxy.retries"
          defaultValue={0}
        />
      </FormGroup>
      {retries > 0 && (
        <Callout intent={Intent.WARNING}>{t('The result is not guaranteed, beware')}</Callout>
      )}
    </Wrapper>
  </Section>
))

const RelayMode = compose(
  translate(['setting']),
  connect(state => {
    const use = get(state, 'config.proxy.use', 'none')
    return {
      proxyPort: get(state, ['config', 'proxy', use, 'port'], -1),
      port: get(state, ['config', 'proxy', 'port']),
      allowLAN: get(state, 'config.proxy.allowLAN'),
    }
  }),
)(({ proxyPort, port, allowLAN, t }) => (
  <Section title={t('Relay mode')}>
    <Wrapper>
      <Callout intent={Intent.WARNING}>
        {t('If you do not know what is this section for, leave it unconfigured')}
      </Callout>
      <Wrapper>
        <FormGroup inline label={t('poi port')}>
          <IntegerConfig
            clampValueOnBlur
            max={65535}
            min={0}
            configName="proxy.port"
            defaultValue={0}
          />
        </FormGroup>
        {port === proxyPort && (
          <Callout intent={Intent.WARNING}>
            {t('Proxy port and poi port are the same, are you sure?')}
          </Callout>
        )}
      </Wrapper>
      <Wrapper>
        <FormGroup inline>
          <SwitchConfig
            configName="config.proxy.allowLAN"
            defaultValue={false}
            label={t('Allow access from other machines on LAN or WAN')}
          />
        </FormGroup>
      </Wrapper>
    </Wrapper>
  </Section>
))

@translate(['setting'])
@connect(state => ({
  proxy: get(state, 'config.proxy'),
}))
export class NetworkConfig extends Component {
  state = {
    proxy: cloneDeep(this.props.proxy),
  }

  render() {
    const { proxy, t } = this.props
    return (
      <div>
        {!isEqual(this.state.proxy, proxy) && (
          <StickyCallout intent={Intent.SUCCESS}>
            {t('Network setting changes will be effective after restarting poi')}
          </StickyCallout>
        )}
        <ProxiesConfig />
        <ConnectionRetries />
        <RelayMode />
      </div>
    )
  }
}
