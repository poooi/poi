import type { APIShip } from 'kcsapi/api_port/port/response'
import type { APIMstShip } from 'kcsapi/api_start2/getData/response'
import type { RootState } from 'views/redux/reducer-factory'

import { Intent, Position, ProgressBar, Tag, Tooltip } from '@blueprintjs/core'
import { isEqual, memoize, omit, pick } from 'lodash-es'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { MaterialIcon } from 'views/components/etc/icon'
import { StatusLabel } from 'views/components/ship-parts/statuslabel'
import {
  Gradient,
  ShipAvatar,
  ShipBasic,
  ShipCond,
  ShipFB,
  ShipHP,
  ShipHPProgress,
  ShipIndicators,
  ShipItem,
  ShipLabel,
  ShipName,
  ShipSlot,
  ShipStatWToolTip,
  ShipSubText,
  StatusLabelContainer,
  ShipStatusContainer,
} from 'views/components/ship-parts/styled-components'
import {
  getCondStyle,
  getHpStyle,
  getMaterialStyle,
  getShipLabelStatus,
  getSpeedLabel,
  getStatusStyle,
  selectShipAvatarColor,
} from 'views/utils/game-utils'
import {
  constSelector,
  escapeStatusSelectorFactory,
  fcdShipTagColorSelector,
  shipDataSelectorFactory,
  shipRepairDockSelectorFactory,
} from 'views/utils/selectors'
import { resolveTime } from 'views/utils/tools'

import { AACIIndicator } from './aaci-indicator'
import { AAPBIndicator } from './aapb-indicator'
import { OASWIndicator } from './oasw-indicator'
import { Slotitems } from './slotitems'

const shipRowDataSelectorFactory = memoize((shipId: number) =>
  createSelector(
    [
      shipDataSelectorFactory(shipId),
      shipRepairDockSelectorFactory(shipId),
      constSelector,
      escapeStatusSelectorFactory(shipId),
      fcdShipTagColorSelector,
      (state: RootState) => state.config?.poi?.appearance?.avatarType,
    ],
    (shipPair, repairDock, { $shipTypes }, escaped, shipTagColor, avatarType) => {
      const [ship, $ship] = shipPair ?? []
      return {
        ship: ship,
        $ship: $ship,
        $shipTypes: $shipTypes ?? {},
        labelStatus: getShipLabelStatus(ship, $ship, !!repairDock, escaped),
        shipAvatarColor: selectShipAvatarColor(ship, $ship, shipTagColor, avatarType ?? ''),
      }
    },
  ),
)

interface ShipRowProps {
  shipId: number
  enableAvatar?: boolean
  compact?: boolean
  showSpAttackLabel?: boolean
}

const SHIP_PICK_PROPS = [
  'api_lv',
  'api_exp',
  'api_id',
  'api_nowhp',
  'api_maxhp',
  'api_cond',
  'api_fuel',
  'api_bull',
  'api_soku',
] as const

type ShipRowInnerProps = ShipRowProps & {
  ship?: APIShip
  $ship?: APIMstShip
  $shipTypes: Record<string, { api_name?: string }>
  labelStatus: number
  shipAvatarColor: string
  t: (key: string, opts?: object) => string
}

