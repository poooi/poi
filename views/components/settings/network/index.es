import { connect } from 'react-redux'
import React, { Component } from 'react'
import { get, cloneDeep, isEqual } from 'lodash'
import { translate } from 'react-i18next'
import { HTMLSelect, FormGroup, Callout, Intent } from '@blueprintjs/core'
import { compose } from 'redux'

import { Section, Wrapper } from 'views/components/settings/components/section'
import { TextConfig } from 'views/components/settings/components/text'
import { IntegerConfig } from 'views/components/settings/components/integer'
import { SwitchConfig } from 'views/components/settings/components/switch'

import { ProxyConfig } from './proxy-config'

const { config } = window

@translate(['setting'])
@connect(state => ({
  use: get(state, 'config.proxy.use', 'none'),
  proxy: get(state, 'config.proxy'),
}))
class ProxysConfig extends Component {
  state = {
    proxy: cloneDeep(this.props.proxy),
  }

  handleChangeUse = e => {
    config.set('proxy.use', e.currentTarget.value)
  }

  render() {
    const { use, proxy, t } = this.props

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
          {!isEqual(this.state.proxy, proxy) && (
            <Callout intent={Intent.SUCCESS}>
              {t('Changes will be effective after restarting Poi')}
            </Callout>
          )}
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
      {
        retries > 0 &&
        <Callout intent={Intent.WARNING}>{t('The result is not guaranteed, beware')}</Callout>
      }
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
        <FormGroup inline label={t('Poi port')}>
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

export const NetworkConfig = () =>  (
  <div>
    <ProxysConfig />
    <ConnectionRetries />
    <RelayMode />
  </div>
)

