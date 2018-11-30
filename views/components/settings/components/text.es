/* global config */
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { debounce } from 'lodash'
import { InputGroup } from '@blueprintjs/core'
import { getStoreConfig } from 'views/utils/tools'

@connect((state, props) => ({
  value: getStoreConfig(state, props.configName, props.defaultValue || ''),
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
