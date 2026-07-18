import type { RootState } from 'views/redux/reducer-factory'

import { ProgressBar, Position, Tooltip } from '@blueprintjs/core'
import { memoize } from 'lodash'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { StatusLabel } from 'views/components/ship-parts/statuslabel'
import {
  selectShipAvatarColor,
  getCondStyle,
  getShipLabelStatus,
  asIntent,
  getHpStyle,
  getStatusStyle,
} from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  escapeStatusSelectorFactory,
  fcdShipTagColorSelector,
} from 'views/utils/selectors'

import { MiniSlotitems } from './mini-slotitems'
import {
  HPProgress,
  MiniGradient,
  MiniShipAvatar,
  MiniShipCond,
  MiniShipHP,
  MiniShipItem,
  MiniShipName,
  MiniStatusLabelContainer,
  ShipInfo,
  ShipLvAvatar,
  ShipLvText,
  ShipTile,
  ShipTooltip,
} from './styled-components'

// NOTE: mirrors shipRowDataSelectorFactory (views/components/ship/ship-item)
// minus the constSelector input: mini rows deliberately do not subscribe to
// state.const so a master-data refresh does not re-render every mini row.
const miniShipRowDataSelectorFactory = memoize((shipId: number) =>
  createSelector(
    [
      shipDataSelectorFactory(shipId),
      shipRepairDockSelectorFactory(shipId),
      escapeStatusSelectorFactory(shipId),
      fcdShipTagColorSelector,
      (state: RootState) => state.config?.poi?.appearance?.avatarType,
    ],
    (shipPair, repairDock, escaped, shipTagColor, avatarType) => {
      const [ship, $ship] = shipPair ?? []
      return {
        ship: ship,
        $ship: $ship,
        labelStatus: getShipLabelStatus(ship, $ship, !!repairDock, escaped),
        shipAvatarColor: selectShipAvatarColor(
          ship,
          $ship,
          shipTagColor as string[],
          avatarType ?? '',
        ),
      }
    },
  ),
)

export const MiniShipRow = memo(
  ({
    shipId,
    enableAvatar,
    compact,
  }: {
    shipId: number
    enableAvatar?: boolean
    compact?: boolean
  }) => {
    const { t } = useTranslation(['resources', 'main'])
    const selector = React.useMemo(() => miniShipRowDataSelectorFactory(shipId), [shipId])
    const { ship, $ship, labelStatus, shipAvatarColor } = useSelector((state: RootState) =>
      selector(state),
    )
    const hideShipName = enableAvatar && compact
    if (!ship || !ship.api_id) return <div />
    const labelStatusStyle = getStatusStyle(labelStatus)
    const apiNowhp = ship.api_nowhp ?? 0
    const apiMaxhp = ship.api_maxhp ?? 1
    const hpPercentage = (apiNowhp / apiMaxhp) * 100
    const level = ship.api_lv
    const remodelLevel = $ship?.api_afterlv
    const exp = (ship.api_exp ?? [])[0]
    const nextExp = (ship.api_exp ?? [])[1]
    const remodelString =
      remodelLevel && level < remodelLevel
        ? t('main:RemodelLv', { remodelLevel })
        : remodelLevel
          ? t('main:RemodelReady')
          : ''

    return (
      <ShipTile
        as={Tooltip}
        position={Position.RIGHT_TOP}
        disabled={ship?.api_slot?.[0] === -1 && ship.api_slot_ex <= 0}
        className="ship-tile"
        content={
          <ShipTooltip className="ship-pop">
            <MiniSlotitems shipId={ship.api_id as number} />
          </ShipTooltip>
        }
        fill
      >
        <MiniShipItem
          className="ship-item"
          avatar={enableAvatar}
          shipName={!hideShipName}
          data-master-id={ship.api_ship_id as number}
          data-ship-id={ship.api_id as number}
        >
          {enableAvatar && (
            <>
              <MiniShipAvatar
                mstId={$ship?.api_id}
                isDamaged={hpPercentage <= 50}
                useDefaultBG={false}
                useFixedWidth={false}
                height={38}
              />
              <MiniGradient color={shipAvatarColor} />
            </>
          )}
          {hideShipName && (
            <ShipLvAvatar className="ship-lv-avatar">
              {level && t('main:Lv', { level })}
            </ShipLvAvatar>
          )}
          {!hideShipName && (
            <>
              <MiniShipName
                className="ship-name"
                style={enableAvatar ? undefined : labelStatusStyle}
                avatar={enableAvatar}
              >
                {$ship?.api_name
                  ? t(`resources:${$ship.api_name}`, { keySeparator: 'chiba' })
                  : '??'}
              </MiniShipName>
              <ShipLvText
                className="ship-lv-text"
                style={enableAvatar ? undefined : labelStatusStyle}
                avatar={enableAvatar}
              >
                {level && t('main:Lv', { level })}
              </ShipLvText>
            </>
          )}
          <MiniShipHP className="ship-hp" style={labelStatusStyle}>
            {apiNowhp} / {apiMaxhp}
          </MiniShipHP>
          <MiniStatusLabelContainer className="status-label">
            <StatusLabel label={labelStatus} />
          </MiniStatusLabelContainer>
          <MiniShipCond className={'ship-cond ' + getCondStyle(ship.api_cond)}>
            {ship.api_cond}
          </MiniShipCond>
          <HPProgress className="hp-progress" style={labelStatusStyle}>
            <ProgressBar
              stripes={false}
              intent={asIntent(getHpStyle(hpPercentage))}
              value={hpPercentage / 100}
            />
          </HPProgress>
          <ShipInfo
            as={Tooltip}
            className="ship-info"
            position={Position.TOP_LEFT}
            content={
              hideShipName ? (
                <div className="ship-tooltip-info">
                  <div>{$ship?.api_name ? t(`resources:${$ship.api_name}`) : '??'}</div>
                  <div>{level && t('main:Lv', { level })}</div>
                  {exp > 0 && <div>{t('main:TotalExp', { exp })}</div>}
                  {nextExp > 0 && <div>{t('main:NextExp', { nextExp })}</div>}
                  {remodelString && <div>{remodelString}</div>}
                </div>
              ) : (
                <div>
                  {exp > 0 && <div>{t('main:TotalExp', { exp })}</div>}
                  {nextExp > 0 && <div>{t('main:NextExp', { nextExp })}</div>}
                  {remodelString && <div>{remodelString}</div>}
                </div>
              )
            }
          >
            <div />
          </ShipInfo>
        </MiniShipItem>
      </ShipTile>
    )
  },
)
MiniShipRow.displayName = 'MiniShipRow'
