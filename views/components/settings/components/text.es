/* global config */
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, debounce } from 'lodash'
import { InputGroup } from '@blueprintjs/core'

@connect((state, props) => ({
  value: get(state.config, props.configName, props.defaultValue || ''),
  configName: props.configName,
  label: props.label,
}))
export class TextConfig extends PureComponent {
  static propTypes = {
    configName: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    defaultValue: PropTypes.string,
  }

  handleChange = debounce(e => {
    config.set(this.props.configName, e.currentTarget.value)
  }, 200)

  render() {
    const { value, configName, defaultValue, dispatch, ...rest } = this.props
    return <InputGroup {...rest} value={value} onChange={this.handleChange} />
  }
}
