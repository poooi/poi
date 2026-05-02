import type { APIShip } from 'kcsapi/api_port/port/response'
import type { APIMstShip } from 'kcsapi/api_start2/getData/response'
import type { RootState } from 'views/redux/reducer-factory'

import { Tag, ProgressBar, Intent, Position, Tooltip } from '@blueprintjs/core'
import { isEqual, pick, omit, memoize, get } from 'lodash-es'
import path from 'path'
import React, { memo } from 'react'
import FontAwesome from 'react-fontawesome'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { css, styled } from 'styled-components'
import { Avatar } from 'views/components/etc/avatar'
import { SlotitemIcon } from 'views/components/etc/icon'
import { StatusLabel } from 'views/components/ship-parts/statuslabel'
import { SlotItemContainer, ALevel } from 'views/components/ship-parts/styled-components'
import { LandbaseSlotitems } from 'views/components/ship/slotitems'
import {
  selectShipAvatarColor,
  getCondStyle,
  equipIsAircraft,
  getShipLabelStatus,
  getHpStyle,
  getStatusStyle,
  getTyku,
  LBAC_INTENTS,
  LBAC_STATUS_NAMES,
  LBAC_STATUS_AVATAR_COLOR,
} from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipEquipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  escapeStatusSelectorFactory,
  landbaseSelectorFactory,
  landbaseEquipDataSelectorFactory,
  fcdShipTagColorSelector,
} from 'views/utils/selectors'

const SlotItemContainerMini = styled.div`
  align-items: center;
  display: flex;
  flex-flow: row;
  margin-top: 4px;

  .png {
    height: 32px;
    margin-bottom: -8px;
    margin-top: -8px;
    width: 32px;
  }

  .svg {
    height: 20px;
    width: 20px;
  }
`

const ItemName = styled.div<{ hide?: boolean }>`
  margin-bottom: 5px;
  ${({ hide }) =>
    hide &&
    css`
      display: none;
    `}
`

const SlotItemName = styled.span`
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Level = styled.strong`
  color: #45a9a5;
  margin-left: 1em;
  margin-right: 1em;
`

const OnSlot = styled(Tag)<{ hide?: boolean }>`
  width: 3em;
  text-align: center;
  display: flex;
  align-items: center;
  margin-left: 1ex;
  ${({ hide }) =>
    hide &&
    css`
      display: none;
    `}
`

const slotitemsDataSelectorFactory = memoize((shipId: number) =>
  createSelector(
    [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
    (shipPair, equipsData) => {
      const [, $ship] = shipPair ?? []
      return {
        api_maxeq: $ship?.api_maxeq,
        equipsData,
      }
    },
  ),
)

const Slotitems = ({ shipId }: { shipId: number }) => {
  const { t } = useTranslation('resources')
  const selector = React.useMemo(() => slotitemsDataSelectorFactory(shipId), [shipId])
  const { api_maxeq, equipsData } = useSelector((state: RootState) => selector(state))

  return (
    <ItemName className="item-name" hide={!equipsData}>
      <div className="slotitems-mini" style={{ display: 'flex', flexFlow: 'column' }}>
        {(equipsData ?? []).filter(Boolean).map((equipData, equipIdx) => {
          const [equip, $equip, onslot] = equipData!
          const equipIconId = ($equip.api_type as number[])[3]
          const level = equip.api_level as number
          const proficiency = equip.api_alv as number | undefined
          const isAircraft = equipIsAircraft($equip)
          const maxOnslot = (api_maxeq ?? [])[equipIdx]
          const onslotWarning = maxOnslot !== undefined && (onslot ?? 0) < maxOnslot
          return (
            <SlotItemContainerMini key={equipIdx} className="slotitem-container-mini">
              <SlotitemIcon
                key={equip.api_id as number}
                className="slotitem-img"
                slotitemId={equipIconId}
              />
              <SlotItemName>
                {$equip ? t(`resources:${$equip.api_name}`, { keySeparator: '%%%%' }) : '???'}
              </SlotItemName>
              {Boolean(level) && (
                <Level>
                  <FontAwesome name="star" />
                  {level}
                </Level>
              )}
              {proficiency && (
                <ALevel
                  className="alv-img"
                  src={path.join('assets', 'img', 'airplane', `alv${proficiency}.png`)}
                />
              )}
              <OnSlot
                className="slotitems-onslot"
                hide={!isAircraft}
                intent={onslotWarning ? Intent.WARNING : Intent.SUCCESS}
              >
                {onslot}
              </OnSlot>
            </SlotItemContainerMini>
          )
        })}
      </div>
    </ItemName>
  )
}

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

const SHIP_PROPS_TO_PICK = [
  'api_lv',
  'api_exp',
  'api_id',
  'api_nowhp',
  'api_maxhp',
  'api_cond',
  'api_slot',
  'api_slot_ex',
] as const

const ShipTooltip = styled.div`
  font-size: 13px;
  white-space: nowrap;

  .material-icon {
    margin-right: auto;
  }
