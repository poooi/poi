import type { TFunction } from 'i18next'
import type { Plugin } from 'views/services/plugin-manager'

import { Card, TextArea, Button, Intent } from '@blueprintjs/core'
import * as Sentry from '@sentry/electron'
import { clipboard } from 'electron'
import React, { Component } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  plugin: Plugin
  container?: React.ElementType<{ id?: string; className?: string; children?: React.ReactNode }>
}

interface BoundaryProps extends Props {
  t: TFunction
}

interface State {
  hasError: boolean
  error: Error | null
  info: React.ErrorInfo | null
  eventId: string
}

class ErrorBoundary extends Component<BoundaryProps, State> {
  state: State = {
    hasError: false,
    error: null,
    info: null,
    eventId: '',
  }

  root = React.createRef<HTMLElement>()

  shouldComponentUpdate(nextProps: BoundaryProps, nextState: State): boolean {
    return this.props.plugin.timestamp !== nextProps.plugin.timestamp || nextState.hasError
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    Sentry.withScope((scope) => {
      scope.setExtra('componentStack', info.componentStack)
      scope.setTag('area', this.props.plugin.id)
      const eventId = Sentry.captureException(error)
      this.setState({ hasError: true, error, info, eventId })
    })
  }

  handleCopy = (): void => {
    const { error, info } = this.state
    if (!error || !info) return
    clipboard.writeText([error.stack, info.componentStack].join('\n'))
  }

  componentDidMount(): void {
    if (this.root.current) {
      this.root.current.querySelectorAll<HTMLLinkElement>('link').forEach((link) => {
        if (link.href.includes('#') || link.href.includes('$')) {
          link.href = link.href.replace(/#/g, '%23').replace(/\$/g, '%24').replace(/&/g, '%26')
        }
      })
    }
  }

  render(): React.ReactNode {
    const { hasError, error, info } = this.state
    const { plugin, t, container: Container } = this.props

    if (hasError) {
      const code = [error?.stack ?? '', info?.componentStack ?? ''].join('\n')
      const innerContent = (
        <>
          <h1>{t('PluginErrTitle', { name: plugin.name })}</h1>
          <p>{t('PluginErrorMsg')}</p>
          <TextArea readOnly value={code} style={{ height: '10em' }} />
          <Button intent={Intent.PRIMARY} onClick={this.handleCopy}>
            {t('Copy to clipboard')}
          </Button>
        </>
      )
      return Container ? (
        <Container id={plugin.id} className="poi-app-tabpane">
          <Card>{innerContent}</Card>
        </Container>
      ) : (
        innerContent
      )
    }

    if (!plugin.reactClass) return null
    const PluginClass = plugin.reactClass
    const innerContent = <PluginClass />
    return Container ? (
      // @ts-expect-error styled-component forwardRef accepts ref but ElementType type doesn't reflect it
      <Container id={plugin.id} className="poi-app-tabpane" ref={this.root}>
        <Card>{innerContent}</Card>
      </Container>
    ) : (
      innerContent
    )
  }
}

export const PluginWrap = ({ plugin, container }: Props): React.ReactElement => {
  const { t } = useTranslation()
  return <ErrorBoundary plugin={plugin} container={container} t={t} />
}
