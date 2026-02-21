import { ProgressBar, Tooltip, Position, Tag, Intent } from '@blueprintjs/core'
import shallowEqual from 'fbjs/lib/shallowEqual'
import { isEqual, pick, omit, memoize, get } from 'lodash'
import React, { Component } from 'react'
import { type WithTranslation, withTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import { MaterialIcon } from 'views/components/etc/icon'
import { StatusLabel } from 'views/components/ship-parts/statuslabel'
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
import {
  getCondStyle,
  getHpStyle,
  getStatusStyle,
  getShipLabelStatus,
  getSpeedLabel,
  getMaterialStyle,
  selectShipAvatarColor,
} from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  constSelector,
  escapeStatusSelectorFactory,
  fcdShipTagColorSelector,
} from 'views/utils/selectors'
import { resolveTime } from 'views/utils/tools'

import { AACIIndicator } from './aaci-indicator'
import { AAPBIndicator } from './aapb-indicator'
import { OASWIndicator } from './oasw-indicator'
import { Slotitems } from './slotitems'

interface Ship {
  api_lv?: number
  api_exp?: [number, number, number]
  api_id: number
  api_ship_id?: number
  api_nowhp: number
  api_maxhp: number
  api_cond: number
  api_fuel: number
  api_bull: number
  api_soku: number
  api_ndock_time: number
  [key: string]: unknown
}

interface ShipType {
  api_name?: string
  [key: string]: unknown
}

interface ConstData {
  $shipTypes: Record<number, ShipType>
  [key: string]: unknown
}

interface RepairDock {
  [key: string]: unknown
}

interface ShipRowData {
  ship: Ship
  $ship: Ship
  $shipTypes: Record<number, ShipType>
  labelStatus: number
  shipAvatarColor: string
}

interface ShipRowProps extends WithTranslation {
  shipId: number
  ship?: Ship
  $ship?: Ship
  $shipTypes?: Record<number, ShipType>
  labelStatus?: number
  enableAvatar?: boolean
  compact?: boolean
  shipAvatarColor?: string
  showSpAttackLabel?: boolean
}

const shipRowDataSelectorFactory = memoize((shipId: number) =>
  createSelector(
    [
      shipDataSelectorFactory(shipId),
      shipRepairDockSelectorFactory(shipId),
      constSelector,
      escapeStatusSelectorFactory(shipId),
      fcdShipTagColorSelector,
      (state: Record<string, unknown>) => get(state, 'config.poi.appearance.avatarType'),
    ],
    (
      [ship, $ship] = [{}, {}] as [Ship, Ship],
      repairDock: RepairDock | undefined,
      { $shipTypes }: ConstData,
      escaped: boolean,
      shipTagColor: string[],
      avatarType: string,
    ): ShipRowData => ({
      ship: ship || ({} as Ship),
      $ship: $ship || ({} as Ship),
      $shipTypes,
      labelStatus: getShipLabelStatus(ship, $ship, repairDock, escaped),
      shipAvatarColor: selectShipAvatarColor(ship, $ship, shipTagColor, avatarType),
    }),
  ),
)

class ShipRowComponent extends Component<ShipRowProps> {
  shouldComponentUpdate(nextProps: ShipRowProps): boolean {
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

  render(): React.ReactNode {
    const {
      ship = {} as Ship,
      $ship = {} as Ship,
      $shipTypes = {},
      labelStatus = 0,
      enableAvatar,
      shipAvatarColor,
      showSpAttackLabel,
      compact,
      t,
    } = this.props

    const hideShipName = enableAvatar && compact
    const labelStatusStyle = getStatusStyle(labelStatus)
    const hpPercentage = (ship.api_nowhp / ship.api_maxhp) * 100
    const fuelPercentage = (ship.api_fuel / ($ship?.api_fuel_max || 1)) * 100
    const ammoPercentage = (ship.api_bull / ($ship?.api_bull_max || 1)) * 100

    const fuelTip = (
      <span>
        <MaterialIcon materialId={1} className="material-icon" />
        {ship.api_fuel} / {$ship?.api_fuel_max}
        {fuelPercentage < 100 &&
          ` (-${Math.max(
            1,
            Math.floor(
              (($ship?.api_fuel_max || 0) - ship.api_fuel) * (ship.api_lv && ship.api_lv > 99 ? 0.85 : 1),
            ),
          )})`}
      </span>
    )

    const ammoTip = (
      <span>
        <MaterialIcon materialId={2} className="material-icon" />
        {ship.api_bull} / {$ship?.api_bull_max}
        {ammoPercentage < 100 &&
          ` (-${Math.max(
            1,
            Math.floor(
              (($ship?.api_bull_max || 0) - ship.api_bull) * (ship.api_lv && ship.api_lv > 99 ? 0.85 : 1),
            ),
          )})`}
      </span>
    )

    const shipBasicContent = (
      <>
        <span className="ship-lv">Lv. {ship.api_lv || '??'}</span>
        <ShipLabel className="ship-type">
          {$shipTypes[$ship?.api_stype as number]?.api_name
            ? t(`resources:${$shipTypes[$ship?.api_stype as number].api_name}`)
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
        {showSpAttackLabel && (
          <ShipLabel className="ship-skill-indicator ship-sp-attack" isTag>
            <Tag minimal intent={Intent.DANGER}>
              {t('main:Special Attack')}
            </Tag>
          </ShipLabel>
        )}
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
            <div>{$ship?.api_name ? t(`resources:${$ship.api_name}`) : '??'}</div>
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
                mstId={$ship?.api_id as number}
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
                {$ship?.api_name
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

const mapStateToProps = (state: unknown, ownProps: { shipId: number }): Partial<ShipRowProps> => ({
  ...shipRowDataSelectorFactory(ownProps.shipId)(state),
})

export const ShipRow = connect(mapStateToProps)(withTranslation(['main', 'resources'])(ShipRowComponent))
