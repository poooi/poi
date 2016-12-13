import React from 'react'

require('react-safe-render')(React, {
  errorHandler: function (errReport) {
    console.error(errReport)
  },
})

const PluginWrap = React.createClass({
  shouldComponentUpdate: function (nextProps, nextState) {
    return this.props.plugin.timestamp !== nextProps.plugin.timestamp
  },
  render: function () {
    const {plugin} = this.props
    return (
      <div id={plugin.id} className="poi-app-tabpane poi-plugin">
        {React.createElement(plugin.reactClass)}
      </div>
    )
  },
})

export default PluginWrap
