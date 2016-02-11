{relative, join} = require 'path-extra'
{$, $$, _, React, ReactBootstrap, resolveTime, notify} = window
{Table, ProgressBar, OverlayTrigger, Tooltip, Grid, Col, Alert, Row, Overlay, Label} = ReactBootstrap
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)
Slotitems = require './slotitems'
StatusLabel = require './statuslabel'
TopAlert = require './topalert'

getMaterialStyle = (percent) ->
  if percent <= 50
    'danger'
  else if percent <= 75
    'warning'
  else if percent < 100
    'info'
  else
    'success'

getStatusStyle = (status) ->
  if status?
    flag = status == 0 or status == 1 # retreat or repairing
    if flag? and flag
      return {opacity: 0.4}
  else
    return {}

getShipStatus = (shipId, escapeId, towId) ->
  status = -1
  # retreat status
  if shipId == escapeId || shipId == towId
    return status = 0
  # repairing
  if shipId in _ndocks
    return status = 1
  # special 1 locked phase 1
  else if _ships[shipId].api_sally_area == 1
    return status = 2
  # special 2 locked phase 2
  else if _ships[shipId].api_sally_area == 2
    return status = 3
  # special 3 locked phase 3
  else if  _ships[shipId].api_sally_area == 3
    return status = 4
  # special 4 locked phase 4
  else if _ships[shipId].api_sally_area == 4
    return status = 5
  return status

getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

class ShipData
  constructor: (shipId) ->
    {$ships, $shipTypes, _ships, _slotitems} = window
    ship = _ships[shipId]
    shipInfo = $ships[ship.api_ship_id]
    @id = shipId
    @type = $shipTypes[shipInfo.api_stype].api_name
    @name = shipInfo.api_name
    @lv = ship.api_lv
    @nextEXP = ship.api_exp[1]
    @nowHp = ship.api_nowhp
    @maxHp = ship.api_maxhp
    @cond = ship.api_cond
    @ndockTime = ship.api_ndock_time
    @nowFeul = ship.api_fuel
    @maxFeul = ship.api_fuel_max
    @fuelStatus = ship.api_fuel / shipInfo.api_fuel_max * 100
    @nowBull = ship.api_bull
    @maxBull = shipInfo.api_bull_max
    @bullStatus = ship.api_bull / shipInfo.api_bull_max * 100
    @slotItems = []
    for itemId, i in ship.api_slot.concat(ship.api_slot_ex || 0)
      continue unless (i < ship.api_slot_num) or (i == 5 and itemId != 0)
      item = _slotitems[itemId] || {api_name: "", api_type: [0, 0, 0, 0]}
      @slotItems[i] =
        id: itemId
        onslot: ship.api_onslot[i]
        maxeq: ship.api_maxeq[i]
        isExist: _slotitems[itemId]?
        name: item.api_name
        level: item.api_level
        alv: item.api_alv
        slotitemId: item.api_type[3]