`

const ShipItem = styled.div<{ avatar?: boolean; shipName?: boolean; isLBAC?: boolean }>`
  align-items: start;
  display: grid;
  flex: 1;
  flex-flow: row nowrap;
  overflow: hidden;
  position: relative;
  white-space: nowrap;
  ${({ avatar = true, shipName = true, isLBAC = false }) => {
    const avatarWidth = avatar ? '50px' : '0'
    const nameWidth = shipName ? 'minmax(35px, 95px)' : isLBAC ? '1fr' : '15px'
    const dataWidth = isLBAC ? '32px 120px' : 'minmax(70px, 5fr) 18px 42px'
    return css`
      grid-template-columns: ${avatarWidth} ${nameWidth} ${dataWidth};
      grid-template-rows: 20px 13px;
      gap: 5px 6px;
    `
  }}
`

const ShipLvAvatar = styled.div`
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  z-index: 99;
  display: flex;
  filter: drop-shadow(0 0 2px black);
  font-size: 70%;
  line-height: 1;
  text-shadow: 0 0 2px rgb(0 0 0 / 1);
  white-space: nowrap;
`

const ShipInfo = styled.div`
  grid-row: 1 / 3;
  grid-column: 1 / 3;
  z-index: 100;
  height: 100%;

  & > div {
    height: 100%;
    width: 100%;
  }
`

const ShipName = styled.div<{ avatar?: boolean }>`
  z-index: 2;
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${({ avatar }) =>
    avatar &&
    css`
      text-align: end;
      padding-right: 6px;
      font-weight: 600;
      color: white;
      text-shadow: #000 0 0 10px;
    `}
`

const ShipLvText = styled.div<{ avatar?: boolean }>`
  z-index: 2;
  grid-row: 2 / 3;
  grid-column: 2 / 3;
  font-size: 70%;
  line-height: 1;
  overflow: hidden;
  align-items: center;
  ${({ avatar }) =>
    avatar &&
    css`
      text-align: end;
      padding-right: 6px;
      color: white;
      text-shadow: #000 0 0 10px;
    `}
`

const ShipStateText = styled.div`
  display: flex;
`

const ShipHP = styled.span`
  font-size: 110%;
  grid-row: 1 / 2;
  grid-column: 3 / 4;
`

const StatusLabelContainer = styled.div`
  grid-row: 1 / 2;
  grid-column: 4 / 5;
  position: relative;
  text-align: center;
  vertical-align: middle;
  z-index: 101;
`

const ShipCond = styled.div`
  align-self: flex-end;
  grid-row: 1 / 2;
  grid-column: 5 / 6;
  text-align: right;
  white-space: nowrap;
`

const HPProgress = styled.div`
  grid-row: 2 / 3;
  grid-column: 3 / 6;

  .bp5-progress-bar {
    flex: auto;
    height: 7px;
    margin-top: 3px;
  }
`

export const ShipAvatar = styled(Avatar)`
  pointer-events: none;
  align-items: end;
  align-self: center;
  grid-row: 1 / 3;
  grid-column: 1 / 3;
`

const Gradient = styled.div<{ color: string }>`
  z-index: 1;
  grid-row: 1 / 3;
  grid-column: 2 / 3;
  height: 100%;

  ${({ color }) => css`
    background: linear-gradient(to right, transparent, ${color});
  `}
`

const ShipTile = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  position: relative;

  .ship-item-wrapper {
    width: 100%;
  }

  &:first-child {
    margin-top: 0;
  }

  &:last-child {
    margin-bottom: 0;
  }
`

interface MiniShipRowInnerProps {
  ship?: APIShip
  $ship?: APIMstShip
  labelStatus: number
  shipAvatarColor: string
  enableAvatar?: boolean
  compact?: boolean
  t: (key: string, opts?: object) => string
}

const MiniShipRowInner = memo(
  ({
    ship,
    $ship,
    labelStatus,
    enableAvatar,
    shipAvatarColor,
    compact,
    t,
  }: MiniShipRowInnerProps) => {
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
            <Slotitems shipId={ship.api_id as number} />
          </ShipTooltip>
        }
      >
        <ShipItem
          className="ship-item"
          avatar={enableAvatar}
          shipName={!hideShipName}
          data-master-id={ship.api_ship_id as number}
          data-ship-id={ship.api_id as number}
        >
          {enableAvatar && (
            <>
              <ShipAvatar
                mstId={$ship?.api_id}
                isDamaged={hpPercentage <= 50}
                useDefaultBG={false}
                useFixedWidth={false}
                height={38}
              />
              <Gradient color={shipAvatarColor} />
            </>
          )}
          {hideShipName && (
            <ShipLvAvatar className="ship-lv-avatar">
              {level && t('main:Lv', { level })}
            </ShipLvAvatar>
          )}
          {!hideShipName && (
            <>
              <ShipName
                className="ship-name"
                style={enableAvatar ? undefined : labelStatusStyle}
                avatar={enableAvatar}
              >
                {$ship?.api_name
                  ? t(`resources:${$ship.api_name}`, { keySeparator: 'chiba' })
                  : '??'}
              </ShipName>
              <ShipLvText
                className="ship-lv-text"
                style={enableAvatar ? undefined : labelStatusStyle}
                avatar={enableAvatar}
              >
                {level && t('main:Lv', { level })}
              </ShipLvText>
            </>
          )}
          <ShipHP className="ship-hp" style={labelStatusStyle}>
            {apiNowhp} / {apiMaxhp}
          </ShipHP>
          <StatusLabelContainer className="status-label">
            <StatusLabel label={labelStatus} />
          </StatusLabelContainer>
          <ShipCond className={'ship-cond ' + getCondStyle(ship.api_cond)}>
            {ship.api_cond}
          </ShipCond>
          <HPProgress className="hp-progress" style={labelStatusStyle}>
            <ProgressBar
              stripes={false}
              // @ts-expect-error custom intent
              intent={getHpStyle(hpPercentage)}
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
        </ShipItem>
      </ShipTile>
    )
  },
  (prev, next) =>
    isEqual(omit(prev, ['ship']), omit(next, ['ship'])) &&
    isEqual(pick(prev.ship, SHIP_PROPS_TO_PICK), pick(next.ship, SHIP_PROPS_TO_PICK)),
)
MiniShipRowInner.displayName = 'MiniShipRowInner'

