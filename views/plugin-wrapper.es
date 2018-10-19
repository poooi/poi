import React, { Component } from 'react'
import { FormControl, Button } from 'react-bootstrap'
import { clipboard } from 'electron'
import { translate } from 'react-i18next'
import { Card } from '@blueprintjs/core'

@translate()
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
    return this.props.plugin.timestamp !== nextProps.plugin.timestamp ||
      nextState.hasError === true
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
          <FormControl
            componentClass="textarea"
            readOnly
            value={code}
            style={{ height: '10em' }}
          />
          <Button bsStyle="primary" onClick={this.handleCopy}>{t('Copy to clipboard')}</Button>
        </>
      )
      return Container ? (
        <Container id={plugin.id} className="poi-app-tabpane">
          <Card>
            {innerContent}
          </Card>
        </Container>
      ) : innerContent
    }
    const innerContent = <plugin.reactClass />
    return Container ? (
      <Container id={plugin.id} className="poi-app-tabpane">
        <Card>
          {innerContent}
        </Card>
      </Container>
    ) : innerContent
  }
}
