import { join } from 'path-extra'
import { connect } from 'react-redux'
import shallowEqual from 'fbjs/lib/shallowEqual'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { createSelector } from 'reselect'
import { isEqual, pick, omit, memoize, get } from 'lodash'
import FontAwesome from 'react-fontawesome'
import { translate } from 'react-i18next'
import { Tag, ProgressBar, Intent, Position } from '@blueprintjs/core'
import styled, { css } from 'styled-components'

import { StatusLabel } from 'views/components/ship-parts/statuslabel'
import { LandbaseSlotitems } from 'views/components/ship/slotitems'
import { SlotitemIcon } from 'views/components/etc/icon'
import { Avatar } from 'views/components/etc/avatar'

import {
  getCondStyle,
  equipIsAircraft,
  getShipLabelStatus,
  getHpStyle,
  getStatusStyle,
  getTyku,
  LBAC_INTENTS,
  LBAC_STATUS_NAMES,
} from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipEquipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  escapeStatusSelectorFactory,
  landbaseSelectorFactory,
  landbaseEquipDataSelectorFactory,
} from 'views/utils/selectors'

import { Tooltip } from 'views/components/etc/panel-tooltip'
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

const slotitemsDataSelectorFactory = memoize(shipId =>
  createSelector(
    [shipDataSelectorFactory(shipId), shipEquipDataSelectorFactory(shipId)],
    ([ship, $ship] = [], equipsData) => ({
      api_maxeq: ($ship || {}).api_maxeq,
      equipsData,
    }),
  ),
)

