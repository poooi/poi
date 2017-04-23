import React, { Component } from 'react'

class PluginWrap extends Component {
  shouldComponentUpdate = (nextProps, nextState) => {
    return this.props.plugin.timestamp !== nextProps.plugin.timestamp
  }

  render() {
    const {plugin} = this.props
    return (
      <div id={plugin.id} className="poi-app-tabpane poi-plugin">
        {React.createElement(plugin.reactClass)}
      </div>
    )
  }
}

export default PluginWrap
