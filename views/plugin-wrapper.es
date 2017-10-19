import React, { Component } from 'react'
import { FormControl } from 'react-bootstrap'

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

  render() {
    const { hasError, error, info } = this.state
    const {plugin} = this.props
    if (hasError) {
      const code = btoa(JSON.stringify({
        stack: error.stack,
        info,
      }))
      return (
        <div id={plugin.id} className="poi-app-tabpane poi-plugin" style={{padding : '1em'}}>
          <h1>🐢 found in {plugin.name}</h1>
          <p>A team of highly trained monkeys has been dispatched to deal with this situation, copy the code below if you see them.</p>
          <FormControl
            componentClass="textarea"
            readOnly
            value={code}
            style={{ height: '10em' }}
          />
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
