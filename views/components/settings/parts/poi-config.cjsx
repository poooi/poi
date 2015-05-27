path = require 'path-extra'
glob = require 'glob'
{$, $$, _, React, ReactBootstrap, ROOT} = window
{Grid, Col, Button, ButtonGroup, Input} = ReactBootstrap
{config} = window
Divider = require './divider'
themes = glob.sync(path.join(ROOT, 'assets', 'themes', '*')).map (filePath) ->
  path.basename filePath
PoiConfig = React.createClass
  getInitialState: ->
    layout: config.get 'poi.layout', 'horizonal'
    theme: config.get 'poi.theme', '__default__'
  handleSetLayout: (layout) ->
    return if @state.layout == layout
    config.set 'poi.layout', layout
    event = new CustomEvent 'layout.change',
      bubbles: true
      cancelable: true
      detail:
        layout: layout
    window.dispatchEvent event
    @setState {layout}
  handleSetTheme: (theme) ->
    theme = @refs.theme.getValue()
    return if @state.theme == theme
    config.set 'poi.theme', theme
    event = new CustomEvent 'theme.change',
      bubbles: true
      cancelable: true
      detail:
        theme: theme
    window.dispatchEvent event
    @setState {theme}
  render: ->
    <form>
      <div className="form-group">
        <Divider text="布局" />
        <Grid>
          <Col xs={6}>
            <Button bsStyle={if @state.layout == 'horizonal' then 'success' else 'danger'} onClick={@handleSetLayout.bind @, 'horizonal'} style={width: '100%'}>
              {if @state.layout == 'horizonal' then '√ ' else ''}使用横版布局
            </Button>
          </Col>
          <Col xs={6}>
            <Button bsStyle={if @state.layout == 'vertical' then 'success' else 'danger'} onClick={@handleSetLayout.bind @, 'vertical'} style={width: '100%'}>
              {if @state.layout == 'vertical' then '√ ' else ''}使用纵版布局
            </Button>
          </Col>
        </Grid>
      </div>
      <div className="form-group">
        <Divider text="主题" />
        <Grid>
          <Col xs={12}>
            <Input type="select" ref="theme" value={@state.theme} onChange={@handleSetTheme}>
              {
                themes.map (theme) ->
                  <option value={theme}>{theme[0].toUpperCase() + theme.slice(1)}</option>

              }
              <option value="__default__">Default</option>
            </Input>
          </Col>
        </Grid>
      </div>
    </form>

module.exports = PoiConfig
