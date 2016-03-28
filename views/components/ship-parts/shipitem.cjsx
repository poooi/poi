{relative, join} = require 'path-extra'
{$, $$, _, React, ReactBootstrap, resolveTime, notify} = window
{Table, ProgressBar, OverlayTrigger, Tooltip, Grid, Col, Alert, Row, Overlay, Label} = ReactBootstrap
__ = i18n.main.__.bind(i18n.main)
__n = i18n.main.__n.bind(i18n.main)
Slotitems = require './slotitems'
StatusLabel = require './statuslabel'

{getHpStyle, getStatusStyle, getShipStatus, BaseShipData} = require './utils'

getMaterialStyle = (percent) ->
  if percent <= 50
    'danger'
  else if percent <= 75
    'warning'
  else if percent < 100
    'info'
  else
    'success'

class ShipData extends BaseShipData
  constructor: (shipId) ->
    super shipId
    ship = window._ships[shipId]
    shipInfo = window.$ships[ship.api_ship_id]
    @ndockTime = ship.api_ndock_time
    @nowFeul = ship.api_fuel
    @maxFeul = ship.api_fuel_max
    @fuelStatus = ship.api_fuel / shipInfo.api_fuel_max * 100
    @nowBull = ship.api_bull
    @maxBull = shipInfo.api_bull_max
    @bullStatus = ship.api_bull / shipInfo.api_bull_max * 100

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
                  <div className="status-cond" style={getStatusStyle @props.label}>
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

module.exports =
  shipItem: ShipRow
  shipData: ShipData
  miniFlag: false
