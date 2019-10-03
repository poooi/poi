import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import shallowEqual from 'fbjs/lib/shallowEqual'
import { createSelector } from 'reselect'
import { isEqual, pick, omit, memoize, get } from 'lodash'
import { withNamespaces } from 'react-i18next'
import { ProgressBar, Tooltip, Position } from '@blueprintjs/core'
import { MaterialIcon } from 'views/components/etc/icon'

import { Slotitems } from './slotitems'
import { StatusLabel } from 'views/components/ship-parts/statuslabel'
import { AACIIndicator } from './aaci-indicator'
import { AAPBIndicator } from './aapb-indicator'
import { OASWIndicator } from './oasw-indicator'
import {
  getCondStyle,
  getHpStyle,
  getStatusStyle,
  getShipLabelStatus,
  getSpeedLabel,
  getMaterialStyle,
  selectShipAvatarColor,
} from 'views/utils/game-utils'
import { resolveTime } from 'views/utils/tools'
import {
  shipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  constSelector,
  escapeStatusSelectorFactory,
  fcdShipTagColorSelector,
} from 'views/utils/selectors'

import {
  ShipItem,
  ShipAvatar,
  ShipBasic,
  ShipIndicators,
  ShipSubText,
  ShipLabel,
  ShipName,
  ShipStatusContainer,
  ShipStatWToolTip,
  ShipHP,
  StatusLabelContainer,
  ShipCond,
  ShipFB,
  ShipSlot,
  ShipHPProgress,
  Gradient,
} from 'views/components/ship-parts/styled-components'

const shipRowDataSelectorFactory = memoize(shipId =>
  createSelector(
    [
      shipDataSelectorFactory(shipId),
      shipRepairDockSelectorFactory(shipId),
      constSelector,
      escapeStatusSelectorFactory(shipId),
      fcdShipTagColorSelector,
      state => get(state, 'config.poi.appearance.avatarType'),
    ],
    ([ship, $ship] = [], repairDock, { $shipTypes }, escaped, shipTagColor, avatarType) => ({
      ship: ship || {},
      $ship: $ship || {},
      $shipTypes,
      labelStatus: getShipLabelStatus(ship, $ship, repairDock, escaped),
      shipAvatarColor: selectShipAvatarColor(ship, $ship, shipTagColor, avatarType),
    }),
  ),
)

@withNamespaces(['main', 'resources'])
@connect((state, { shipId }) => shipRowDataSelectorFactory(shipId)(state))
export class ShipRow extends Component {
  static propTypes = {
    ship: PropTypes.object,
    $ship: PropTypes.object,
    $shipTypes: PropTypes.object,
    labelStatus: PropTypes.number,
    enableAvatar: PropTypes.bool,
    compact: PropTypes.bool,
    shipAvatarColor: PropTypes.string,
  }

  shouldComponentUpdate(nextProps) {
    // Remember to expand the list in case you add new properties to display
    const shipPickProps = [
      'api_lv',
      'api_exp',
      'api_id',
      'api_nowhp',
      'api_maxhp',
      'api_cond',
      'api_fuel',
      'api_bull',
      'api_soku',
    ]
    return (
      !shallowEqual(omit(this.props, ['ship']), omit(nextProps, ['ship'])) ||
      !isEqual(pick(this.props.ship, shipPickProps), pick(nextProps.ship, shipPickProps))
    )
  }

