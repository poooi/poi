import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { translate } from 'react-i18next'
import { FormGroup, NumericInput, Switch } from '@blueprintjs/core'

import { Wrapper } from 'views/components/settings/components/section'

const { config } = window

@translate(['setting'])
@connect((state, props) => ({
  type: props.type,
  enable: get(state.config, `poi.mapStartCheck.${props.type}.enable`, false),
  minFreeSlots: get(state.config, `poi.mapStartCheck.${props.type}.minFreeSlots`, 0),
}))
export class SlotCheckConfig extends Component {
  static propTypes = {
    minFreeSlots: PropTypes.number.isRequired,
    type: PropTypes.string,
    enable: PropTypes.bool,
  }

  handleSetThreshold = value => {
    config.set(`poi.mapStartCheck.${this.props.type}.minFreeSlots`, value)
  }

  handleChange = () => {
    config.set(`poi.mapStartCheck.${this.props.type}.enable`, !this.props.enable)
  }

  render() {
    const { t, enable, minFreeSlots } = this.props
    return (
      <Wrapper>
        <FormGroup inline>
          <Switch checked={enable} onChange={this.handleChange}>
            {t(`setting:${this.props.type} slots`)}
          </Switch>
        </FormGroup>
        <FormGroup inline label={t('Threshold')}>
          <NumericInput
            clampValueOnBlur
            min={0}
            max={1000}
            value={minFreeSlots}
            onValueChange={this.handleSetThreshold}
            disabled={!enable}
          />
        </FormGroup>
      </Wrapper>
    )
  }
}
