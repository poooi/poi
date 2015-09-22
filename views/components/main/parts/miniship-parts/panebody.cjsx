{relative, join} = require 'path-extra'
{$, $$, _, React, ReactBootstrap, resolveTime, notify} = window
{Table, ProgressBar, OverlayTrigger, Tooltip, Grid, Col, Alert, Row, Overlay, Label} = ReactBootstrap
{__, __n} = require 'i18n'
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

getCondStyle = (cond) ->
  if window.isDarkTheme
    if cond > 49
      color: '#FFFF00'
    else if cond < 20
      color: '#DD514C'
    else if cond < 30
      color: '#F37B1D'
    else if cond < 40
      color: '#FFC880'
    else
      null
  else
    if cond > 49
      textShadow: '0 0 3px #FFFF00'
    else if cond < 20
      textShadow: '0 0 3px #DD514C'
    else if cond < 30
      textShadow: '0 0 3px #F37B1D'
    else if cond < 40
      textShadow: '0 0 3px #FFC880'
    else
      null

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
  # reparing
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
  # special 3 locked phase 3
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
    {label} = @state
    for shipId, j in @props.deck.api_ship
      continue if shipId == -1
      ship = _ships[shipId]
      status = getShipStatus shipId, @props.escapeId, @props.towId
      label[j] = status
    label
  onCondChange: (cond) ->
    condDynamicUpdateFlag = true
    @setState
      cond: cond
  handleResponse: (e) ->
    {method, path, body, postBody} = e.detail
    {label} = @state
    updateflag = false
    switch path
      when '/kcsapi/api_port/port'
        updateflag = true
        label = @updateLabels()
      when '/kcsapi/api_req_hensei/change'
        updateflag = true
        label = @updateLabels()
      when '/kcsapi/api_req_nyukyo/start'
        shipId = parseInt postBody.api_ship_id
        if shipId in @props.deck.api_ship
          i = @props.deck.api_ship.indexOf shipId
          # status = getShipStatus shipId
          label[i] = 1
          updateflag = true
    if updateflag
      @setState
        label: label
  shouldComponentUpdate: (nextProps, nextState) ->
    nextProps.activeDeck is @props.deckIndex
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
            [
              <div className="ship-item">
                <div className="ship-tile">
                  <div className="ship-basic-item">
                    <div className="ship-info" style={getStatusStyle @state.label[j]}>
                      <div className="ship-basic">
                        <span className="ship-lv">
                          Lv. {ship.api_lv}
                        </span>
                        <span className='ship-type'>
                          {shipType}
                        </span>
                        <span className="ship-lv">
                          Next. {ship.api_exp[1]}
                        </span>
                      </div>
                      <span className="ship-name">
                        {shipInfo.api_name}
                      </span>
                      <div className="exp-progress">
                        <ProgressBar bsStyle="info" now={ship.api_exp[2]} />
                      </div>
                    </div>
                    <div className="ship-stat">
                      <div className="div-row">
                        <span className="ship-hp" style={getStatusStyle @state.label[j]}>
                          {ship.api_nowhp} / {ship.api_maxhp}
                        </span>
                        <div className="status-label">
                          <StatusLabel label={@state.label[j]}/>
                        </div>
                        <div style={getStatusStyle @state.label[j]}>
                          <span className="ship-cond" style={getCondStyle ship.api_cond}>
                            ★{ship.api_cond}
                          </span>
                        </div>
                      </div>
                      <span className="hp-progress top-space" style={getStatusStyle @state.label[j]}>
                        {if ship.api_ndock_time
                          [
                            <OverlayTrigger show = {ship.api_ndock_time} placement='bottom' overlay={<Tooltip>{__ '入渠时间'}: {resolveTime ship.api_ndock_time / 1000}</Tooltip>}>
                              <ProgressBar bsStyle={getHpStyle ship.api_nowhp / ship.api_maxhp * 100}
                                           now={ship.api_nowhp / ship.api_maxhp * 100} />
                            </OverlayTrigger>
                          ]
                        else
                          [
                            <ProgressBar bsStyle={getHpStyle ship.api_nowhp / ship.api_maxhp * 100}
                                         now={ship.api_nowhp / ship.api_maxhp * 100} />
                          ]
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <span className="ship-fb" style={getStatusStyle @state.label[j]}>
                  <span style={flex: 1}>
                    <OverlayTrigger placement='right' overlay={<Tooltip>{ship.api_fuel} / {shipInfo.api_fuel_max}</Tooltip>}>
                      <ProgressBar bsStyle={getMaterialStyle ship.api_fuel / shipInfo.api_fuel_max * 100}
                                   now={ship.api_fuel / shipInfo.api_fuel_max * 100} />
                    </OverlayTrigger>
                  </span>
                  <span style={flex: 1}>
                    <OverlayTrigger placement='right' overlay={<Tooltip>{ship.api_bull} / {shipInfo.api_bull_max}</Tooltip>}>
                      <ProgressBar bsStyle={getMaterialStyle ship.api_bull / shipInfo.api_bull_max * 100}
                                   now={ship.api_bull / shipInfo.api_bull_max * 100} />
                    </OverlayTrigger>
                  </span>
                </span>
                <div className="ship-slot" style={getStatusStyle @state.label[j]}>
                  <Slotitems data={ship.api_slot.concat(ship.api_slot_ex || -1)} onslot={ship.api_onslot} maxeq={ship.api_maxeq} />
                </div>
              </div>
            ]
        }
      </div>
    </div>

module.exports = PaneBody
