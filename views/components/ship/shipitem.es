import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import shallowEqual from 'fbjs/lib/shallowEqual'
import classNames from 'classnames'
import { createSelector } from 'reselect'
import { ProgressBar, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { isEqual, pick, omit, memoize } from 'lodash'
import FontAwesome from 'react-fontawesome'
import { translate } from 'react-i18next'

import { Slotitems } from './slotitems'
import { StatusLabel } from 'views/components/ship-parts/statuslabel'
import { Avatar } from 'views/components/etc/avatar'
import { AACIIndicator } from './aaci-indicator'
import { OASWIndicator } from './oasw-indicator'
import { getCondStyle, getHpStyle, getStatusStyle, getShipLabelStatus, getSpeedLabel } from 'views/utils/game-utils'
import { resolveTime } from 'views/utils/tools'
import {
  shipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  constSelector,
  escapeStatusSelectorFactory,
} from 'views/utils/selectors'

import './assets/ship-item.css'

function getMaterialStyle(percent) {
  if (percent <= 50)
    return 'red'
  else if (percent <= 75)
    return 'orange'
  else if (percent < 100)
    return 'yellow'
  else
    return 'green'
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

@translate(['main', 'resources'])
@connect((state, {shipId}) => shipRowDataSelectorFactory(shipId)(state))
export class ShipRow extends Component {
  static propTypes = {
    ship: PropTypes.object,
    $ship: PropTypes.object,
    $shipTypes: PropTypes.object,
    labelStatus: PropTypes.number,
    enableAvatar: PropTypes.bool,
    compact: PropTypes.bool,
  }

  shouldComponentUpdate(nextProps) {
    // Remember to expand the list in case you add new properties to display
    const shipPickProps = ['api_lv', 'api_exp', 'api_id', 'api_nowhp', 'api_maxhp',
      'api_cond', 'api_fuel', 'api_bull', 'api_soku']
    return !shallowEqual(omit(this.props, ['ship']), omit(nextProps, ['ship'])) ||
      !isEqual(pick(this.props.ship, shipPickProps), pick(nextProps.ship, shipPickProps))
  }

  render() {
    const { ship, $ship, $shipTypes, labelStatus, enableAvatar, compact, t } = this.props
    const hideShipName = enableAvatar && compact
    const shipInfoClass = classNames("ship-info", {
      "ship-avatar-padding": enableAvatar,
      "ship-info-show": !hideShipName,
      "ship-info-hidden": hideShipName,
    })
    const labelStatusStyle = getStatusStyle(labelStatus)
    const hpPercentage = ship.api_nowhp / ship.api_maxhp * 100
    const fuelPercentage = ship.api_fuel / $ship.api_fuel_max * 100
    const ammoPercentage = ship.api_bull / $ship.api_bull_max * 100
    const fuelTip = (
      <span>
        {ship.api_fuel} / {$ship.api_fuel_max}
        {fuelPercentage < 100 && ` (-${Math.floor(($ship.api_fuel_max - ship.api_fuel) * (ship.api_lv > 99 ? 0.85 : 1))})`}
      </span>
    )
    const ammoTip = (
      <span>
        {ship.api_bull} / {$ship.api_bull_max}
        {ammoPercentage < 100 && ` (-${Math.floor(($ship.api_bull_max - ship.api_bull) * (ship.api_lv > 99 ? 0.85 : 1))})`}
      </span>
    )
    return (
      <div className="ship-item">
        { enableAvatar && <Avatar mstId={$ship.api_id} isDamaged={hpPercentage <= 50} height={54} /> }
        <OverlayTrigger placement='top' overlay={
          hideShipName ? (
            <Tooltip id={`miniship-exp-${ship.api_id}`}>
              <div className="ship-tooltip-info">
                <div>
                  {$ship.api_name ? t(`resources:${$ship.api_name}`) : '??'}
                </div>
                <div>
                  Lv. {ship.api_lv || '??'} Next. {(ship.api_exp || [])[1]}
                </div>
              </div>
            </Tooltip>
          ) : <span />
        }>
          <div className={shipInfoClass} style={labelStatusStyle}>
            <div className="ship-basic">
              <span className="ship-lv">
                Lv. {ship.api_lv || '??'}
              </span>
              <span className='ship-type'>
                {
                  $shipTypes[$ship.api_stype] && $shipTypes[$ship.api_stype].api_name ?
                    t(`resources:${$shipTypes[$ship.api_stype].api_name}`)
                    : '??'
                }
              </span>
              <span className="ship-speed">
                {t(`main:${getSpeedLabel(ship.api_soku)}`)}
              </span>
              <AACIIndicator shipId={ship.api_id} />
              <OASWIndicator shipId={ship.api_id} />
            </div>
            {
              !hideShipName && (
                <>
                  <span className="ship-name">
                    {$ship.api_name ? t(`resources:${$ship.api_name}`) : '??'}
                  </span>
                  <span className="ship-exp">
                    Next. {(ship.api_exp || [])[1]}
                  </span>
                </>
              )
            }
          </div>
        </OverlayTrigger>
        <OverlayTrigger
          placement='right'
          overlay={
            ship.api_ndock_time > 0 ?
              <Tooltip id={`panebody-repair-time-${ship.api_id}`}>
                {t('main:Repair Time')}: {resolveTime(ship.api_ndock_time/1000)}
              </Tooltip>
              : <span />
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
        <span className="ship-fb" style={labelStatusStyle}>
          <span style={{flex: 1}}>
            <OverlayTrigger placement='right' overlay={
              <Tooltip id={`panebody-fuel-${ship.api_id}`}>
                {fuelTip}
              </Tooltip>
            }>
              <ProgressBar bsStyle={getMaterialStyle(fuelPercentage)}
                now={fuelPercentage} />
            </OverlayTrigger>
          </span>
          <span style={{flex: 1}}>
            <OverlayTrigger placement='right' overlay={
              <Tooltip id={`panebody-bull-${ship.api_id}`}>
                {ammoTip}
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
}
