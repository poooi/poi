{$, $$, _, React, ReactBootstrap, ROOT, path} = window
{Panel, Table, Grid, Col} = ReactBootstrap
Divider = require './divider'

resultPanelTitle =
  <h3>舰娘信息</h3>

Slotitems = React.createClass
  render: ->
    <div className="slotitem-container">
    {
      {$slotitems, _slotitems} = window
      for itemId in @props.data
        continue if itemId == -1
        idx = _.sortedIndex _slotitems, {api_id: itemId}, 'api_id'
        item = _slotitems[idx]
        itemInfo = $slotitems[item.api_slotitem_id]
        <img key={itemId} src={
            path = require 'path'
            path.join(ROOT, 'assets', 'img', 'slotitem', "#{itemInfo.api_type[3] + 33}.png")
          }
          alt={itemInfo.api_name} title={itemInfo.api_name} />
    }
    </div>

ShipInfoTable = React.createClass
  render: ->
    <tr>
      <td>{@props.index}</td>
      <td>{@props.id}</td>
      <td>{@props.type}</td>
      <td>{@props.name}</td>
      <td>{@props.lv}</td>
      <td>{@props.cond}</td>
      <td>{@props.karyoku}</td>
      <td>{@props.raisou}</td>
      <td>{@props.taiku}</td>
      <td>{@props.soukou}</td>
      <td>{@props.lucky}</td>
      <td>{@props.sakuteki}</td>
      <td><Slotitems data={@props.slot} /></td>
    </tr>

ShipInfoTableArea = React.createClass
  getInitialState: ->
    rows: []
    show: false
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {$shipTypes, $ships, _ships} = window
    {rows} = @state
    if path is '/kcsapi/api_port/port' or path is '/kcsapi/api_req_kousyou/getship'
      rows = []
      for ship in _ships
        row =
          id: ship.api_id
          type: $shipTypes[$ships[ship.api_ship_id].api_stype].api_name
          name: $ships[ship.api_ship_id].api_name
          lv:  ship.api_lv
          cond: ship.api_cond
          karyoku: ship.api_karyoku[0]
          raisou: ship.api_raisou[0]
          taiku: ship.api_taiku[0]
          soukou: ship.api_soukou[0]
          lucky: ship.api_lucky[0]
          sakuteki: ship.api_sakuteki[0]
          slot: ship.api_slot
        rows.push row
    @setState
      rows: rows
      show: true
  componentDidMount: ->
    @setState
      rows: @state.rows
      show: true
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    @setState
      rows: @state.rows
      show: false
    window.removeEventListener 'game.response', @handleResponse
  render: ->
    <div id="ship-info-show">
      <Divider text="舰娘信息" />
      <Grid>
        <Col xs={12}>
          <Table striped condensed hover>
            <thead>
              <tr>
                <th>NO</th>
                <th>ID</th>
                <th>舰种</th>
                <th>舰名</th>
                <th>等级</th>
                <th>状态</th>
                <th>火力</th>
                <th>雷装</th>
                <th>对空</th>
                <th>装甲</th>
                <th>幸运</th>
                <th>索敌</th>
                <th>装备</th>
              </tr>
            </thead>
            <tbody>
            {
              if @state.show
                $shipTypes = window.$shipTypes

                shipTypes = []
                if $shipTypes?
                  for x in @props.shipTypeBoxes
                    shipTypes.push $shipTypes[x].api_name

                showRows = []
                for row in @state.rows
                  showRows.push row if row.type in shipTypes

                showRows = _.sortBy showRows, @props.sortName
                showRows.reverse() if @props.sortOrder

                for row, index in showRows
                  <ShipInfoTable
                    key = {index}
                    index = {index + 1}
                    id = {row.id}
                    type = {row.type}
                    name = {row.name}
                    lv = {row.lv}
                    cond = {row.cond}
                    karyoku = {row.karyoku}
                    raisou = {row.raisou}
                    taiku = {row.taiku}
                    soukou = {row.soukou}
                    lucky = {row.lucky}
                    sakuteki = {row.sakuteki}
                    slot = {row.slot}
                  />
            }
            </tbody>
          </Table>
        </Col>
      </Grid>
    </div>
module.exports = ShipInfoTableArea
