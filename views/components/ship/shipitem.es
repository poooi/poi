import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import shallowEqual from 'fbjs/lib/shallowEqual'
import { createSelector } from 'reselect'
import { ProgressBar, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { isEqual, pick, omit, memoize } from 'lodash'
import FontAwesome from 'react-fontawesome'

const { i18n } = window
const __ = i18n.main.__.bind(i18n.main)

import { Slotitems } from './slotitems'
import StatusLabel from 'views/components/ship-parts/statuslabel'
import AACIIndicator from './aaci-indicator'
import OASWndicator from './oasw-indicator'
import { getCondStyle, getHpStyle, getStatusStyle, getShipLabelStatus, getSpeedLabel } from 'views/utils/game-utils'
import { resolveTime } from 'views/utils/tools'
import {
  shipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  constSelector,
  escapeStatusSelectorFactory,
} from 'views/utils/selectors'

function getMaterialStyle(percent) {
  if (percent <= 50)
    return 'danger'
  else if (percent <= 75)
    return 'warning'
  else if (percent < 100)
    return 'info'
  else
    return 'success'
}

const shipRowDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipRepairDockSelectorFactory(shipId),
    constSelector,
    escapeStatusSelectorFactory(shipId),
  ], ([ship, $ship]=[], repairDock, {$shipTypes}, escaped) => ({
    ship: ship || {},
    $ship: $ship || {},
    $shipTypes,
    labelStatus: getShipLabelStatus(ship, $ship, repairDock, escaped),
  }))
)
export const ShipRow = connect(
  (state, {shipId}) =>
    shipRowDataSelectorFactory(shipId)(state)
)(class ShipRow extends Component {
  static propTypes = {
    ship: PropTypes.object,
    $ship: PropTypes.object,
    $shipTypes: PropTypes.object,
    labelStatus: PropTypes.number,
  }

  shouldComponentUpdate(nextProps) {
    // Remember to expand the list in case you add new properties to display
    const shipPickProps = ['api_lv', 'api_exp', 'api_id', 'api_nowhp', 'api_maxhp',
      'api_cond', 'api_fuel', 'api_bull', 'api_soku']
    return !shallowEqual(omit(this.props, ['ship']), omit(nextProps, ['ship'])) ||
      !isEqual(pick(this.props.ship, shipPickProps), pick(nextProps.ship, shipPickProps))
  }

  render() {
    const {ship, $ship, $shipTypes, labelStatus} = this.props
    const labelStatusStyle = getStatusStyle(labelStatus)
    const hpPercentage = ship.api_nowhp / ship.api_maxhp * 100
    const fuelPercentage = ship.api_fuel / $ship.api_fuel_max * 100
    const ammoPercentage = ship.api_bull / $ship.api_bull_max * 100
    return (
      <div className="ship-item">
        <div className="ship-tile">
          <div className="ship-basic-item">
            <div className="ship-info" style={labelStatusStyle}>
              <div className="ship-basic">
                <span className="ship-lv">
                  Lv. {ship.api_lv || '??'}
                </span>
                <span className='ship-type'>
                  {i18n.resources.__(($shipTypes[$ship.api_stype] || {api_name: '??'}).api_name)}
                </span>
                <span className="ship-speed">
                  {__(getSpeedLabel(ship.api_soku))}
                </span>
                <AACIIndicator shipId={ship.api_id} />
                <OASWndicator shipId={ship.api_id} />
              </div>
              <span className="ship-name">
                {i18n.resources.__($ship.api_name || '??')}
              </span>
              <span className="ship-exp">
                Next. {(ship.api_exp || [])[1]}
              </span>
            </div>
            <OverlayTrigger
              placement='right'
              overlay={
                ship.api_ndock_time > 0 ?
                <Tooltip id={`panebody-repair-time-${ship.api_id}`}>
                  {__('Repair Time')}: {resolveTime(ship.api_ndock_time/1000)}
                </Tooltip>
                : <noscript />
              }
            >
              <div className="ship-stat">
                <div className="div-row">
                  <span className="ship-hp" style={labelStatusStyle}>
                    {ship.api_nowhp} / {ship.api_maxhp}
                  </span>
                  <div className="status-label">
                    <StatusLabel label={labelStatus}/>
                  </div>
                  <div className="status-cond" style={labelStatusStyle}>
                    <span className={"ship-cond " + getCondStyle(ship.api_cond)}>
                      <FontAwesome name='star' />{ship.api_cond}
                    </span>
                  </div>
                </div>
                <span className="hp-progress top-space" style={labelStatusStyle}>
                  <ProgressBar bsStyle={getHpStyle(hpPercentage)}
                               now={hpPercentage} />
                </span>
              </div>
            </OverlayTrigger>
          </div>
        </div>
        <span className="ship-fb" style={labelStatusStyle}>
          <span style={{flex: 1}}>
            <OverlayTrigger placement='right' overlay={
              <Tooltip id={`panebody-fuel-${ship.api_id}`}>
                {ship.api_fuel} / {$ship.api_fuel_max}
              </Tooltip>
            }>
              <ProgressBar bsStyle={getMaterialStyle(fuelPercentage)}
                           now={fuelPercentage} />
            </OverlayTrigger>
          </span>
          <span style={{flex: 1}}>
            <OverlayTrigger placement='right' overlay={
              <Tooltip id={`panebody-bull-${ship.api_id}`}>
                {ship.api_bull} / {$ship.api_bull_max}
              </Tooltip>
            }>
              <ProgressBar bsStyle={getMaterialStyle(ammoPercentage)}
                           now={ammoPercentage} />
            </OverlayTrigger>
          </span>
        </span>
        <div className="ship-slot" style={labelStatusStyle}>
          <Slotitems shipId={ship.api_id} />
        </div>
      </div>
    )
  }
})
