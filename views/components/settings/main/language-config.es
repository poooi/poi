/* global config */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, each, map } from 'lodash'
import i18next from 'views/env-parts/i18next'
import { HTMLSelect } from '@blueprintjs/core'
import { withNamespaces } from 'react-i18next'

import { Section } from '../components/section'

const setWindowI18nLng = (language) => {
  each(i18next.options.ns, (ns) => {
    window.i18n[ns].fixedT = i18next.getFixedT(language, ns)
  })
}

@withNamespaces(['setting'])
@connect((state, props) => ({
  value: get(state.config, 'poi.misc.language', window.language),
}))
export class LanguageConfig extends Component {
  static propTypes = {
    value: PropTypes.string,
  }

  handleSetLanguage = (e) => {
    const language = e.currentTarget.value
    config.set('poi.misc.language', language)
    i18next.changeLanguage(language)
    setWindowI18nLng(language)
  }

  render() {
    const { t } = this.props
    return (
      <Section title={t('setting:Language')}>
        <HTMLSelect value={this.props.value} onChange={this.handleSetLanguage}>
          {map(window.LOCALES, (lng) => (
            <option value={lng.locale} key={lng.locale}>
              {lng.lng}
            </option>
          ))}
        </HTMLSelect>
      </Section>
    )
  }
}
