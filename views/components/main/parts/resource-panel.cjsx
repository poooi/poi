path = require 'path-extra'
{ROOT, layout, _, $, $$, React, ReactBootstrap, toggleModal} = window
{log, warn, error} = window
{Panel, Grid, Col} = ReactBootstrap
{__, __n} = require 'i18n'
order = [1, 3, 2, 4, 5, 7, 6, 8]
{MaterialIcon} = require '../../common/icon'

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
    {method, path, body} = e.detail
    switch path
      when '/kcsapi/api_get_member/material'
        {material} = @state
        for e in body
          material[e.api_id] = e.api_value
        @setState
          material: material
      when '/kcsapi/api_port/port'
        {material, limit} = @state
        for e in body.api_material
          material[e.api_id] = e.api_value
        level = parseInt(body.api_basic.api_level)
        if level > 0
          limit = 750 + level * 250
        @setState
          material: material
          limit: limit
      when '/kcsapi/api_req_hokyu/charge'
        {material} = @state
        for i in [0..3]
          material[i + 1] = body.api_material[i]
        @setState
          material: material
      when '/kcsapi/api_req_kousyou/createitem'
        {material} = @state
        for i in [0..7]
          material[i + 1] = body.api_material[i]
        @setState
          material: material
      when '/kcsapi/api_req_kousyou/createship_speedchange'
        {material} = @state
        if body.api_result == 1
          material[4] -= 1
        @setState
          material: material
      when '/kcsapi/api_req_kousyou/destroyitem2'
        {material} = @state
        for i in [0..3]
          material[i + 1] += body.api_get_material[i]
        @setState
          material: material
      when '/kcsapi/api_req_kousyou/destroyship'
        {material} = @state
        for i in [0..3]
          material[i + 1] = body.api_material[i]
        @setState
          material: material
      when '/kcsapi/api_req_kousyou/remodel_slot'
        {material} = @state
        for i in [0..7]
          material[i + 1] = body.api_after_material[i]
        @setState
          material: material
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_nyukyo/speedchange'
        {material} = @state
        if body.api_result == 1
          material[5] -= 1
        @setState
          material: material
      when '/kcsapi/api_req_nyukyo/start'
        {material} = @state
        if body.api_highspeed == 1
          material[5] -= 1
        @setState
          material: material
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
          <Col key={i} xs={6} style={marginBottom: 3}>
            <MaterialIcon materialId={i} className="material-icon #{if i <= 4 and @state.material[i] < @state.limit then 'grow' else ''}" />
            <span className="material-value">{@state.material[i]}</span>
          </Col>
      }
      </Grid>
    </Panel>

module.exports = ResourcePanel
