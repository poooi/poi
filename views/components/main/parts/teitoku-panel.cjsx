{ROOT, layout, _, $, $$, React, ReactBootstrap, toggleModal} = window
{log, warn, error} = window
{Panel, Grid, Col} = ReactBootstrap

order = if layout == 'horizonal' or window.doubleTabbed then [1, 3, 5, 7, 2, 4, 6, 8] else [1..8]

rankName = ['', '元帥', '大将', '中将', '少将', '大佐', '中佐', '新米中佐', '少佐', '中堅少佐', '新米少佐']

totalExp = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600,
  4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100,
  19000, 21000, 23100, 25300, 27600, 30000, 32500, 35100, 37800, 40600,
  43500, 46500, 49600, 52800, 56100, 59500, 63000, 66600, 70300, 74100,
  78000, 82000, 86100, 90300, 94600, 99000, 103500, 108100, 112800, 117600,
  122500, 127500, 132700, 138100, 143700, 149500, 155500, 161700, 168100, 174700,
  181500, 188500, 195800, 203400, 211300, 219500, 228000, 236800, 245900, 255300,
  265000, 275000, 285400, 296200, 307400, 319000, 331000, 343400, 356200, 369400,
  383000, 397000, 411500, 426500, 442000, 458000, 474500, 491500, 509000, 527000,
  545500, 564500, 584500, 606500, 631500, 661500, 701500, 761500, 851500, 1000000,
  1300000, 1600000, 1900000, 2200000, 2600000, 3000000, 3500000, 4000000, 4600000, 5200000,
  5900000, 6600000, 7400000, 8200000, 9100000, 10000000, 11000000, 12000000, 13000000, 14000000, 15000000]

getHeader = (state) ->
  if state.nickname?
    if state.level == 120
      return "Lv. #{state.level} #{state.nickname} [#{rankName[state.rank]}]　　　　Exp. #{state.exp}"
    else
      return "Lv. #{state.level} #{state.nickname} [#{rankName[state.rank]}]　　　　Next. #{state.nextExp}"
  else
    return '提督 [尚未登录]'

getMaterialImage = (idx) ->
  return "file://#{ROOT}/assets/img/material/0#{idx}.png"

TeitokuPanel = React.createClass
  getInitialState: ->
    level: 0
    nickname: null
    rank: 0
    nextExp: '?'
    exp: '?'
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
          exp: body.api_experience
          nextExp: totalExp[body.api_level] - body.api_experience
          maxChara: body.api_max_chara
          maxSlotitem: body.api_max_slotitem
      when '/kcsapi/api_get_member/material'
        {material} = @state
        for e in body
          material[e.api_id] = e.api_value
        @setState
          shipCount: Object.keys(window._ships).length
          material: material
      when '/kcsapi/api_get_member/slot_item'
        @setState
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_port/port'
        {material} = @state
        for e in body.api_material
          material[e.api_id] = e.api_value
        @setState
          shipCount: Object.keys(window._ships).length
          material: material
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_hokyu/charge'
        {material} = @state
        for i in [0..3]
          material[i + 1] = body.api_material[i]
        @setState
          material: material
      when '/kcsapi/api_req_kaisou/powerup'
        @setState
          shipCount: Object.keys(window._ships).length
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_kousyou/createitem'
        {material} = @state
        for i in [0..7]
          material[i + 1] = body.api_material[i]
        @setState
          material: material
          slotitemCount: Object.keys(window._slotitems).length
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
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_kousyou/destroyship'
        {material} = @state
        for i in [0..3]
          material[i + 1] = body.api_material[i]
        @setState
          material: material
          shipCount: Object.keys(window._ships).length
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_kousyou/getship'
        @setState
          shipCount: Object.keys(window._ships).length
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_kousyou/remodel_slot'
        {material} = @state
        for i in [0..7]
          material[i + 1] = body.api_after_material[i]
        @setState
          material: material
          slotitemCount: Object.keys(window._slotitems).length
      when '/kcsapi/api_req_mission/result'
        @setState
          level: body.api_member_lv
          exp: body.api_member_exp
          nextExp: totalExp[body.api_member_lv] - body.api_member_exp
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
      when '/kcsapi/api_req_practice/battle_result'
        @setState
          level: body.api_member_lv
          exp: body.api_member_exp
          nextExp: totalExp[body.api_member_lv] - body.api_member_exp
      when '/kcsapi/api_req_sortie/battleresult'
        @setState
          shipCount: if body.api_get_ship? then @state.shipCount + 1 else @state.shipCount
          level: body.api_member_lv
          exp: body.api_member_exp
          nextExp: totalExp[body.api_member_lv] - body.api_member_exp
      when '/kcsapi/api_get_member/mapinfo'
        if config.get 'poi.mapstartcheck.ship'
          freeShipSlot = config.get 'poi.mapstartcheck.freeShipSlot', 4
          if @state.maxChara - @state.shipCount < freeShipSlot
            # toggleModal '船位检查', "船位剩余#{@state.maxChara - @state.shipCount}，出击注意！"
            setTimeout =>
              error "船位剩余#{@state.maxChara - @state.shipCount}，出击注意！"
            , 1000
        if config.get 'poi.mapstartcheck.item'
          if @state.maxSlotitem - @state.slotitemCount <= 0
            # toggleModal '装备检查', "装备已满，出击注意！"
            setTimeout =>
              error "装备已满，出击注意！"
            , 1000
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
