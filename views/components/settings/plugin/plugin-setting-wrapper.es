import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { TextArea, Button, Intent } from '@blueprintjs/core'

@translate(['setting'])
export class PluginSettingWrapper extends Component {
  static propTypes = {
    plugin: PropTypes.object,
  }

  state = {
    hasError: false,
    error: null,
    info: null,
  }

  componentDidCatch = (error, info) => {
    this.setState({
      hasError: true,
      error,
      info,
    })
  }

  shouldComponentUpdate = (nextProps, nextState) =>
    this.props.plugin.timestamp !== nextProps.plugin.timestamp || nextState.hasError === true

  render() {
    const { hasError, error, info } = this.state
    const { plugin, t } = this.props
    if (hasError) {
      const code = [error.stack, info.componentStack].join('\n')
      return (
        <div>
          <h1>{t('PluginErrTitle', { name: plugin.name })}</h1>
          <p>{t('PluginErrorMsg')}</p>
          <TextArea fill readOnly value={code} style={{ height: '10em' }} />
          <Button intent={Intent.PRIMARY} onClick={this.handleCopy}>
            {t('Copy to clipboard')}
          </Button>
        </div>
      )
    }
    return <plugin.settingsClass />
  }
}
