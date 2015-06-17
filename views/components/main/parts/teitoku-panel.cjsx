{ROOT, layout, _, $, $$, React, ReactBootstrap} = window
{log, warn, error} = window
{Panel, Grid, Col} = ReactBootstrap

order = if layout == 'horizonal' then [1, 3, 5, 7, 2, 4, 6, 8] else [1..8]

rankName = ['', '元帥', '大将', '中将', '少将', '大佐', '中佐', '新米中佐', '少佐', '中堅少佐', '新米少佐']

getHeader = (state) ->
  if state.nickname?
    return "Lv. #{state.level} #{state.nickname} [#{rankName[state.rank]}]"
  else
    return '提督 [尚未登录]'

getMaterialImage = (idx) ->
  return "file://#{ROOT}/assets/img/material/0#{idx}.png"

TeitokuPanel = React.createClass
  getInitialState: ->
    level: 0
    nickname: null
    rank: 0
    material: ['??', '??', '??', '??', '??', '??', '??', '??', '??']
    shipCount: '??'
    maxChara: '??'
    slotitemCount: '??'
    maxSlotitem: '??'
  handleResponse: (e) ->
    {method, path, body} = e.detail
    switch path
      when '/kcsapi/api_get_member/basic'
        @setState
          level: body.api_level
          nickname: body.api_nickname
          rank: body.api_rank
          maxChara: body.api_max_chara
          maxSlotitem: body.api_max_slotitem
      when '/kcsapi/api_req_sortie/battleresult'
        @setState
          level: window._teitokuLv
      when '/kcsapi/api_port/port'
        {material} = @state
        for e in body.api_material
          material[e.api_id] = e.api_value
        @setState
          shipCount: Object.keys(window._ships).length
          material: material
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_get_member/slot_item'
        @setState
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_kousyou/getship'
        @setState
          shipCount: Object.keys(window._ships).length
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_kousyou/createitem'
        @setState
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_kousyou/destroyitem2'
        {material} = @state
        for i in [0..3]
          material[i + 1] += body.api_get_material[i]
        @setState
          material: material
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_kousyou/destroyship'
        {material} = @state
        for i in [0..3]
          material[i + 1] = body.api_material[i]
        @setState
          material: material
          shipCount: Object.keys(window._ships).length
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_get_member/material'
        {material} = @state
        for e in body
          material[e.api_id] = e.api_value
        @setState
          shipCount: Object.keys(window._ships).length
          material: material
      when '/kcsapi/api_req_hokyu/charge'
        {material} = @state
        for i in [0..3]
          material[i + 1] = body.api_material[i]
        @setState
          material: material
      when '/kcsapi/api_req_kousyou/remodel_slot'
        @setState
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_kaisou/powerup'
        @setState
          shipCount: Object.keys(window._ships).length
          slotitemCount: Object.keys(window._slotitems).length
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  render: ->
    <Panel header={getHeader @state} bsStyle="default" className="teitoku-panel">
      <Grid>
        <Col xs={6}>舰娘：{@state.shipCount} / {@state.maxChara}</Col>
        <Col xs={6}>装备：{@state.slotitemCount} / {@state.maxSlotitem}</Col>
      </Grid>
      <Grid style={marginTop: 5}>
      {
        for i in order
          <Col key={i} xs={3}>
            <img src={getMaterialImage i} className="material-icon" />
            <span className="material-value">{@state.material[i]}</span>
          </Col>
      }
      </Grid>
    </Panel>

module.exports = TeitokuPanel
