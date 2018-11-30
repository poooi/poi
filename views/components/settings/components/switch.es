/* global config */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Switch } from '@blueprintjs/core'
import { getStoreConfig } from 'views/utils/tools'

@connect((state, props) => ({
  value: getStoreConfig(state, props.configName, props.defaultValue),
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
    const { value, configName, label, defaultValue, dispatch, ...rest } = this.props
    return (
      <Switch {...rest} checked={value} onChange={this.handleChange}>
        {label}
      </Switch>
    )
  }
}
