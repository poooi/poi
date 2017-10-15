import { Component, createElement } from 'react'
import PropTypes from 'prop-types'

export default class PluginSettingWrapper extends Component {
  static propTypes = {
    plugin: PropTypes.object,
  }
  shouldComponentUpdate = (nextProps, nextState) => (this.props.plugin.timestamp !== nextProps.plugin.timestamp)
  render() {
    return (createElement(this.props.plugin.settingsClass))
  }
}
