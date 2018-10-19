import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, debounce } from 'lodash'
import { NumericInput } from '@blueprintjs/core'

const { config } = window

@connect((state, props) => ({
  value: get(state.config, props.configName, props.defaultValue || 0),
  configName: props.configName,
  label: props.label,
}))
export class IntegerConfig extends PureComponent {
  static propTypes = {
    configName: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    disabled: PropTypes.bool,
    defaultValue: PropTypes.number,
  }

  handleChange = debounce(value => {
    config.set(this.props.configName, Math.round(value))
  }, 200)

  render() {
    const { value, configName, defaultValue, dispatch, ...rest } = this.props
    return <NumericInput {...rest} value={value} onValueChange={this.handleChange} />
  }
}
