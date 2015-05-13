{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{config, proxy} = window
{Panel, Grid, Col} = ReactBootstrap

rankName = ['', '元帥', '大将', '中将', '少将', '大佐', '中佐', '新米中佐', '少佐', '中堅少佐', '新米少佐']

TeitokuPanel = React.createClass
  getInitialState: ->
    level: 0
    nickname: null
    rank: 0
    material: []
    shipCount: '??'
    maxChara: '??'
    slotitemCount: '??'
    maxSlotitem: '??'
  handleResponse: (method, path, body) ->
    switch path
      when '/kcsapi/api_get_member/basic'
        @setState
          level: body.api_level
          nickname: body.api_nickname
          rank: body.api_rank
          maxChara: body.api_max_chara
          maxSlotitem: body.api_max_slotitem
      when '/kcsapi/api_port/port'
        materials = []
        materials[material.api_id] = material for material in body.api_material
        @setState
          shipCount: body.api_ship.length
          material: materials
      when '/kcsapi/api_get_member/slot_item'
        @setState
          slotitemCount: body.length
      when '/kcsapi/api_get_member/material'
        materials = []
        materials[material.api_id] = material for material in body
        @setState
          material: materials
  componentDidMount: ->
    proxy.addListener 'game.response', @handleResponse
  componentWillUnmount: ->
    proxy.removeListener 'game.response', @handleResponse
  render: ->
    header = '提督 [尚未登录]'
    bsStyle = 'danger'
    if @state.nickname
      header = "Lv. #{@state.level} #{@state.nickname} [#{rankName[@state.rank]}]"
      bsStyle = 'success'
    <Panel header={header} bsStyle={bsStyle} className="teitoku-panel">
      <Grid>
        <Col xs={6}>舰娘：{@state.shipCount} / {@state.maxChara}</Col>
        <Col xs={6}>装备：{@state.slotitemCount} / {@state.maxSlotitem}</Col>
      </Grid>
      {
        if layout == 'horizonal'
          <div>
            <Grid>
              {
                for i in [1, 3, 5, 7]
                  src = "#{ROOT}/assets/img/material/#{i}.png"
                  value = '??'
                  if @state?.material[i]?.api_value?
                    value = @state.material[i].api_value
                  <Col xs={3}>
                    <img src={src} className="material-icon" />
                    <span className="material-value">{value}</span>
                  </Col>
              }
            </Grid>
            <Grid>
              {
                for i in [2, 4, 6, 8]
                  src = "#{ROOT}/assets/img/material/#{i}.png"
                  value = '??'
                  if @state?.material[i]?.api_value?
                    value = @state.material[i].api_value
                  <Col xs={3}>
                    <img src={src} className="material-icon" />
                    <span className="material-value">{value}</span>
                  </Col>
              }
            </Grid>
          </div>
        else
          <Grid>
            {
              for i in [1..8]
                src = "#{ROOT}/assets/img/material/#{i}.png"
                value = '??'
                if @state?.material[i]?.api_value?
                  value = @state.material[i].api_value
                style =
                  width: '12.5%'
                <Col xs={3} style={style}>
                  <img src={src} className="material-icon" />
                  <span className="material-value">{value}</span>
                </Col>
            }
          </Grid>
      }
    </Panel>

module.exports = TeitokuPanel
