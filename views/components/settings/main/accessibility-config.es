/* global config */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, map } from 'lodash'
import { HTMLSelect } from '@blueprintjs/core'
import { withNamespaces } from 'react-i18next'

import { Section } from '../components/section'

const list = [
  'none',
  'protanopia',
  'protanomaly',
  'deuteranopia',
  'deuteranomaly',
  'tritanopia',
  'tritanomaly',
  'achromatopsia',
  'achromatomaly',
]

@withNamespaces(['setting'])
@connect((state, props) => ({
  value: get(state.config, 'poi.appearance.colorblindFilter', 'null'),
}))
export class AccessibilityConfig extends Component {
  static propTypes = {
    value: PropTypes.string,
  }

  handleSetFilter = (e) => {
    config.set('poi.appearance.colorblindFilter', e.currentTarget.value)
  }

  render() {
    const { t } = this.props
    return (
      <Section title={t('setting:Accessibility')}>
        {t('setting:Color blind mode')}
        <HTMLSelect value={this.props.value} onChange={this.handleSetFilter}>
          {map(list, (mode) => (
            <option value={mode} key={mode}>
              {t(`setting:${mode}`)}
            </option>
          ))}
        </HTMLSelect>
      </Section>
    )
  }
}
