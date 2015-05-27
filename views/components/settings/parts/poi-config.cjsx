path = require 'path-extra'
{$, $$, _, React, ReactBootstrap, ROOT} = window
{Grid, Col, Button, ButtonGroup} = ReactBootstrap
{config} = window
Divider = require './divider'
PoiConfig = React.createClass
  getInitialState: ->
    layout: config.get 'poi.layout', 'horizonal'
  setLayout: (layout) ->
    return if @state.layout == layout
    config.set 'poi.layout', layout
    event = new CustomEvent 'layout.change',
      bubbles: true
      cancelable: true
      detail:
        layout: layout
    window.dispatchEvent event
    @setState {layout}
  render: ->
    <form>
      <div className="form-group">
        <Divider text="布局" />
        <Grid>
          <Col xs={6}>
            <Button bsStyle={if @state.layout == 'horizonal' then 'success' else 'danger'} onClick={@setLayout.bind @, 'horizonal'} style={width: '100%'}>
              {if @state.layout == 'horizonal' then '√ ' else ''}使用横版布局
            </Button>
          </Col>
          <Col xs={6}>
            <Button bsStyle={if @state.layout == 'vertical' then 'success' else 'danger'} onClick={@setLayout.bind @, 'vertical'} style={width: '100%'}>
              {if @state.layout == 'vertical' then '√ ' else ''}使用纵版布局
            </Button>
          </Col>
        </Grid>
      </div>
    </form>

module.exports = PoiConfig
