import { TextArea, Button, Intent } from '@blueprintjs/core'
import * as Sentry from '@sentry/electron'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { withNamespaces } from 'react-i18next'

@withNamespaces(['setting'])
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
    Sentry.withScope((scope) => {
      scope.setExtra('componentStack', info.componentStack)
      scope.setTag('area', this.props.plugin.id)
      const eventId = Sentry.captureException(error)
      this.setState({
        hasError: true,
        error,
        info,
        eventId,
      })
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
