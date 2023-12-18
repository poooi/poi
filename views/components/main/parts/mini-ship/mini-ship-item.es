import { join } from 'path-extra'
import { connect } from 'react-redux'
import shallowEqual from 'fbjs/lib/shallowEqual'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { createSelector } from 'reselect'
import { isEqual, pick, omit, memoize, get } from 'lodash'
import FontAwesome from 'react-fontawesome'
import { withNamespaces } from 'react-i18next'
import { Tag, ProgressBar, Intent, Position, Tooltip } from '@blueprintjs/core'
import styled, { css } from 'styled-components'

import { StatusLabel } from 'views/components/ship-parts/statuslabel'
import { LandbaseSlotitems } from 'views/components/ship/slotitems'
import { SlotitemIcon } from 'views/components/etc/icon'
import { Avatar } from 'views/components/etc/avatar'

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

import { SlotItemContainer, ALevel } from 'views/components/ship-parts/styled-components'

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

const ItemName = styled.div`
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
  color: '#45A9A5';
  margin-left: 1em;
  margin-right: 1em;
`

const OnSlot = styled(Tag)`
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

const slotitemsDataSelectorFactory = memoize((shipId) =>
  createSelector(
    [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
    ([ship, $ship] = [], equipsData) => ({
      api_maxeq: ($ship || {}).api_maxeq,
      equipsData,
    }),
  ),
)

const Slotitems = withNamespaces(['resources'])(
  connect((state, { shipId }) => slotitemsDataSelectorFactory(shipId)(state))(function ({
    api_maxeq,
    equipsData,
    t,
  }) {
    return (
      <ItemName className="item-name" hide={!equipsData}>
        <div className="slotitems-mini" style={{ display: 'flex', flexFlow: 'column' }}>
          {equipsData.filter(Boolean).map((equipData, equipIdx) => {
            const [equip, $equip, onslot] = equipData
            const equipIconId = $equip.api_type[3]
            const level = equip.api_level
            const proficiency = equip.api_alv
            const isAircraft = equipIsAircraft($equip)
            const maxOnslot = (api_maxeq || [])[equipIdx]
            const onslotText = onslot
            const onslotWarning = maxOnslot && onslot < maxOnslot
            return (
              <SlotItemContainerMini key={equipIdx} className="slotitem-container-mini">
                <SlotitemIcon
                  key={equip.api_id}
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
                    src={join('assets', 'img', 'airplane', `alv${proficiency}.png`)}
                  />
                )}
                <OnSlot
                  className="slotitems-onslot"
                  hide={!isAircraft}
                  intent={onslotWarning ? Intent.WARNING : Intent.SUCCESS}
                >
                  {onslotText}
                </OnSlot>
              </SlotItemContainerMini>
            )
          })}
        </div>
      </ItemName>
    )
  }),
)

const miniShipRowDataSelectorFactory = memoize((shipId) =>
  createSelector(
    [
      shipDataSelectorFactory(shipId),
      shipRepairDockSelectorFactory(shipId),
      escapeStatusSelectorFactory(shipId),
      fcdShipTagColorSelector,
      (state) => get(state, 'config.poi.appearance.avatarType'),
    ],
    ([ship, $ship] = [], repairDock, escaped, shipTagColor, avatarType) => {
      return {
        ship: ship || {},
        $ship: $ship || {},
        labelStatus: getShipLabelStatus(ship, $ship, repairDock, escaped),
        shipAvatarColor: selectShipAvatarColor(ship, $ship, shipTagColor, avatarType),
      }
    },
  ),
)

// Remember to expand the list in case you add new properties to display
const SHIP_PROPS_TO_PICK = [
  'api_lv',
  'api_exp',
  'api_id',
  'api_nowhp',
  'api_maxhp',
  'api_cond',
  'api_slot',
  'api_slot_ex',
]

const ShipTooltip = styled.div`
  font-size: 13px;
  white-space: nowrap;

  .material-icon {
    margin-right: auto;
  }
