import { join } from 'path-extra'
import classNames from 'classnames'
import { connect } from 'react-redux'
import shallowEqual from 'fbjs/lib/shallowEqual'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { createSelector } from 'reselect'
import { isEqual, pick, omit, memoize, get } from 'lodash'
import FontAwesome from 'react-fontawesome'
import { translate } from 'react-i18next'
import { Tag, ProgressBar, Intent, Position } from '@blueprintjs/core'

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
} from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipEquipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  escapeStatusSelectorFactory,
  landbaseSelectorFactory,
  landbaseEquipDataSelectorFactory,
} from 'views/utils/selectors'

import { Tooltip } from './panel-tooltip'

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
    const tooltipClassName = classNames('item-name', {
      hidden: !equipsData,
    })
    return (
      <div className={tooltipClassName}>
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
            const onslotClassName = classNames('slotitems-onslot', {
              show: isAircraft,
              hide: !isAircraft,
            })
            return (
              <div key={equipIdx} className="slotitem-container-mini">
                <SlotitemIcon
                  key={equip.api_id}
                  className="slotitem-img"
                  slotitemId={equipIconId}
                />
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {$equip ? t(`resources:${$equip.api_name}`, { keySeparator: '%%%%' }) : '???'}
                </span>
                {Boolean(level) && (
                  <strong style={{ color: '#45A9A5' }}>
                    {' '}
                    <FontAwesome name="star" />
                    {level}
                  </strong>
                )}
                <span style={{ width: '1ex', display: 'inline-block' }} />
                {proficiency && (
                  <img
                    className="alv-img"
                    src={join('assets', 'img', 'airplane', `alv${proficiency}.png`)}
                  />
                )}
                <Tag
                  className={onslotClassName}
                  intent={onslotWarning ? Intent.WARNING : Intent.SUCCESS}
                >
                  {onslotText}
                </Tag>
              </div>
            )
          })}
        </div>
      </div>
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
    const hpPercentage = ship.api_nowhp / ship.api_maxhp * 100
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
    const shipInfoClass = classNames('ship-info', {
      'ship-avatar-padding': enableAvatar,
      'ship-info-hidden': hideShipName,
      'ship-info-show': !hideShipName,
    })
    return (

      <Tooltip
        position={Position.RIGHT_TOP}
        disabled={get(ship, ['api_slot', 0], -1) === -1 && ship.api_slot_ex <= 0}
        className="ship-tile"
        targetTagName="div"
        targetClassName="ship-item-wrapper"
        wrapperTagName="div"
        content={
          <div className="ship-pop">
            <Slotitems shipId={ship.api_id} />
          </div>
        }
      >
        <div className="ship-item">
          {enableAvatar && (
            <Avatar mstId={$ship.api_id} isDamaged={hpPercentage <= 50} height={33}>
              {compact && (
                <div className="ship-lv-avatar">{level && t('main:Lv', { level })}</div>
              )}
            </Avatar>
          )}
          <Tooltip
            position={Position.TOP_LEFT}
            wrapperTagName="div"
            className={shipInfoClass}

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
            <div className="ship-name-container">
              {!hideShipName && (
                  <>
                    <span className="ship-name" style={labelStatusStyle}>
                      {$ship.api_name ? t(`resources:${$ship.api_name}`) : '??'}
                    </span>
                    <span className="ship-lv-text top-space" style={labelStatusStyle}>
                      {level && t('main:Lv', { level })}
                    </span>
                  </>
              )}
            </div>
          </Tooltip>
          <div className="ship-stat">
            <div className="div-row">
              <span className="ship-hp" style={labelStatusStyle}>
                {ship.api_nowhp} / {ship.api_maxhp}
              </span>
              <div className="status-label">
                <StatusLabel label={labelStatus} />
              </div>
              <div className={'ship-cond ' + getCondStyle(ship.api_cond)}>
                <FontAwesome name="star" />
                {ship.api_cond}
              </div>
            </div>
            <span className="hp-progress top-space" style={labelStatusStyle}>
              <ProgressBar
                stripes={false}
                intent={getHpStyle(hpPercentage)}
                value={hpPercentage / 100}
              />
            </span>
          </div>
        </div>
      </Tooltip>
    )
  }
}

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
    const statuslabel = (() => {
      switch (api_action_kind) {
      // 0=待機, 1=出撃, 2=防空, 3=退避, 4=休息
      case 0:
        return <Tag className="landbase-status" minimal intent={Intent.NONE}>{t('main:Standby')}</Tag>
      case 1:
        return <Tag className="landbase-status" minimal intent={Intent.DANGER}>{t('main:Sortie')}</Tag>
      case 2:
        return <Tag className="landbase-status" minimal intent={Intent.WARNING}>{t('main:Defense')}</Tag>
      case 3:
        return <Tag className="landbase-status" minimal intent={Intent.PRIMARY}>{t('main:Retreat')}</Tag>
      case 4:
        return <Tag className="landbase-status" minimal intent={Intent.SUCCESS}>{t('main:Rest')}</Tag>
      }
    })()
    const shipInfoClass = classNames('ship-info', {
      'ship-avatar-padding': enableAvatar,
      'ship-info-hidden': hideShipName,
      'ship-info-show': !hideShipName,
    })
    return (
      <div className="ship-tile">
        <div className="ship-item">
          {enableAvatar &&
            !!get(equipsData, '0.0.api_slotitem_id') && (
            <Avatar type="equip" mstId={get(equipsData, '0.0.api_slotitem_id')} height={33}>
              {compact && (
                <div className="ship-lv-avatar">
                  {statuslabel}
                  <div className="ship-fp">
                    {tyku.max === tyku.min ? tyku.min : tyku.min + '+'}
                  </div>
                </div>
              )}
            </Avatar>
          )}
          <div className={shipInfoClass}>
            {!hideShipName && (
              <>
                <span className="ship-name">{api_name}</span>
                <span className="ship-lv-text top-space">
                  <div className="ship-fp">
                    {t('main:Fighter Power')}: {tyku.max === tyku.min ? tyku.min : tyku.min + '+'}
                  </div>
                  {statuslabel}
                </span>
              </>
            )}
          </div>
          <div className="ship-stat landbase-stat">
            <div className="div-row">
              <LandbaseSlotitems landbaseId={squardId} isMini={true} />
            </div>
          </div>
        </div>
      </div>
    )
  }),
)