export const MiniShipRow = ({
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
  const data = useSelector((state: RootState) => selector(state))
  return <MiniShipRowInner {...data} enableAvatar={enableAvatar} compact={compact} t={t} />
}

const LandBaseStatTag = styled(Tag)`
  grid-column: 3 / 4;
  grid-row: 2 / 3;
  font-size: 63% !important;
  text-align: center;
`

const LandBaseState = styled.div`
  grid-column: 4 / 5;
  grid-row: 1 / 3;
  display: flex;
  flex-flow: column nowrap;
  font-size: 14px;
  justify-content: space-between;
  align-self: end;
`

const ShipFP = styled.div<{ avatar?: boolean }>`
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  font-size: 70%;
  z-index: 2;
  ${({ avatar }) =>
    avatar &&
    css`
      text-align: end;
      padding-right: 6px;
      color: white;
      text-shadow: #000 0 0 10px;
    `}
`

const MiniLandbaseSlotitems = styled(LandbaseSlotitems)`
  ${SlotItemContainer} .png {
    height: 32px;
    margin-bottom: -3px;
    margin-left: -5px;
    margin-top: -5px;
    width: 32px;
  }

  ${SlotItemContainer} .svg {
    height: 23px;
    margin-right: 2px;
    width: 26px;
  }
`

const miniSquardSelectorFactory = memoize((squardId: number) =>
  createSelector(
    [landbaseSelectorFactory(squardId), landbaseEquipDataSelectorFactory(squardId)],
    (landbase, equipsData) => ({ landbase, equipsData, squardId }),
  ),
)

export const MiniSquardRow = ({
  squardId,
  enableAvatar,
  compact,
}: {
  squardId: number
  enableAvatar?: boolean
  compact?: boolean
}) => {
  const { t } = useTranslation('main')
  const selector = React.useMemo(() => miniSquardSelectorFactory(squardId), [squardId])
  const { landbase, equipsData } = useSelector((state: RootState) => selector(state))

  const hideShipName = enableAvatar && compact
  const lb = landbase
  const api_action_kind = lb?.api_action_kind ?? 0
  const api_name = lb?.api_name ?? ''
  const tyku = getTyku(equipsData ? [equipsData] : [], api_action_kind)
  return (
    <ShipTile className="ship-tile">
      <ShipItem className="ship-item" avatar={enableAvatar} shipName={!hideShipName} isLBAC>
        {enableAvatar && !!get(equipsData, '0.0.api_slotitem_id') && (
          <>
            <ShipAvatar
              type="equip"
              mstId={equipsData?.[0]?.[0]?.api_slotitem_id}
              height={38}
              useDefaultBG={false}
              useFixedWidth={false}
            />
            <Gradient color={LBAC_STATUS_AVATAR_COLOR[api_action_kind]} />
          </>
        )}
        {hideShipName && (
          <ShipLvAvatar className="ship-lv-avatar">
            {t('main:Fighter Power')}: {tyku.max === tyku.min ? tyku.min : tyku.min + '+'}
          </ShipLvAvatar>
        )}
        {!hideShipName && (
          <>
            <ShipName className="ship-name" avatar={enableAvatar}>
              {api_name}
            </ShipName>
            <ShipFP className="ship-fp" avatar={enableAvatar}>
              {t('main:Fighter Power')}: {tyku.max === tyku.min ? tyku.min : tyku.min + '+'}
            </ShipFP>
          </>
        )}
        <LandBaseStatTag
          className="landbase-status"
          minimal
          intent={LBAC_INTENTS[api_action_kind] as Intent}
        >
          {t(LBAC_STATUS_NAMES[api_action_kind])}
        </LandBaseStatTag>
        <LandBaseState className="ship-stat landbase-stat">
          <ShipStateText>
            <MiniLandbaseSlotitems landbaseId={squardId} isMini />
          </ShipStateText>
        </LandBaseState>
      </ShipItem>
    </ShipTile>
  )
}
