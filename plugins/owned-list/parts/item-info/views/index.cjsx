{React, ReactBootstrap, jQuery} = window
{Panel, Grid, Col, Table} = ReactBootstrap

ItemInfoTable = React.createClass
  render: ->
    {$ships, $slotitems} = window
    <tr>
      <Grid>
        <td>{$slotitems[@props.slotItemType].api_name}</td>
        <td>{@props.sumNum}</td>
        <td>{@props.restNum}</td>
        <td>
          {
            for equipShip, index in @props.equipList
              <Col xs={3} sm={3} md={3} lg={3} key=index>
                {$ships[equipShip.shipNameId].api_name + "*" + equipShip.equipNum + " "}
              </Col>
          }
        </td>
      </Grid>
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
    {$ships, _ships, _slotitems, $slotitems} = window
    {rows} = @state
    if path is '/kcsapi/api_get_member/slot_item'
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
    if path is '/kcsapi/api_port/port'
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
    <div>
      <Table striped bordered condensed hover>
        <thead>
          <tr>
            <th>装备名称</th>
            <th>总数量</th>
            <th>剩余数量</th>
            <th>装备情况</th>
          </tr>
        </thead>
        <tbody>
        {
          if @state.rows?
            for row, index in @state.rows
              if row?
                <ItemInfoTable
                  key = {index}
                  slotItemType = {row.slotItemType}
                  sumNum = {row.sumNum}
                  restNum = {row.sumNum - row.inUseNum}
                  equipList = {row.equipList}
                />
        }
        </tbody>
      </Table>
    </div>


React.render <ItemInfoArea />, $('item-info')