ShipRow = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    not _.isEqual nextProps, @props
  render: ->
    <div className="ship-item">
      <div className="ship-tile">
        <div className="ship-basic-item">
          <div className="ship-info" style={getStatusStyle @props.label}>
            <div className="ship-basic">
              <span className="ship-lv">
                Lv. {@props.shipData.lv}
              </span>
              <span className='ship-type'>
                {i18n.resources.__ @props.shipData.type}
              </span>
            </div>
            <span className="ship-name">
              {i18n.resources.__ @props.shipData.name}
            </span>
            <span className="ship-exp">
              Next. {@props.shipData.nextEXP}
            </span>
          </div>
          {
            shipStat =
              <div className="ship-stat">
                <div className="div-row">
                  <span className="ship-hp" style={getStatusStyle @props.label}>
                    {@props.shipData.nowHp} / {@props.shipData.maxHp}
                  </span>
                  <div className="status-label">
                    <StatusLabel label={@props.label}/>
                  </div>
                  <div style={getStatusStyle @props.label}>
                    <span className={"ship-cond " + window.getCondStyle(@props.shipData.cond)}>
                      ★{@props.shipData.cond}
                    </span>
                  </div>
                </div>
                <span className="hp-progress top-space" style={getStatusStyle @props.label}>
                  <ProgressBar bsStyle={getHpStyle @props.shipData.nowHp / @props.shipData.maxHp * 100}
                               now={@props.shipData.nowHp / @props.shipData.maxHp * 100} />
                </span>
              </div>
            if @props.shipData.ndockTime
              <OverlayTrigger show = {@props.shipData.ndockTime} placement='right' overlay={
                              <Tooltip id="panebody-repair-time-#{@props.key}-#{@props.shipIndex}">
                                {__ 'Repair Time'}: {resolveTime @props.shipData.ndockTime / 1000}
                              </Tooltip>}>
                {shipStat}
              </OverlayTrigger>
            else
              shipStat
          }
        </div>
      </div>
      <span className="ship-fb" style={getStatusStyle @props.label}>
        <span style={flex: 1}>
          <OverlayTrigger placement='right' overlay={<Tooltip id="panebody-fuel-#{@props.key}-#{@props.shipIndex}">{@props.shipData.nowFeul} / {@props.shipData.maxFeul}</Tooltip>}>
            <ProgressBar bsStyle={getMaterialStyle @props.shipData.fuelStatus}
                         now={@props.shipData.fuelStatus} />
          </OverlayTrigger>
        </span>
        <span style={flex: 1}>
          <OverlayTrigger placement='right' overlay={<Tooltip id="panebody-bull-#{@props.key}-#{@props.shipIndex}">{@props.shipData.nowBull} / {@props.shipData.maxBull}</Tooltip>}>
            <ProgressBar bsStyle={getMaterialStyle @props.shipData.bullStatus}
                         now={@props.shipData.bullStatus} />
          </OverlayTrigger>
        </span>
      </span>
      <div className="ship-slot" style={getStatusStyle @props.label}>
        <Slotitems key={@props.shipIndex} fleet={@props.deckIndex} slots={@props.shipData.slotItems}/>
      </div>
    </div>

PaneBody = React.createClass
  condDynamicUpdateFlag: false
  getInitialState: ->
    cond: [0, 0, 0, 0, 0, 0]
    label: [-1, -1, -1, -1, -1, -1]
    ships: []
  updateLabels: ->
    # refresh label
    label = Object.clone @state.label
    for shipId, j in @props.deck.api_ship
      continue if shipId == -1
      ship = _ships[shipId]
      status = getShipStatus shipId
      label[j] = status
    label
  onCondChange: (cond) ->
    condDynamicUpdateFlag = true
    @setState
      cond: cond
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    label = Object.clone @state.label
    updateflag = false
    switch path
      when '/kcsapi/api_port/port', '/kcsapi/api_req_hensei/change', '/kcsapi/api_req_nyukyo/speedchange', '/kcsapi/api_req_hensei/preset_select'
        updateflag = true
        label = @updateLabels()
      when '/kcsapi/api_req_nyukyo/start'
        if (postBody.api_highspeed == 1)
          updateflag = true
      when '/kcsapi/api_get_member/ndock'
        for shipId in _ndocks
          i = @props.deck.api_ship.indexOf shipId
          if i isnt -1
            label[i] = 1
            updateflag = true
    if updateflag
      @setState
        label: label
  shouldComponentUpdate: (nextProps, nextState) ->
    @props.dataVersion != nextProps.dataVersion || !_.isEqual(@state, nextState)
  setShipData: (props, flag) ->
    if flag and @condDynamicUpdateFlag
      @condDynamicUpdateFlag = not @condDynamicUpdateFlag
    else
      cond = [0, 0, 0, 0, 0, 0]
      for shipId, j in props.deck.api_ship
        if shipId == -1
          cond[j] = 49
          continue
        ship = _ships[shipId]
        cond[j] = ship.api_cond
    ships = []
    for shipId, i in props.deck.api_ship
      continue if shipId is -1
      ships.push new ShipData(shipId)
    @setState
      cond: cond
      ships: ships
  componentWillReceiveProps: (nextProps) ->
    @setShipData nextProps, true
  componentWillMount: ->
    @setShipData @props, false
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
    label = @updateLabels()
    @setState
      label: label
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  render: ->
    <div>
      <TopAlert
        updateCond={@onCondChange}
        messages={@props.messages}
        deckIndex={@props.deckIndex}
        deckName={@props.deckName}
        mini={false}
      />
      <div className="ship-details">
        {
          {$shipTypes, _ships} = window
          for shipData, j in @state.ships
            <ShipRow
              key={shipData.id}
              label={@state.label[j]}
              shipData={shipData}
              deckIndex={@props.deckIndex}
              shipIndex={j}
            />
        }
      </div>
    </div>

module.exports = PaneBody
