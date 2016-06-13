path = require 'path-extra'
{ROOT, layout, _, $, $$, React, ReactBootstrap, toggleModal} = window
{log, warn, error} = window
{Panel, Grid, Col} = ReactBootstrap
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)
order = [1, 3, 2, 4, 5, 7, 6, 8]
{MaterialIcon} = require '../../etc/icon'

ResourcePanel = React.createClass

  getInitialState: ->
    material: ['??', '??', '??', '??', '??', '??', '??', '??', '??']
    limit: 30750   # material limit of level 120
    show: true
  shouldComponentUpdate: (nextProps, nextState) ->
    nextState.show
  handleVisibleResponse: (e) ->
    {visible} = e.detail
    @setState
      show: visible
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    switch path
      when '/kcsapi/api_port/port'
        {limit} = @state
        level = parseInt(body.api_basic.api_level)
        if level > 0
          limit = 750 + level * 250
        @setState
          limit: limit
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    window.addEventListener 'view.main.visible', @handleVisibleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
    window.removeEventListener 'view.main.visible', @handleVisibleResponse
  render: ->
    <Panel bsStyle="default">
      <Grid>
      {
        for i in order
          <Col key={i} xs={6} style={marginBottom: 2, marginTop: 2}>
            <MaterialIcon materialId={i} className="material-icon #{if i <= 4 and @state.material[i] < @state.limit then 'glow' else ''}" />
            <span className="material-value">{@state.material[i]}</span>
          </Col>
      }
      </Grid>
    </Panel>

module.exports = ResourcePanel
