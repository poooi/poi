import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Switch } from '@blueprintjs/core'

const { config } = window

@connect((state, props) => ({
  value: get(state.config, props.configName, props.defaultValue),
  configName: props.configName,
  label: props.label,
}))
export class SwitchConfig extends Component {
  static propTypes = {
    label: PropTypes.node.isRequired,
    configName: PropTypes.string.isRequired,
    value: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    defaultValue: PropTypes.bool,
  }

  handleChange = () => {
    config.set(this.props.configName, !this.props.value)
  }

  render() {
    const { value, configName, label, defaultValue, ...rest } = this.props
    return (
      <Switch
        {...rest}
        checked={value}
        onChange={this.handleChange}
      >
        {label}
      </Switch>
    )
  }
}
