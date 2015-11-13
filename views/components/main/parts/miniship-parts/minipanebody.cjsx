{relative, join} = require 'path-extra'
path =  require 'path-extra'
{_, $, $$, React, ReactBootstrap, ROOT, FontAwesome, toggleModal} = window
{$ships, $shipTypes, _ships} = window
{Button, ButtonGroup} = ReactBootstrap
{ProgressBar, OverlayTrigger, Tooltip, Alert, Overlay, Label, Panel, Popover} = ReactBootstrap
{__, __n} = require 'i18n'
StatusLabel = require './statuslabel'
TopAlert = require './topalert'

getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

getMaterialStyle = (percent) ->
  if percent <= 50
    'danger'
  else if percent <= 75
    'info'
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

getShipStatus = (shipId) ->
  status = -1
  # retreat status
  # if shipId == escapeId || shipId == towId
    # return status = 0
  # repairing
  if shipId in _ndocks
    return status = 1
  # supply
  else if (Math.min _ships[shipId].api_fuel / _ships[shipId].api_fuel_max * 100, _ships[shipId].api_bull / _ships[shipId].api_bull_max * 100) < 100
    return status = 6
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

getFontStyle = (theme)  ->
  if window.isDarkTheme then color: '#FFF' else color: '#000'

Slotitems = React.createClass
  render: ->
    <div className="slotitems-mini" style={display:"flex", flexFlow:"column"}>
    {
      {$slotitems, _slotitems} = window
      for itemId, i in @props.data
        continue if itemId == -1
        item = _slotitems[itemId]
        <div key={i} className="slotitem-container-mini">
          <img key={itemId} className='slotitem-img' src={join('assets', 'img', 'slotitem', "#{item.api_type[3] + 100}.png")}} />
          <span className="slotitem-name-mini">
            {item.api_name}
              {if item.api_level > 0 then <strong style={color: '#45A9A5'}>★+{item.api_level}</strong> else ''}
              &nbsp;&nbsp;{
                if item.api_alv? and 1 <= item.api_alv <= 7
                  <img className='alv-img' src={join('assets', 'img', 'airplane', "alv#{item.api_alv}.png")} />
                else ''
              }
          </span>
          <Label className="slotitem-onslot-mini
                          #{if (item.api_type[3] >= 6 && item.api_type[3] <= 10) || (item.api_type[3] >= 21 && item.api_type[3] <= 22) || item.api_type[3] == 33 then 'show' else 'hide'}"
                          bsStyle="#{if @props.onslot[i] < @props.maxeq[i] then 'warning' else 'default'}">
            {@props.onslot[i]}
          </Label>
        </div>
    }
    </div>

PaneBodyMini = React.createClass
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
      status = getShipStatus shipId
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
      when '/kcsapi/api_port/port', '/kcsapi/api_req_hensei/change', '/kcsapi/api_req_hokyu/charge', '/kcsapi/api_req_map/next', '/kcsapi/api_get_member/ship3', '/kcsapi/api_req_nyukyo/speedchange', '/kcsapi/api_req_hensei/preset_select'
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
    nextProps.activeDeck is @props.deckIndex and nextProps.show
  componentWillReceiveProps: (nextProps) ->
    {_ships} = window
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
    {$ships, $shipTypes, _ships} = window
    cond = [0, 0, 0, 0, 0, 0]
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
      <div className="fleet-name">
        <TopAlert
          updateCond={@onCondChange}
          messages={@props.messages}
          deckIndex={@props.deckIndex}
          deckName={@props.deckName}
          mini={true}
        />
      </div>
      <div className="ship-details-mini">
      {
        {$ships, $shipTypes, _ships} = window
        for shipId, j in @props.deck.api_ship
          continue if shipId == -1
          ship = _ships[shipId]
          shipInfo = $ships[ship.api_ship_id]
          shipType = $shipTypes[shipInfo.api_stype].api_name
          <div key={j} className="ship-tile">
            <OverlayTrigger placement={if (!window.doubleTabbed) && (window.layout == 'vertical') then 'left' else 'right'} overlay={
              <Tooltip id="ship-pop-#{@props.key}-#{j}" className="ship-pop">
                <div className="item-name">
                  <Slotitems data={ship.api_slot.concat(ship.api_slot_ex || -1)} onslot={ship.api_onslot} maxeq={ship.api_maxeq} />
                </div>
              </Tooltip>
            }>
              <div className="ship-item">
                <OverlayTrigger placement='top' overlay={
                  <Tooltip id="miniship-exp-#{@props.key}-#{j}">
                    Next. {ship.api_exp[1]}
                  </Tooltip>
                }>
                  <div className="ship-info">
                    <span className="ship-name" style={getStatusStyle @state.label[j]}>
                      {shipInfo.api_name}
                    </span>
                    <span className="ship-lv-text top-space" style={getStatusStyle @state.label[j]}>
                      Lv. {ship.api_lv}
                    </span>
                  </div>
                </OverlayTrigger>
                <div className="ship-stat">
                  <div className="div-row">
                    <span className="ship-hp" style={getStatusStyle @state.label[j]}>
                      {ship.api_nowhp} / {ship.api_maxhp}
                    </span>
                    <div className="status-label">
                      <StatusLabel label={@state.label[j]} />
                    </div>
                    <div style={getStatusStyle @state.label[j]}>
                      <span className={"ship-cond " + window.getCondStyle(ship.api_cond)}>
                        ★{ship.api_cond}
                      </span>
                    </div>
                  </div>
                  <span className="hp-progress top-space" style={getStatusStyle @state.label[j]}>
                    <ProgressBar bsStyle={getHpStyle ship.api_nowhp / ship.api_maxhp * 100} now={ship.api_nowhp / ship.api_maxhp * 100} />
                  </span>
                </div>
              </div>
            </OverlayTrigger>
          </div>
      }
      </div>
    </div>

module.exports = PaneBodyMini
