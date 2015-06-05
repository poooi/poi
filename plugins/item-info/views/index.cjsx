{React, ReactBootstrap, jQuery} = window
{Panel, Row, Grid, Col, Table} = ReactBootstrap
Divider = require './divider'

ItemInfoTable = React.createClass
  render: ->
    {$ships, $slotitems} = window
    <tr className="vertical">
      <td style={{paddingLeft: 10+'px'}}>
        {
          itemInfo = $slotitems[@props.slotItemType]
          <img key={@props.slotItemType} src={
              path = require 'path'
              path.join(ROOT, 'assets', 'img', 'slotitem', "#{itemInfo.api_type[3] + 33}.png")
            }
            alt={itemInfo.api_name} title={itemInfo.api_name} />
        }
        {$slotitems[@props.slotItemType].api_name}
      </td>
      <td className="center">{@props.sumNum}</td>
      <td className="center">{@props.restNum}</td>
      <td>
        <Table style={{backgroundColor: 'transparent';verticalAlign: 'middle';marginBottom:0+'px';}}>
          <tbody>
          {
            trNum = parseInt(@props.equipList.length/5)
            for tmp in [0..trNum]
              <tr key={tmp}>
              {
                for indexCol in [0..4]
                  index = tmp*5+indexCol
                  if @props.equipList[index]?
                    equipShip = @props.equipList[index]
                    <td className="slot-item-table-td" key={index}>
                      {$ships[equipShip.shipNameId].api_name + " × " + equipShip.equipNum}
                    </td>
                  else
                    <td className="slot-item-table-td" key={index}>{" "}</td>
              }
              </tr>
          }
          </tbody>
        </Table>
      </td>
    </tr>


ItemInfoArea = React.createClass
  getInitialState: ->
    rows:[]
  findSlotType: (slotId, st, ed)->
    {_slotitems} = window
    mid = Math.floor((st+ed)/2)
    mid_id = _slotitems[mid].api_id
    if slotId == mid_id
      return _slotitems[mid].api_slotitem_id
    else if slotId < mid_id
      return @findSlotType slotId, st, mid
    else if slotId > mid_id
      return @findSlotType slotId, mid+1, ed
    -1
  handleResponse:  (e) ->
    {method, path, body, postBody} = e.detail
    {$ships, _ships, _slotitems, $slotitems, _} = window
    {rows} = @state
    switch path
      when '/kcsapi/api_get_member/slot_item' || '/kcsapi/api_req_kousyou/destroyitem2' || '/kcsapi/api_req_kousyou/destroyship' || '/kcsapi/api_req_kousyou/remodel_slot'
        rows = []
        for slot in _slotitems
          slotType = slot.api_slotitem_id
          if rows[slotType]?
            rows[slotType].sumNum++
          else
            row =
              slotItemType: slotType
              sumNum: 1
              inUseNum: 0
              equipList: []
            rows[slotType] = row

      when '/kcsapi/api_req_kousyou/getship'
        for slot in body.api_slotitem
          slotType = slot.api_slotitem_id
          if rows[slotType]?
            rows[slotType].sumNum++
          else
            row =
              slotItemType: slotType
              sumNum: 1
              inUseNum: 0
              equipList: []
            rows[slotType] = row

      when '/kcsapi/api_req_kousyou/createitem'
        if body.api_create_flag == 1
          slot = body.api_slot_item
          slotType = slot.api_slotitem_id
          if rows[slotType]?
            rows[slotType].sumNum++
          else
            row =
              slotItemType: slotType
              sumNum: 1
              inUseNum: 0
              equipList: []
            rows[slotType] = row

      when '/kcsapi/api_port/port' || '/kcsapi/api_req_kaisou/slotset'
        if rows.length > 0
          for row in rows
            if row?
              row.equipList = []
              row.inUseNum = 0
          for ship in _ships
            for slotId in ship.api_slot
              continue if slotId == -1
              slotType = @findSlotType slotId, 0, _slotitems.length-1
              if slotType == -1
                console.log "Error:Cannot find the slotType by searching slotId from ship.api_slot"
                continue
              shipNameIdTmp = ship.api_ship_id
              if rows[slotType]?
                row = rows[slotType]
                row.inUseNum++
                findShip = false
                for equip in row.equipList
                  if equip.shipNameId == shipNameIdTmp
                    equip.equipNum++
                    findShip = true
                    break
                equipAdd = null
                if !findShip
                  equipAdd =
                    shipNameId: shipNameIdTmp
                    equipNum: 1
                  row.equipList.push equipAdd
              else
                console.log "Error: Not defined row"


    @setState
      rows: rows
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  render: ->
    <Grid id="item-info-area">
      <Divider text="装备信息" />
      <Table striped condensed hover id="main-table">
        <thead className="slot-item-table-thead">
          <tr>
            <th className="center">装备名称</th>
            <th className="center">总数量</th>
            <th className="center">剩余数</th>
            <th className="center">装备情况</th>
          </tr>
        </thead>
        <tbody>
        {
          {_} = window
          if @state.rows?
            printRows = []
            for row in @state.rows
              if row?
                printRows.push row
            printRows = _.sortBy printRows, 'sumNum'
            printRows.reverse()
            for row, index in printRows
              row.equipList = _.sortBy row.equipList, 'equipNum'
              row.equipList.reverse()
              <ItemInfoTable
                key = {index}
                index = {index}
                slotItemType = {row.slotItemType}
                sumNum = {row.sumNum}
                restNum = {row.sumNum - row.inUseNum}
                equipList = {row.equipList}
              />
        }
        </tbody>
      </Table>
    </Grid>

React.render <ItemInfoArea />, $('item-info')
