import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Checkbox } from '@blueprintjs/core'

const { config } = window

@connect((state, props) => ({
  value: get(state.config, props.configName, props.defaultVal),
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
