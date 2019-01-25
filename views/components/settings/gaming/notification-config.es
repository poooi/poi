/* global config */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, map, capitalize } from 'lodash'
import { withNamespaces } from 'react-i18next'
import { Switch, Slider, FormGroup, Callout } from '@blueprintjs/core'

import { Section, Wrapper, HalfWrapper } from 'views/components/settings/components/section'
import { IntegerConfig } from 'views/components/settings/components/integer'
import { SwitchConfig } from 'views/components/settings/components/switch'

@withNamespaces(['setting'])
@connect((state, props) => ({
  enabled: get(state.config, 'poi.notify.enabled', true),
  expedition: get(state.config, 'poi.notify.expedition.enabled', true),
  construction: get(state.config, 'poi.notify.construction.enabled', true),
  battleEnd: get(state.config, 'poi.notify.battleEnd.enabled', true),
  repair: get(state.config, 'poi.notify.repair.enabled', true),
  morale: get(state.config, 'poi.notify.morale.enabled', true),
  others: get(state.config, 'poi.notify.others.enabled', true),
  volume: get(state.config, 'poi.notify.volume', 0.8),
}))
export class NotificationConfig extends Component {
  static propTypes = {
    enabled: PropTypes.bool,
  }

  handleSetNotify = path => () => {
    if (!path) {
      config.set('poi.notify.enabled', !this.props.enabled)
    } else {
      config.set(`poi.notify.${path}.enabled`, !get(this.props, path, true))
    }
  }

  handleChangeNotifyVolume = volume => {
    config.set('poi.notify.volume', volume)
  }

  handleEndChangeNotifyVolume = () => {
    window.notify(null)
  }

  handleSetTimeSettingShow = () => {
    const timeSettingShow = !this.state.timeSettingShow
    this.setState({ timeSettingShow })
  }

  render() {
    const { t } = this.props
    return (
      <Section title={t('setting:Notification')}>
        <Wrapper>
          <HalfWrapper>
            <FormGroup inline>
              <Switch checked={this.props.enabled} onChange={this.handleSetNotify(null)}>
                {t('setting:Enable notification')}
              </Switch>
            </FormGroup>
          </HalfWrapper>

          <HalfWrapper>
            <FormGroup inline label={t('Volume')}>
              <Slider
                disabled={!this.props.enabled}
                onChange={this.handleChangeNotifyVolume}
                onRelease={this.handleEndChangeNotifyVolume}
                min={0.0}
                max={1.0}
                stepSize={0.05}
                labelRenderer={value => `${Math.round(value * 100)}%`}
                value={this.props.volume}
              />
            </FormGroup>
          </HalfWrapper>

          <FormGroup inline label={t('Type')}>
            <Wrapper>
              {map(
                ['construction', 'expedition', 'repair', 'morale', 'battleEnd', 'others'],
                type => (
                  <Switch
                    key={type}
                    disabled={!this.props.enabled}
                    checked={this.props[type]}
                    onChange={this.handleSetNotify(type)}
                  >
                    {t(capitalize(type))}
                  </Switch>
                ),
              )}
            </Wrapper>
            {this.props.enabled && (
              <Callout>{t('Heavily damaged notification is managed by Prophet plugin')}</Callout>
            )}
          </FormGroup>

          <Wrapper>
            <FormGroup inline label={t('setting:Notify when expedition returns in')}>
              <IntegerConfig
                clampValueOnBlur
                min={0}
                max={7200}
                configName="poi.notify.expedition.value"
                defaultValue={60}
                disabled={!this.props.enabled || !this.props.expedition}
              />{' '}
              {t('main:s')}
            </FormGroup>
          </Wrapper>

          <Wrapper>
            <FormGroup inline label={t('setting:Notify when morale is greater than')}>
              <IntegerConfig
                clampValueOnBlur
                min={0}
                max={49}
                configName="poi.notify.morale.value"
                defaultValue={49}
                disabled={!this.props.enabled || !this.props.morale}
              />
            </FormGroup>
          </Wrapper>
        </Wrapper>
        <FormGroup inline label={t('Battleend')}>
          <Wrapper>
            <SwitchConfig
              label={t('Notify only when not focused')}
              configName="poi.notify.battleEnd.onlyBackground"
              defaultValue={true}
              disabled={!this.props.battleEnd}
            />
            <SwitchConfig
              label={t('Notify only when muted')}
              configName="poi.notify.battleEnd.onlyMuted"
              defaultValue={true}
              disabled={!this.props.battleEnd}
            />
          </Wrapper>
        </FormGroup>
      </Section>
    )
  }
}