const Slotitems = translate(['resources'])(
  connect((state, { shipId }) => slotitemsDataSelectorFactory(shipId)(state))(function({
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

const miniShipRowDataSelectorFactory = memoize(shipId =>
  createSelector(
    [
      shipDataSelectorFactory(shipId),
      shipRepairDockSelectorFactory(shipId),
      escapeStatusSelectorFactory(shipId),
    ],
    ([ship, $ship] = [], repairDock, escaped) => {
      return {
        ship: ship || {},
        $ship: $ship || {},
        labelStatus: getShipLabelStatus(ship, $ship, repairDock, escaped),
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

  .material-icon {
    margin-right: auto;
  }
`

const ShipItem = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-flow: row nowrap;
  overflow: hidden;
  position: relative;
`

const ShipLvAvatar = styled.div`
  bottom: 0;
  display: flex;
  filter: drop-shadow(0 0 2px black);
  font-size: 70%;
  left: 0;
  line-height: 1;
  position: absolute;
  text-shadow: 0 0 2px rgba(0, 0, 0, 1);
  white-space: nowrap;
`

const ShipNameContainer = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
`

const ShipInfo = styled.div`
  display: flex;
  flex-basis: 0;
  flex-flow: column nowrap;
  font-size: 14px;
  justify-content: space-between;
  min-width: 0;
  z-index: 1;
  flex-grow: 1;
  flex-shrink: 0;
  ${({ avatar }) =>
    avatar &&
    css`
      flex-basis: 61px;

      & > .bp3-popover-target {
        height: 100%;
      }

      ${ShipNameContainer} {
        height: 100%;
        padding-left: 58px;
      }
    `}
  ${({ hideInfo }) =>
    hideInfo &&
    css`
      flex-grow: 0;
      flex-shrink: 0;
      height: 37px;
    `}
`

const ShipName = styled.div`
  height: 20px;
  margin-right: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ShipLvText = styled.div`
  display: flex;
  font-size: 70%;
  height: 13px;
  line-height: 1;
  margin-right: 4px;
  margin-top: 2px;
  overflow: hidden;
  align-items: center;
  margin-top: 5px;
`

const ShipState = styled.div`
  display: flex;
  flex-basis: 0;
  flex-flow: column nowrap;
  flex-grow: 2;
  flex-shrink: 1;
  font-size: 14px;
  justify-content: space-between;
`

const ShipStateText = styled.div`
  display: flex;
`

const ShipHP = styled.span`
  align-self: flex-start;
  flex-basis: 60px;
  flex-grow: 1;
  flex-shrink: 0;
`

const StatusLabelContainer = styled.div`
  display: inline-block;
  flex-basis: 20px;
  flex-grow: 0;
  flex-shrink: 1;
  margin-left: 5px;
  margin-top: -1px;
  position: relative;
  text-align: center;
  vertical-align: middle;
  z-index: 100;
`

const ShipCond = styled.div`
  align-self: flex-end;
  flex-basis: inherit;
  flex-flow: nowrap;
  flex-grow: 0;
  flex-shrink: 1;
  width: 30px;
  text-align: right;
  white-space: nowrap;
`

const HPProgress = styled.div`
  flex: 1;
  margin-top: 5px;
  .bp3-progress-bar {
    flex: auto;
    height: 7px;
  }
`

export const ShipAvatar = styled(Avatar)`
  position: absolute;
  z-index: 10;
  pointer-events: none;
`

@translate(['resources', 'main'])
@connect((state, { shipId }) => miniShipRowDataSelectorFactory(shipId))
export class MiniShipRow extends Component {
  static propTypes = {
    ship: PropTypes.object,
    $ship: PropTypes.object,
    labelStatus: PropTypes.number,
    enableAvatar: PropTypes.bool,
    compact: PropTypes.bool,
  }

  shouldComponentUpdate(nextProps) {
    return (
      !shallowEqual(omit(this.props, ['ship']), omit(nextProps, ['ship'])) ||
      !isEqual(pick(this.props.ship, SHIP_PROPS_TO_PICK), pick(nextProps.ship, SHIP_PROPS_TO_PICK))
    )
  }

  render() {
    const { ship, $ship, labelStatus, enableAvatar, compact, t } = this.props
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
        <ShipItem className="ship-item">
          {enableAvatar && (
            <ShipAvatar mstId={$ship.api_id} isDamaged={hpPercentage <= 50} height={33}>
              {compact && (
                <ShipLvAvatar className="ship-lv-avatar">
                  {level && t('main:Lv', { level })}
                </ShipLvAvatar>
              )}
            </ShipAvatar>
          )}
          <ShipInfo
            as={Tooltip}
            className="ship-info"
            avatar={enableAvatar}
            hideInfo={hideShipName}
            position={Position.TOP_LEFT}
            wrapperTagName="div"
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
            <ShipNameContainer className="ship-name-container">
              {!hideShipName && (
                <>
                  <ShipName className="ship-name" style={labelStatusStyle}>
                    {$ship.api_name ? t(`resources:${$ship.api_name}`) : '??'}
                  </ShipName>
                  <ShipLvText className="ship-lv-text" style={labelStatusStyle}>
                    {level && t('main:Lv', { level })}
                  </ShipLvText>
                </>
              )}
            </ShipNameContainer>
          </ShipInfo>
          <ShipState className="ship-stat">
            <ShipStateText className="div-row">
              <ShipHP className="ship-hp" style={labelStatusStyle}>
                {ship.api_nowhp} / {ship.api_maxhp}
              </ShipHP>
              <StatusLabelContainer className="status-label">
                <StatusLabel label={labelStatus} />
              </StatusLabelContainer>
              <ShipCond className={'ship-cond ' + getCondStyle(ship.api_cond)}>
                {ship.api_cond}
              </ShipCond>
            </ShipStateText>
            <HPProgress className="hp-progress" style={labelStatusStyle}>
              <ProgressBar
                stripes={false}
                intent={getHpStyle(hpPercentage)}
                value={hpPercentage / 100}
              />
            </HPProgress>
          </ShipState>
        </ShipItem>
      </ShipTile>
    )
  }
}

const ShipTile = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
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
  padding-top: 0;
  padding-bottom: 0;
`

const LandBaseState = styled(ShipState)`
  flex-basis: 110px;
  flex-grow: 0;
  min-width: 110px;
  width: 110px;
`

const ShipFP = styled.div`
  flex-grow: 1;
`

const MiniLandbaseSlotitems = styled(LandbaseSlotitems)`
  padding-top: 6px;

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

export const MiniSquardRow = translate(['main'])(
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
        <ShipItem className="ship-item">
          {enableAvatar && !!get(equipsData, '0.0.api_slotitem_id') && (
            <ShipAvatar type="equip" mstId={get(equipsData, '0.0.api_slotitem_id')} height={33}>
              {compact && (
                <ShipLvAvatar className="ship-lv-avatar">
                  <LandBaseStatTag
                    className="landbase-status"
                    minimal
                    intent={LBAC_INTENTS[api_action_kind]}
                  >
                    {t(LBAC_STATUS_NAMES[api_action_kind])}
                  </LandBaseStatTag>
                  <ShipFP className="ship-fp">
                    {tyku.max === tyku.min ? tyku.min : tyku.min + '+'}
                  </ShipFP>
                </ShipLvAvatar>
              )}
            </ShipAvatar>
          )}
          <ShipInfo className="ship-info" avatar={enableAvatar} hideInfo={hideShipName}>
            {!hideShipName && (
              <ShipNameContainer>
                <ShipName className="ship-name">{api_name}</ShipName>
                <ShipLvText className="ship-lv-text">
                  <ShipFP className="ship-fp">
                    {t('main:Fighter Power')}: {tyku.max === tyku.min ? tyku.min : tyku.min + '+'}
                  </ShipFP>
                  <LandBaseStatTag
                    className="landbase-status"
                    minimal
                    intent={LBAC_INTENTS[api_action_kind]}
                  >
                    {t(LBAC_STATUS_NAMES[api_action_kind])}
                  </LandBaseStatTag>
                </ShipLvText>
              </ShipNameContainer>
            )}
          </ShipInfo>
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