`

const ShipItem = styled.div`
  align-items: start;
  display: grid;
  flex: 1;
  flex-flow: row nowrap;
  overflow: hidden;
  position: relative;
  white-space: nowrap;
  ${({ avatar = true, shipName = true, isLBAC = false }) => {
    const avatarWidth = avatar ? '50px' : 0
    const nameWidth = shipName ? 'minmax(35px, 95px)' : isLBAC ? '1fr' : '15px'
    const dataWidth = isLBAC ? '32px 120px' : 'minmax(70px, 5fr) 18px 42px'
    return css`
      grid-template-columns: ${avatarWidth} ${nameWidth} ${dataWidth};
      grid-template-rows: 20px 13px;
      grid-column-gap: 6px;
      grid-row-gap: 5px;
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

const ShipName = styled.div`
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
      text-shadow: #000000 0px 0px 10px;
    `}
`

const ShipLvText = styled.div`
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
      text-shadow: #000000 0px 0px 10px;
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

const Gradient = styled.div`
  z-index: 1;
  grid-row: 1 / 3;
  grid-column: 2 / 3;
  height: 100%;

  ${({ color }) => css`
    background: linear-gradient(to right, transparent, ${color});
  `}
`

@withNamespaces(['resources', 'main'])
@connect((state, { shipId }) => miniShipRowDataSelectorFactory(shipId))
export class MiniShipRow extends Component {
  static propTypes = {
    ship: PropTypes.object,
    $ship: PropTypes.object,
    labelStatus: PropTypes.number,
    enableAvatar: PropTypes.bool,
    compact: PropTypes.bool,
    shipAvatarColor: PropTypes.string,
  }

  shouldComponentUpdate(nextProps) {
    return (
      !shallowEqual(omit(this.props, ['ship']), omit(nextProps, ['ship'])) ||
      !isEqual(pick(this.props.ship, SHIP_PROPS_TO_PICK), pick(nextProps.ship, SHIP_PROPS_TO_PICK))
    )
  }

  render() {
    const { ship, $ship, labelStatus, enableAvatar, shipAvatarColor, compact, t } = this.props
    const hideShipName = enableAvatar && compact
    if (!ship) return <div />
    const labelStatusStyle = getStatusStyle(labelStatus)
    const hpPercentage = (ship.api_nowhp / ship.api_maxhp) * 100
    const level = ship.api_lv
    const remodelLevel = $ship.api_afterlv
    const exp = (ship.api_exp || [])[0]
    const nextExp = (ship.api_exp || [])[1]
    const remodelString =
      level < remodelLevel
        ? t('main:RemodelLv', { remodelLevel })
        : remodelLevel
        ? t('main:RemodelReady')
        : ''
    return (
      <ShipTile
        as={Tooltip}
        position={Position.RIGHT_TOP}
        disabled={get(ship, ['api_slot', 0], -1) === -1 && ship.api_slot_ex <= 0}
        className="ship-tile"
        targetTagName="div"
        targetClassName="ship-item-wrapper"
        wrapperTagName="div"
        content={
          <ShipTooltip className="ship-pop">
            <Slotitems shipId={ship.api_id} />
          </ShipTooltip>
        }
      >
        <ShipItem
          className="ship-item"
          avatar={enableAvatar}
          shipName={!hideShipName}
          data-master-id={ship.api_ship_id}
          data-ship-id={ship.api_id}
        >
          {enableAvatar && (
            <>
              <ShipAvatar
                mstId={$ship.api_id}
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
                style={enableAvatar ? null : labelStatusStyle}
                avatar={enableAvatar}
              >
                {$ship.api_name
                  ? t(`resources:${$ship.api_name}`, { keySeparator: 'chiba' })
                  : '??'}
              </ShipName>
              <ShipLvText
                className="ship-lv-text"
                style={enableAvatar ? null : labelStatusStyle}
                avatar={enableAvatar}
              >
                {level && t('main:Lv', { level })}
              </ShipLvText>
            </>
          )}
          <ShipHP className="ship-hp" style={labelStatusStyle}>
            {ship.api_nowhp} / {ship.api_maxhp}
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
              intent={getHpStyle(hpPercentage)}
              value={hpPercentage / 100}
            />
          </HPProgress>
          <ShipInfo
            as={Tooltip}
            className="ship-info"
            position={Position.TOP_LEFT}
            wrapperTagName="div"
            targetTagName="div"
            content={
              hideShipName ? (
                <div className="ship-tooltip-info">
                  <div>{$ship.api_name ? t(`resources:${$ship.api_name}`) : '??'}</div>
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
  }
}

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

const ShipFP = styled.div`
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
      text-shadow: #000000 0px 0px 10px;
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

export const MiniSquardRow = withNamespaces(['main'])(
  connect((state, { squardId }) =>
    createSelector(
      [landbaseSelectorFactory(squardId), landbaseEquipDataSelectorFactory(squardId)],
      (landbase, equipsData) => ({
        landbase,
        equipsData,
        squardId,
      }),
    ),
  )(({ landbase, equipsData, squardId, enableAvatar, compact, t }) => {
    const hideShipName = enableAvatar && compact
    const { api_action_kind, api_name } = landbase
    const tyku = getTyku([equipsData], api_action_kind)
    return (
      <ShipTile className="ship-tile">
        <ShipItem className="ship-item" avatar={enableAvatar} shipName={!hideShipName} isLBAC>
          {enableAvatar && !!get(equipsData, '0.0.api_slotitem_id') && (
            <>
              <ShipAvatar
                type="equip"
                mstId={get(equipsData, '0.0.api_slotitem_id')}
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
            intent={LBAC_INTENTS[api_action_kind]}
          >
            {t(LBAC_STATUS_NAMES[api_action_kind])}
          </LandBaseStatTag>
          <LandBaseState className="ship-stat landbase-stat">
            <ShipStateText>
              <MiniLandbaseSlotitems landbaseId={squardId} isMini={true} />
            </ShipStateText>
          </LandBaseState>
        </ShipItem>
      </ShipTile>
    )
  }),
)
