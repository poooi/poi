import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, map, capitalize } from 'lodash'
import { translate } from 'react-i18next'
import { Switch, Slider, FormGroup, NumericInput, Callout } from '@blueprintjs/core'
import styled from 'styled-components'

import { Section } from '../components/section'

const { config } = window

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  .bp3-switch {
    margin-right: 2em;
  }

  .bp3-form-content {
    flex: 1;
  }

  .bp3-numeric-input {
    display: inline-flex;
  }

  .bp3-input-group {
    width: 5em;
  }

  .bp3-callout {
    font-size: 12px;
  }
`

const HalfWrapper = styled(Wrapper)`
  width: 50%;
`

@translate(['setting'])
@connect((state, props) => ({
  enabled: get(state.config, 'poi.notify.enabled', true),
  expedition: get(state.config, 'poi.notify.expedition.enabled', true),
  expeditionValue: get(state.config, 'poi.notify.expedition.value', 60),
  construction: get(state.config, 'poi.notify.construction.enabled', true),
  repair: get(state.config, 'poi.notify.repair.enabled', true),
  morale: get(state.config, 'poi.notify.morale.enabled', true),
  moraleValue: get(state.config, 'poi.notify.morale.value', 49),
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

  selectInput = id => {
    document.getElementById(id).select()
  }

  handleSetExpedition = value => {
    config.set('poi.notify.expedition.value', parseInt(value, 10))
  }

  handleSetMorale = value => {
    config.set('poi.notify.morale.value', parseInt(value, 10))
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

          <FormGroup>
            <Wrapper>
              {map(['construction', 'expedition', 'repair', 'morale', 'others'], type => (
                <Switch
                  key={type}
                  disabled={!this.props.enabled}
                  checked={this.props[type]}
                  onChange={this.handleSetNotify(type)}
                >
                  {t(capitalize(type))}
                </Switch>
              ))}
            </Wrapper>
            {this.props.enabled && (
              <Callout>{t('Heavily damaged notification is managed by Prophet plugin')}</Callout>
            )}
          </FormGroup>

          <Wrapper>
            <FormGroup inline label={t('setting:Notify when expedition returns in')}>
              <NumericInput
                clampValueOnBlur
                min={0}
                max={7200}
                value={this.props.expeditionValue}
                onValueChange={this.handleSetExpedition}
                disabled={!this.props.enabled || !this.props.expedition}
              />
              {' '}{t('main:s')}
            </FormGroup>
          </Wrapper>

          <Wrapper>
            <FormGroup inline label={t('setting:Notify when morale is greater than')}>
              <NumericInput
                clampValueOnBlur
                min={0}
                max={49}
                value={this.props.moraleValue}
                onValueChange={this.handleSetMorale}
                disabled={!this.props.enabled || !this.props.morale}
              />
            </FormGroup>
          </Wrapper>
        </Wrapper>
      </Section>
    )
  }
}
