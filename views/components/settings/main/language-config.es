import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, each } from 'lodash'
import { Grid, Col, FormControl } from 'react-bootstrap'
import i18next from 'views/env-parts/i18next'

const { config } = window
const setWindowI18nLng = language => {
  each(i18next.options.ns, (ns) => {
    window.i18n[ns].fixedT = i18next.getFixedT(language, ns)
  })
}

@connect((state, props) => ({
  value: get(state.config, 'poi.misc.language', window.language),
}))
export class LanguageConfig extends Component {
  static propTypes = {
    value: PropTypes.string,
  }
  handleSetLanguage = (e) => {
    const language = e.target.value
    config.set('poi.misc.language', language)
    i18next.changeLanguage(language)
    setWindowI18nLng(language)
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <FormControl componentClass="select" value={this.props.value} onChange={this.handleSetLanguage}>
            {
              window.LOCALES.map(lng => (
                <option value={lng.locale} key={lng.locale}>
                  {lng.lng}
                </option>)
              )
            }
          </FormControl>
        </Col>
      </Grid>
    )
  }
}
