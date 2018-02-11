import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Grid, Col, FormControl } from 'react-bootstrap'
import i18next from 'views/env-parts/i18next'

const { config } = window

let language = window.language
if (!(['zh-CN', 'zh-TW', 'ja-JP', 'en-US', 'ko-KR'].includes(language))) {
  switch (language.substr(0, 1).toLowerCase()) {
  case 'zh':
    language = 'zh-TW'
    break
  case 'ja':
    language = 'ja-JP'
    break
  case 'ko':
    language = 'ko-KR'
    break
  default:
    language = 'en-US'
  }
}

const LanguageConfig = connect(() => {
  return (state, props) => ({
    value: get(state.config, 'poi.language', language),
  })
})(class LanguageConfig extends Component {
  static propTypes = {
    value: PropTypes.string,
  }
  handleSetLanguage = (e) => {
    const language = e.target.value
    config.set('poi.language', language)
    i18next.changeLanguage(language)
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <FormControl componentClass="select" value={this.props.value} onChange={this.handleSetLanguage}>
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">正體中文</option>
            <option value="ja-JP">日本語</option>
            <option value="en-US">English</option>
            <option value="ko-KR">한국어</option>
          </FormControl>
        </Col>
      </Grid>
    )
  }
})

export default LanguageConfig
