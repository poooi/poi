import { InputGroup } from '@blueprintjs/core'
import { get, debounce } from 'lodash'
import PropTypes from 'prop-types'
/* global config */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'

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

  static getDerivedStateFromProps = (nextProps, prevState) => {
    if (nextProps.value !== prevState.propValue) {
      return {
        value: nextProps.value,
        propValue: nextProps.value,
      }
    } else {
      return null
    }
  }

  state = {
    value: this.props.value,
    propValue: this.props.value,
  }

  handleChange = (e) => {
    this.setState({
      value: e.currentTarget.value,
    })
    this.applyConfig(e.currentTarget.value)
  }

  applyConfig = debounce((value) => {
    config.set(this.props.configName, value)
  }, 200)

  render() {
    const { configName, defaultValue, dispatch, ...rest } = this.props
    return <InputGroup {...rest} value={this.state.value} onChange={this.handleChange} />
  }
}
