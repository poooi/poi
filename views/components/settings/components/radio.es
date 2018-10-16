import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, map } from 'lodash'
import { Radio, RadioGroup } from '@blueprintjs/core'

const { config } = window

@connect((state, props) => ({
  value: get(state.config, props.configName, props.defaultValue),
  configName: props.configName,
  label: props.label,
  availableVal: props.availableVal,
}))
export class RadioConfig extends Component {
  static propTypes = {
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    configName: PropTypes.string,
    value: PropTypes.string,
    availableVal: PropTypes.array,
  }

  componentDidMount = () => {
    if (typeof this.props.defaultVal === 'undefined') {
      console.error('prop `defaultVal` is deprecated, use `defaultValue` instaed')
    }
  }

  handleChange = e => {
    config.set(this.props.configName, e.currentTarget.value)
  }

  render() {
    return (
      <RadioGroup inline selectedValue={this.props.value} onChange={this.handleChange}>
        {map(this.props.availableVal, item => (
          <Radio key={item.value} value={item.value}>
            {item.name}
          </Radio>
        ))}
      </RadioGroup>
    )
  }
}
