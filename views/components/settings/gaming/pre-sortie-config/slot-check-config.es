/* global config */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withNamespaces } from 'react-i18next'
import { FormGroup, Switch } from '@blueprintjs/core'

import { Wrapper } from 'views/components/settings/components/section'
import { IntegerConfig } from 'views/components/settings/components/integer'
import { getStoreConfig } from 'views/utils/tools'

@withNamespaces(['setting'])
@connect((state, props) => ({
  type: props.type,
  enable: getStoreConfig(state, `poi.mapStartCheck.${props.type}.enable`, false),
  minFreeSlots: getStoreConfig(state, `poi.mapStartCheck.${props.type}.minFreeSlots`, 0),
}))
export class SlotCheckConfig extends Component {
  static propTypes = {
    minFreeSlots: PropTypes.number.isRequired,
    type: PropTypes.string,
    enable: PropTypes.bool,
  }

  handleChange = () => {
    config.set(`poi.mapStartCheck.${this.props.type}.enable`, !this.props.enable)
  }

  render() {
    const { t, enable, type } = this.props
    return (
      <Wrapper>
        <FormGroup inline>
          <Switch checked={enable} onChange={this.handleChange}>
            {t(`setting:${this.props.type} slots`)}
          </Switch>
        </FormGroup>
        <FormGroup inline label={t('Threshold')}>
          <IntegerConfig
            clampValueOnBlur
            min={0}
            max={1000}
            configName={`poi.mapStartCheck.${type}.minFreeSlots`}
            defaultValue={0}
            disabled={!enable}
          />
        </FormGroup>
      </Wrapper>
    )
  }
}
