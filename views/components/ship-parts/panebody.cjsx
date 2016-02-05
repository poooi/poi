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

PaneBody = React.createClass
  condDynamicUpdateFlag: false
  getInitialState: ->
    cond: [0, 0, 0, 0, 0, 0]
    label: [-1, -1, -1, -1, -1, -1]
  updateLabels: ->
    # refresh label
    label = [-1, -1, -1, -1, -1, -1]
    for l, i in @state.label
      label[i] = l
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
    label = [-1, -1, -1, -1, -1, -1]
    for l, i in @state.label
      label[i] = l
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
    @props.dataVersion != nextProps.dataVersion || @state.cond.toString() != nextState.cond.toString() || @state.label.toString() != nextState.label.toString()
  componentWillReceiveProps: (nextProps) ->
    if @condDynamicUpdateFlag
      @condDynamicUpdateFlag = not @condDynamicUpdateFlag
    else
      cond = [0, 0, 0, 0, 0, 0]
      for shipId, j in nextProps.deck.api_ship
        if shipId == -1
          cond[j] = 49
          continue
        ship = _ships[shipId]
        cond[j] = ship.api_cond
      @setState
        cond: cond
  componentWillMount: ->
    cond = [0, 0, 0, 0, 0, 0]
    label: [-1, -1, -1, -1, -1, -1]
    for shipId, j in @props.deck.api_ship
      if shipId == -1
        cond[j] = 49
        continue
      ship = _ships[shipId]
      cond[j] = ship.api_cond
    @setState
      cond: cond
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
          {$ships, $shipTypes, _ships} = window
          for shipId, j in @props.deck.api_ship
            continue if shipId == -1
            ship = _ships[shipId]
            shipInfo = $ships[ship.api_ship_id]
            shipType = $shipTypes[shipInfo.api_stype].api_name
            <div key={j} className="ship-item">
              <div className="ship-tile">
                <div className="ship-basic-item">
                  <div className="ship-info" style={getStatusStyle @state.label[j]}>
                    <div className="ship-basic">
                      <span className="ship-lv">
                        Lv. {ship.api_lv}
                      </span>
                      <span className='ship-type'>
                        {i18n.resources.__ shipType}
                      </span>
                    </div>
                    <span className="ship-name">
                      {i18n.resources.__ shipInfo.api_name}
                    </span>
                    <span className="ship-exp">
                      Next. {ship.api_exp[1]}
                    </span>
                  </div>
                  {
                    shipStat =
                      <div className="ship-stat">
                        <div className="div-row">
                          <span className="ship-hp" style={getStatusStyle @state.label[j]}>
                            {ship.api_nowhp} / {ship.api_maxhp}
                          </span>
                          <div className="status-label">
                            <StatusLabel label={@state.label[j]}/>
                          </div>
                          <div style={getStatusStyle @state.label[j]}>
                            <span className={"ship-cond " + window.getCondStyle(ship.api_cond)}>
                              ★{ship.api_cond}
                            </span>
                          </div>
                        </div>
                        <span className="hp-progress top-space" style={getStatusStyle @state.label[j]}>
                          <ProgressBar bsStyle={getHpStyle ship.api_nowhp / ship.api_maxhp * 100}
                                       now={ship.api_nowhp / ship.api_maxhp * 100} />
                        </span>
                      </div>
                    if ship.api_ndock_time
                      <OverlayTrigger show = {ship.api_ndock_time} placement='right' overlay={
                                      <Tooltip id="panebody-repair-time-#{@props.key}-#{j}">
                                        {__ 'Repair Time'}: {resolveTime ship.api_ndock_time / 1000}
                                      </Tooltip>}>
                        {shipStat}
                      </OverlayTrigger>
                    else
                      shipStat
                  }
                </div>
              </div>
              <span className="ship-fb" style={getStatusStyle @state.label[j]}>
                <span style={flex: 1}>
                  <OverlayTrigger placement='right' overlay={<Tooltip id="panebody-fuel-#{@props.key}-#{j}">{ship.api_fuel} / {shipInfo.api_fuel_max}</Tooltip>}>
                    <ProgressBar bsStyle={getMaterialStyle ship.api_fuel / shipInfo.api_fuel_max * 100}
                                 now={ship.api_fuel / shipInfo.api_fuel_max * 100} />
                  </OverlayTrigger>
                </span>
                <span style={flex: 1}>
                  <OverlayTrigger placement='right' overlay={<Tooltip id="panebody-bull-#{@props.key}-#{j}">{ship.api_bull} / {shipInfo.api_bull_max}</Tooltip>}>
                    <ProgressBar bsStyle={getMaterialStyle ship.api_bull / shipInfo.api_bull_max * 100}
                                 now={ship.api_bull / shipInfo.api_bull_max * 100} />
                  </OverlayTrigger>
                </span>
              </span>
              <div className="ship-slot" style={getStatusStyle @state.label[j]}>
                <Slotitems key={j} fleet={@props.key} slot={ship.api_slot} slot_ex={ship.api_slot_ex} slot_num={ship.api_slot_num} onslot={ship.api_onslot} maxeq={ship.api_maxeq} />
              </div>
            </div>
        }
      </div>
    </div>

module.exports = PaneBody
