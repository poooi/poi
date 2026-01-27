import { Card, TextArea, Button, Intent } from '@blueprintjs/core'
import * as Sentry from '@sentry/electron'
import { clipboard } from 'electron'
import React, { Component } from 'react'
import { withNamespaces } from 'react-i18next'

@withNamespaces()
export class PluginWrap extends Component {
  state = {
    hasError: false,
    error: null,
    info: null,
    eventId: '',
  }

  static defaultProps = {
    withContainer: true,
  }

  root = React.createRef()

  shouldComponentUpdate = (nextProps, nextState) => {
    return this.props.plugin.timestamp !== nextProps.plugin.timestamp || nextState.hasError === true
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

  handleCopy = () => {
    const { error, info } = this.state
    const code = [error.stack, info.componentStack].join('\n')

    clipboard.writeText(code)
  }

  componentDidMount = () => {
    if (this.root.current) {
      this.root.current.querySelectorAll('link').forEach((link) => {
        if (link.href.includes('#') || link.href.includes('$')) {
          link.href = link.href.replace(/#/g, '%23').replace(/\$/g, '%24').replace(/&/g, '%26')
        }
      })
    }
  }

  render() {
    const { hasError, error, info } = this.state
    const { plugin, t, container: Container } = this.props
    if (hasError) {
      const code = [error.stack, info.componentStack].join('\n')
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
    const innerContent = <plugin.reactClass />
    return Container ? (
      <Container id={plugin.id} className="poi-app-tabpane" ref={this.root}>
        <Card>{innerContent}</Card>
      </Container>
    ) : (
      innerContent
    )
  }
}
