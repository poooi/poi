import React, { Component } from 'react'
import { FormControl, Button } from 'react-bootstrap'
import { clipboard } from 'electron'

const {i18n } = window

const __ = window.i18n.others.__.bind(i18n.others)

class PluginWrap extends Component {
  state = {
    hasError: false,
    error: null,
    info: null,
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
    const {plugin} = this.props
    if (hasError) {
      const code = [error.stack, info.componentStack].join('\n')
      return (
        <div id={plugin.id} className="poi-app-tabpane poi-plugin" style={{padding : '1em'}}>
          <h1>{__('A 🐢 found in %s', plugin.name)}</h1>
          <p>{__('Something went wrong in the plugin, you may report this to plugin author or poi dev team, with the code below.')}</p>
          <FormControl
            componentClass="textarea"
            readOnly
            value={code}
            style={{ height: '10em' }}
          />
          <Button bsStyle="primary" onClick={this.handleCopy}>{__('Copy to clipboard')}</Button>
        </div>
      )
    }
    return (
      <div id={plugin.id} className="poi-app-tabpane poi-plugin">
        <plugin.reactClass />
      </div>
    )
  }
}

export default PluginWrap
