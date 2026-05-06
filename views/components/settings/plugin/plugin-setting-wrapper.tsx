import type { TFunction } from 'i18next'
import type { Plugin } from 'views/services/plugin-manager'

import { TextArea, Button, Intent } from '@blueprintjs/core'
import * as Sentry from '@sentry/electron/renderer'
import { clipboard } from 'electron'
import React, { Component } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  plugin: Plugin
}

interface InnerProps extends Props {
  t: TFunction
}

interface State {
  hasError: boolean
  error: Error | null
  info: React.ErrorInfo | null
  eventId: string
}

class PluginSettingWrapperInner extends Component<InnerProps, State> {
  state: State = {
    hasError: false,
    error: null,
    info: null,
    eventId: '',
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    Sentry.withScope((scope) => {
      scope.setExtra('componentStack', info.componentStack)
      scope.setTag('area', this.props.plugin.id)
      const eventId = Sentry.captureException(error)
      this.setState({ hasError: true, error, info, eventId })
    })
  }

  shouldComponentUpdate(nextProps: InnerProps, nextState: State): boolean {
    return this.props.plugin.timestamp !== nextProps.plugin.timestamp || nextState.hasError
  }

  handleCopy = (): void => {
    const { error, info } = this.state
    if (!error || !info) return
    clipboard.writeText([error.stack, info.componentStack].join('\n'))
  }

  render(): React.ReactNode {
    const { hasError, error, info } = this.state
    const { plugin, t } = this.props
    if (hasError) {
      const code = [error?.stack ?? '', info?.componentStack ?? ''].join('\n')
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
    if (!plugin.settingsClass) return null
    const SettingsClass = plugin.settingsClass
    return <SettingsClass />
  }
}

export const PluginSettingWrapper = (props: Props): React.ReactElement => {
  const { t } = useTranslation('setting')
  return <PluginSettingWrapperInner {...props} t={t} />
}
