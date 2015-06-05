{React, ReactBootstrap, jQuery} = window
{Panel, Row, Grid, Col} = ReactBootstrap

ItemInfoTable = React.createClass
  render: ->
    {$ships, $slotitems} = window
    <Row>
      <Col xs={2} sm={2} md={2} lg={2}>{$slotitems[@props.slotItemType].api_name}</Col>
      <Col xs={2} sm={2} md={1} lg={1}>{@props.sumNum}</Col>
      <Col xs={2} sm={2} md={1} lg={1}>{@props.restNum}</Col>
      <Col xs={6} sm={6} md={8} lg={8}>
        <Row>
        {
          for equipShip, index in @props.equipList
            <Col xs={6} sm={3} md={2} lg={2} key=index>
              {$ships[equipShip.shipNameId].api_name + "*" + equipShip.equipNum + " "}
            </Col>
        }
        </Row>
      </Col>
    </Row>

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
    <Grid>
      <Row>
        <Col xs={2} sm={2} md={2} lg={2}>装备名称</Col>
        <Col xs={2} sm={2} md={1} lg={1}>总数量</Col>
        <Col xs={2} sm={2} md={1} lg={1}>剩余数</Col>
        <Col xs={6} sm={2} md={8} lg={8}>装备情况</Col>
      </Row>
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
              slotItemType = {row.slotItemType}
              sumNum = {row.sumNum}
              restNum = {row.sumNum - row.inUseNum}
              equipList = {row.equipList}
            />
      }
    </Grid>

React.render <ItemInfoArea />, $('item-info')
