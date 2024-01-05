/* global config */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Switch } from '@blueprintjs/core'
import { styled } from 'styled-components'

const SwitchWithMargin = styled(Switch)`
  margin-right: 8px;
`

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
    const { value, configName, label, defaultValue, dispatch, ...rest } = this.props
    return (
      <SwitchWithMargin {...rest} checked={value} onChange={this.handleChange}>
        {label}
      </SwitchWithMargin>
    )
  }
}