const ShipRowInner = memo(
  ({
    ship,
    $ship,
    $shipTypes,
    labelStatus,
    enableAvatar,
    shipAvatarColor,
    showSpAttackLabel,
    compact,
    t,
  }: ShipRowInnerProps) => {
    const hideShipName = enableAvatar && compact
    const labelStatusStyle = getStatusStyle(labelStatus)
    const shipId = ship?.api_id ?? -1
    const shipMstId = $ship?.api_id ?? -1
    const apiNowhp = ship?.api_nowhp ?? 0
    const apiMaxhp = ship?.api_maxhp ?? 1
    const apiFuel = ship?.api_fuel ?? 0
    const apiBull = ship?.api_bull ?? 0
    const apiFuelMax = $ship?.api_fuel_max ?? 1
    const apiBullMax = $ship?.api_bull_max ?? 1
    const apiLv = ship?.api_lv ?? 0
    const apiCond = ship?.api_cond ?? 49
    const apiSoku = ship?.api_soku ?? 0
    const apiStype = $ship?.api_stype ?? 0
    const apiNdockTime = ship?.api_ndock_time ?? 0
    const apiExp = ship?.api_exp ?? []
    const apiName = $ship?.api_name ?? '??'
    const hpPercentage = (apiNowhp / apiMaxhp) * 100
    const fuelPercentage = (apiFuel / apiFuelMax) * 100
    const ammoPercentage = (apiBull / apiBullMax) * 100

    const fuelTip = (
      <span>
        <MaterialIcon materialId={1} className="material-icon" />
        {apiFuel} / {apiFuelMax}
        {fuelPercentage < 100 &&
          ` (-${Math.max(1, Math.floor((apiFuelMax - apiFuel) * (apiLv > 99 ? 0.85 : 1)))})`}
      </span>
    )
    const ammoTip = (
      <span>
        <MaterialIcon materialId={2} className="material-icon" />
        {apiBull} / {apiBullMax}
        {ammoPercentage < 100 &&
          ` (-${Math.max(1, Math.floor((apiBullMax - apiBull) * (apiLv > 99 ? 0.85 : 1)))})`}
      </span>
    )
    const shipBasicContent = (
      <>
        <span className="ship-lv">Lv. {apiLv || '??'}</span>
        <ShipLabel className="ship-type">
          {$shipTypes[apiStype]?.api_name ? t(`resources:${$shipTypes[apiStype].api_name}`) : '??'}
        </ShipLabel>
      </>
    )
    const shipIndicatorsContent = (
      <>
        <ShipLabel className="ship-speed">{t(`main:${getSpeedLabel(apiSoku)}`)}</ShipLabel>
        <AACIIndicator shipId={shipId} />
        <AAPBIndicator shipId={shipId} />
        <OASWIndicator shipId={shipId} />
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
        content={
          <div className="ship-tooltip-info">
            <div>{apiName ? t(`resources:${apiName}`) : '??'}</div>
            <div>
              Lv. {apiLv || '??'} Next. {apiExp[1]}
            </div>
          </div>
        }
      >
        <ShipItem
          className="ship-item"
          data-master-id={$ship?.api_id}
          data-ship-id={shipId}
          avatar={enableAvatar}
          shipName={!hideShipName}
        >
          {enableAvatar && (
            <>
              <ShipAvatar
                mstId={shipMstId}
                isDamaged={hpPercentage <= 50}
                height={58}
                useDefaultBG={false}
                useFixedWidth={false}
              />
              <Gradient color={shipAvatarColor} />
            </>
          )}

          {!hideShipName && (
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
                {apiName ? t(`resources:${apiName}`, { keySeparator: 'chiba' }) : '??'}
              </ShipName>
              <ShipSubText className="ship-exp" avatar={enableAvatar}>
                Next. {apiExp[1]}
              </ShipSubText>
            </>
          )}

          <ShipHP className="ship-hp" style={labelStatusStyle}>
            {apiNowhp} / {apiMaxhp}
          </ShipHP>

          <StatusLabelContainer className="status-label">
            <StatusLabel label={labelStatus} />
          </StatusLabelContainer>

          <ShipStatusContainer className="status-cond" style={labelStatusStyle}>
            <ShipCond className={`ship-cond ${getCondStyle(apiCond)}`}>{apiCond}</ShipCond>
          </ShipStatusContainer>

          <ShipHPProgress className="hp-progress" style={labelStatusStyle}>
            <ProgressBar
              stripes={false}
              // @ts-expect-error Custom Intent type is not assignable to Intent, but the value is guaranteed to be valid
              intent={getHpStyle(hpPercentage)}
              value={hpPercentage / 100}
            />
          </ShipHPProgress>

          <ShipStatWToolTip
            position={Position.RIGHT}
            disabled={apiNdockTime === 0}
            className="ship-stat"
            content={`${t('main:Repair Time')}: ${resolveTime(apiNdockTime / 1000)}`}
          >
            <div />
          </ShipStatWToolTip>

          <ShipFB className="ship-fb" style={labelStatusStyle}>
            <Tooltip className="ship-fb-item" position={Position.RIGHT} content={fuelTip}>
              <ProgressBar
                stripes={false}
                // @ts-expect-error Custom Intent type is not assignable to Intent, but the value is guaranteed to be valid
                intent={getMaterialStyle(fuelPercentage)}
                value={fuelPercentage / 100}
              />
            </Tooltip>
            <Tooltip className="ship-fb-item" position={Position.RIGHT} content={ammoTip}>
              <ProgressBar
                stripes={false}
                // @ts-expect-error Custom Intent type is not assignable to Intent, but the value is guaranteed to be valid
                intent={getMaterialStyle(ammoPercentage)}
                value={ammoPercentage / 100}
              />
            </Tooltip>
          </ShipFB>

          <ShipSlot className="ship-slot" style={labelStatusStyle}>
            <Slotitems shipId={shipId} />
          </ShipSlot>
        </ShipItem>
      </Tooltip>
    )
  },
  (prev, next) =>
    isEqual(omit(prev, ['ship']), omit(next, ['ship'])) &&
    isEqual(pick(prev.ship, SHIP_PICK_PROPS), pick(next.ship, SHIP_PICK_PROPS)),
)
ShipRowInner.displayName = 'ShipRowInner'

export const ShipRow = ({ shipId, enableAvatar, compact, showSpAttackLabel }: ShipRowProps) => {
  const { t } = useTranslation(['main', 'resources'])
  const selector = React.useMemo(() => shipRowDataSelectorFactory(shipId), [shipId])
  const data = useSelector((state: RootState) => selector(state))

  return (
    <ShipRowInner
      {...data}
      shipId={shipId}
      enableAvatar={enableAvatar}
      compact={compact}
      showSpAttackLabel={showSpAttackLabel}
      t={t}
    />
  )
}
