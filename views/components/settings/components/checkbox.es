import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Checkbox } from '@blueprintjs/core'

const { config } = window

@connect((state, props) => ({
  value: get(state.config, props.configName, props.defaultValue),
  configName: props.configName,
  undecided: props.undecided,
  label: props.label,
}))
export class CheckboxLabelConfig extends Component {
  static propTypes = {
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    configName: PropTypes.string,
    value: PropTypes.bool,
    undecided: PropTypes.bool,
    defaultValue: PropTypes.bool,
  }

  componentDidMount = () => {
    if (typeof this.props.defaultVal !== 'undefined') {
      console.error('prop `defaultVal` is deprecated, use `defaultValue` instaed')
    }
  }

  handleChange = () => {
    config.set(this.props.configName, !this.props.value)
  }

  render() {
    return (
      <div className={this.props.undecided ? 'undecided-checkbox-inside' : ''}>
        <Checkbox
          disabled={this.props.undecided}
          checked={this.props.undecided ? false : this.props.value}
          onChange={this.props.undecided ? undefined : this.handleChange}
        >
          {this.props.label}
        </Checkbox>
      </div>
    )
  }
}