  render() {
    const {
      ship,
      $ship,
      $shipTypes,
      labelStatus,
      enableAvatar,
      shipAvatarColor,
      compact,
      t,
    } = this.props
    const hideShipName = enableAvatar && compact
    const labelStatusStyle = getStatusStyle(labelStatus)
    const hpPercentage = (ship.api_nowhp / ship.api_maxhp) * 100
    const fuelPercentage = (ship.api_fuel / $ship.api_fuel_max) * 100
    const ammoPercentage = (ship.api_bull / $ship.api_bull_max) * 100
    const fuelTip = (
      <span>
        <MaterialIcon materialId={1} className="material-icon" />
        {ship.api_fuel} / {$ship.api_fuel_max}
        {fuelPercentage < 100 &&
          ` (-${Math.max(
            1,
            Math.floor(($ship.api_fuel_max - ship.api_fuel) * (ship.api_lv > 99 ? 0.85 : 1)),
          )})`}
      </span>
    )
    const ammoTip = (
      <span>
        <MaterialIcon materialId={2} className="material-icon" />
        {ship.api_bull} / {$ship.api_bull_max}
        {ammoPercentage < 100 &&
          ` (-${Math.max(
            1,
            Math.floor(($ship.api_bull_max - ship.api_bull) * (ship.api_lv > 99 ? 0.85 : 1)),
          )})`}
      </span>
    )
    const shipBasicContent = (
      <>
        <span className="ship-lv">Lv. {ship.api_lv || '??'}</span>
        <ShipLabel className="ship-type">
          {$shipTypes[$ship.api_stype] && $shipTypes[$ship.api_stype].api_name
            ? t(`resources:${$shipTypes[$ship.api_stype].api_name}`)
            : '??'}
        </ShipLabel>
      </>
    )
    const shipIndicatorsContent = (
      <>
        <ShipLabel className="ship-speed">{t(`main:${getSpeedLabel(ship.api_soku)}`)}</ShipLabel>
        <AACIIndicator shipId={ship.api_id} />
        <AAPBIndicator shipId={ship.api_id} />
        <OASWIndicator shipId={ship.api_id} />
      </>
    )
    return (
      <Tooltip
        position={Position.TOP}
        disabled={!hideShipName}
        wrapperTagName="div"
        targetTagName="div"
        content={
          <div className="ship-tooltip-info">
            <div>{$ship.api_name ? t(`resources:${$ship.api_name}`) : '??'}</div>
            <div>
              Lv. {ship.api_lv || '??'} Next. {(ship.api_exp || [])[1]}
            </div>
          </div>
        }
      >
        <ShipItem
          className="ship-item"
          data-master-id={ship.api_ship_id}
          data-ship-id={ship.api_id}
          avatar={enableAvatar}
          shipName={!hideShipName}
        >
          {enableAvatar && (
            <>
              <ShipAvatar
                mstId={$ship.api_id}
                isDamaged={hpPercentage <= 50}
                height={58}
                useDefaultBG={false}
                useFixedWidth={false}
              />
              <Gradient color={shipAvatarColor} />
            </>
          )}

          {hideShipName || (
            <ShipBasic className="ship-basic" avatar={enableAvatar}>
              {shipBasicContent}
              {!enableAvatar && shipIndicatorsContent}
            </ShipBasic>
          )}

          {enableAvatar && (
            <ShipIndicators className="ship-basic">
              {hideShipName && shipBasicContent}
              {shipIndicatorsContent}
            </ShipIndicators>
          )}

          {!hideShipName && (
            <>
              <ShipName className="ship-name" avatar={enableAvatar}>
                {$ship.api_name
                  ? t(`resources:${$ship.api_name}`, { keySeparator: 'chiba' })
                  : '??'}
              </ShipName>
              <ShipSubText className="ship-exp" avatar={enableAvatar}>
                Next. {(ship.api_exp || [])[1]}
              </ShipSubText>
            </>
          )}

          <ShipHP className="ship-hp" style={labelStatusStyle}>
            {ship.api_nowhp} / {ship.api_maxhp}
          </ShipHP>

          <StatusLabelContainer className="status-label">
            <StatusLabel label={labelStatus} />
          </StatusLabelContainer>

          <ShipStatusContainer className="status-cond" style={labelStatusStyle}>
            <ShipCond className={'ship-cond ' + getCondStyle(ship.api_cond)}>
              {ship.api_cond}
            </ShipCond>
          </ShipStatusContainer>

          <ShipHPProgress className="hp-progress" style={labelStatusStyle}>
            <ProgressBar
              stripes={false}
              intent={getHpStyle(hpPercentage)}
              value={hpPercentage / 100}
            />
          </ShipHPProgress>

          <ShipStatWToolTip
            position={Position.RIGHT}
            disabled={ship.api_ndock_time === 0}
            className="ship-stat"
            wrapperTagName="div"
            targetTagName="div"
            content={`${t('main:Repair Time')}: ${resolveTime(ship.api_ndock_time / 1000)}`}
          >
            <div />
          </ShipStatWToolTip>

          <ShipFB className="ship-fb" style={labelStatusStyle}>
            <Tooltip
              className="ship-fb-item"
              position={Position.RIGHT}
              wrapperTagName="div"
              targetTagName="div"
              content={fuelTip}
            >
              <ProgressBar
                stripes={false}
                intent={getMaterialStyle(fuelPercentage)}
                value={fuelPercentage / 100}
              />
            </Tooltip>
            <Tooltip
              className="ship-fb-item"
              position={Position.RIGHT}
              wrapperTagName="div"
              targetTagName="div"
              content={ammoTip}
            >
              <ProgressBar
                stripes={false}
                intent={getMaterialStyle(ammoPercentage)}
                value={ammoPercentage / 100}
              />
            </Tooltip>
          </ShipFB>

          <ShipSlot className="ship-slot" style={labelStatusStyle}>
            <Slotitems shipId={ship.api_id} />
          </ShipSlot>
        </ShipItem>
      </Tooltip>
    )
  }
}
