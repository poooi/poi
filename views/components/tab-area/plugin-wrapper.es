import React, { Component } from 'react'
import { clipboard } from 'electron'
import { withNamespaces } from 'react-i18next'
import { Card, TextArea, Button, Intent } from '@blueprintjs/core'

@withNamespaces()
export class PluginWrap extends Component {
  state = {
    hasError: false,
    error: null,
    info: null,
  }

  static defaultProps = {
    withContainer: true,
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    return this.props.plugin.timestamp !== nextProps.plugin.timestamp || nextState.hasError === true
  }

  componentDidCatch = (error, info) => {
    this.setState({
      hasError: true,
      error,
      info,
    })
  }

  handleCopy = () => {
    const { error, info } = this.state
    const code = [error.stack, info.componentStack].join('\n')

    clipboard.writeText(code)
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
      <Container id={plugin.id} className="poi-app-tabpane">
        <Card>{innerContent}</Card>
      </Container>
    ) : (
      innerContent
    )
  }
}
