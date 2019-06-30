import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { withNamespaces } from 'react-i18next'
import { FormGroup } from '@blueprintjs/core'

import { SwitchConfig } from 'views/components/settings/components/switch'
import { Wrapper } from 'views/components/settings/components/section'

@withNamespaces(['setting'])
@connect((state, props) => ({
  enable: get(state.config, `poi.unusedEquipmentSlotCheck.enable`, false),
  ignoreUnlocked: get(state.config, `poi.unusedEquipmentSlotCheck.ignoreUnlocked`, false),
}))
export class UnusedSlotCheckConfig extends Component {
  static propTypes = {
    enable: PropTypes.bool,
    ignoreUnlocked: PropTypes.bool,
  }

  render() {
    const { t, enable, ignoreUnlocked } = this.props
    return (
      <FormGroup>
        <Wrapper>
          <SwitchConfig
            checked={enable}
            configName="poi.unusedEquipmentSlotCheck.enable"
            label={t('setting:Display Unused Equipment Slot Notification')}
          />
          <SwitchConfig
            checked={ignoreUnlocked}
            configName="poi.unusedEquipmentSlotCheck.ignoreUnlocked"
            disabled={!enable}
            label={t(`setting:Ignore Unlocked Ships`)}
          />
        </Wrapper>
      </FormGroup>
    )
  }
}
