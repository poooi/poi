path = require 'path-extra'
{ROOT, layout, _, $, $$, React, ReactBootstrap, toggleModal} = window
{log, warn, error} = window
{Panel, Grid, Col} = ReactBootstrap
classNames = require 'classnames'
{connect} = require 'react-redux'
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)
order = [0, 2, 1, 3, 4, 6, 5, 7]
{MaterialIcon} = require '../../etc/icon-redux'

ResourcePanel = connect(
  (state) ->
    resources: state.info?.resources
    admiralLv: state.info?.basic?.api_level || 0
) React.createClass
  render: ->
    valid = !!@props.admiralLv
    limit = 750 + @props.admiralLv * 250
    <Panel bsStyle="default">
      <Grid>
      {
        for i in order
          className = classNames 'material-icon',
            'glow': valid && i < 4 && @props.resources[i] < limit
          amount = if valid then @props.resources[i] else '??'
          <Col key={i} xs={6} style={marginBottom: 2, marginTop: 2}>
            <MaterialIcon materialId={i+1} className={className} />
            <span className="material-value">{amount}</span>
          </Col>
      }
      </Grid>
    </Panel>

module.exports = ResourcePanel
