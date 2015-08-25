path = require 'path-extra'
{ROOT, layout, _, $, $$, React, ReactBootstrap, toggleModal} = window
{log, warn, error} = window
{Panel, Grid, Col} = ReactBootstrap
{__, __n} = require 'i18n'
order = [1, 3, 2, 4, 5, 7, 6, 8]

ResourcePanel = React.createClass

  getInitialState: ->
    material: ['??', '??', '??', '??', '??', '??', '??', '??', '??']
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
        {material} = @state
        for e in body.api_material
          material[e.api_id] = e.api_value
        @setState
          material: material
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
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  render: ->
    <Panel bsStyle="default">
      <Grid>
      {
        for i in order
          <Col key={i} xs={6} style={marginBottom: 3}>
            <img src={"file://#{ROOT}/assets/img/material/0#{i}.png"} className="material-icon" />
            <span className="material-value">{@state.material[i]}</span>
          </Col>
      }
      </Grid>
    </Panel>

module.exports = ResourcePanel
