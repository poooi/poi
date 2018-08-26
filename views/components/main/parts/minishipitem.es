import { join } from 'path-extra'
import classNames from 'classnames'
import { connect } from 'react-redux'
import shallowEqual from 'fbjs/lib/shallowEqual'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { createSelector } from 'reselect'
import { ProgressBar, OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { isEqual, pick, omit, memoize, get } from 'lodash'
import FontAwesome from 'react-fontawesome'
import { translate } from 'react-i18next'

import defaultLayout from '../default-layout'
import { StatusLabel } from 'views/components/ship-parts/statuslabel'
import { LandbaseSlotitems } from 'views/components/ship/slotitems'
import { SlotitemIcon } from 'views/components/etc/icon'
import { Avatar } from 'views/components/etc/avatar'
import { getCondStyle, equipIsAircraft, getShipLabelStatus, getHpStyle, getStatusStyle, getTyku } from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipEquipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  configLayoutSelector,
  configReverseLayoutSelector,
  escapeStatusSelectorFactory,
  landbaseSelectorFactory,
  landbaseEquipDataSelectorFactory,
} from 'views/utils/selectors'

const slotitemsDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], ([ship, $ship]=[], equipsData) => ({
    api_maxeq: ($ship || {}).api_maxeq,
    equipsData,
  }))
)

const Slotitems = translate(['resources'])(connect(
  (state, {shipId}) =>
    slotitemsDataSelectorFactory(shipId)(state),
)(function ({api_maxeq, equipsData, t}) {
  const tooltipClassName = classNames("item-name", {
    "hidden": !equipsData,
  })
  return (
    <div className={tooltipClassName}>
      <div className="slotitems-mini" style={{display: "flex", flexFlow: "column"}}>
        {
          equipsData.filter(Boolean).map((equipData, equipIdx) => {
            const [equip, $equip, onslot] = equipData
            const equipIconId = $equip.api_type[3]
            const level = equip.api_level
            const proficiency = equip.api_alv
            const isAircraft = equipIsAircraft($equip)
            const maxOnslot = (api_maxeq || [])[equipIdx]
            const onslotText = onslot
            const onslotWarning = maxOnslot && onslot < maxOnslot
            const onslotClassName = classNames("slotitem-onslot", {
              'show': isAircraft,
              'hide': !isAircraft,
            })
            return (
              <div key={equipIdx} className="slotitem-container-mini">
                <SlotitemIcon key={equip.api_id} className='slotitem-img' slotitemId={equipIconId} />
                <span style={{ flex: 1, textAlign: 'left' }}>{$equip ? t(`resources:${$equip.api_name}`, {keySeparator: '%%%%'}) : '???'}</span>
                {
                  Boolean(level) &&
                  <strong style={{color: '#45A9A5'}}> <FontAwesome name='star' />{level}</strong>
                }
                <span style={{ width: '1ex', display: 'inline-block' }} />
                {
                  proficiency &&
                  <img className='alv-img' src={join('assets', 'img', 'airplane', `alv${proficiency}.png`)} />
                }
                <Label
                  className={onslotClassName}
                  bsStyle={`${onslotWarning ? 'warning' : 'default'}`}
                  style={{ width: '3em' }}
                >
                  {onslotText}
                </Label>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}))

const miniShipRowDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipRepairDockSelectorFactory(shipId),
    escapeStatusSelectorFactory(shipId),
    configLayoutSelector,
    configReverseLayoutSelector,
    state => get(state, 'layout.mainpane.width', 450),
    state => get(state, 'config.poi.mainpanel.layout', defaultLayout),
  ], ([ship, $ship]=[], repairDock, escaped, layout, reversed, mainPanelWidth, mainPanelLayout ) => {
    const miniShipPanelLayout = mainPanelLayout[mainPanelWidth > 750 ? 'lg' : 'sm']
      .find(panel => panel.i === 'miniship')
    const colCnt = mainPanelWidth > 750 ? 20 : 10
    const colWidth = mainPanelWidth / colCnt
    const rightDist = (colCnt - miniShipPanelLayout.x - miniShipPanelLayout.w) * colWidth
    return {
      ship: ship || {},
      $ship: $ship || {},
      labelStatus: getShipLabelStatus(ship, $ship, repairDock, escaped),
      tooltipPos: (layout === 'horizontal' && reversed) || rightDist >= 180 ? 'right' : 'left',
    }
  })
)

@translate(['resources', 'main'])
@connect((state, {shipId}) => miniShipRowDataSelectorFactory(shipId))
export class MiniShipRow extends Component {
  static propTypes = {
    ship: PropTypes.object,
    $ship: PropTypes.object,
    labelStatus: PropTypes.number,
    tooltipPos: PropTypes.string,
    enableAvatar: PropTypes.bool,
    compact: PropTypes.bool,
  }

  shouldComponentUpdate(nextProps) {
    // Remember to expand the list in case you add new properties to display
    const shipPickProps = ['api_lv', 'api_exp', 'api_id', 'api_nowhp', 'api_maxhp', 'api_cond', 'api_slot', 'api_slot_ex']
    return !shallowEqual(omit(this.props, ['ship']), omit(nextProps, ['ship'])) ||
      !isEqual(pick(this.props.ship, shipPickProps), pick(nextProps.ship, shipPickProps))
  }

  render() {
    const { ship, $ship, labelStatus, tooltipPos, enableAvatar, compact, t } = this.props
    const hideShipName = enableAvatar && compact
    if (!ship)
      return <div></div>
    const labelStatusStyle = getStatusStyle(labelStatus)
    const hpPercentage = ship.api_nowhp / ship.api_maxhp * 100
    const level = ship.api_lv
    const remodelLevel = $ship.api_afterlv
    const exp = (ship.api_exp || [])[0]
    const nextExp = (ship.api_exp || [])[1]
    const remodelString = level < remodelLevel ? t('main:RemodelLv', { remodelLevel }) : remodelLevel ? t('main:RemodelReady') : null
    const shipInfoClass = classNames("ship-info", {
      "ship-avatar-padding": enableAvatar,
      "ship-info-hidden": hideShipName,
      "ship-info-show": !hideShipName,
    })
    return (
      <div className="ship-tile">
        <OverlayTrigger
          placement={tooltipPos}
          overlay={
            (( ship.api_slot && ship.api_slot[0] !== -1) || ship.api_slot_ex > 0) ?
              <Tooltip id={`ship-pop-${ship.api_id}`} className='ship-pop'>
                <Slotitems shipId={ship.api_id} />
              </Tooltip>
              : <Tooltip id={`ship-pop-${ship.api_id}`} style={{display: 'none'}}></Tooltip>
          }
        >
          <div className="ship-item">
            { enableAvatar && (
              <Avatar mstId={$ship.api_id} isDamaged={hpPercentage <= 50} height={33}>
                {compact && <div className='ship-lv-avatar'>{level && t('main:Lv', { level })}</div>}
              </Avatar>
            ) }
            <OverlayTrigger placement='top' overlay={
              <Tooltip id={`miniship-exp-${ship.api_id}`}>
                {
                  hideShipName ? (
                    <div className="ship-tooltip-info">
                      <div>
                        {$ship.api_name ? t(`resources:${$ship.api_name}`) : '??'}
                      </div>
                      <div>
                        {level && t('main:Lv', { level })}
                      </div>
                      {exp > 0 && <div>{t('main:TotalExp', { exp })}</div>}
                      {nextExp > 0 && <div>{t('main:NextExp', { nextExp })}</div>}
                      {remodelString && <div>{remodelString}</div>}
                    </div>
                  ) : <div>
                    {exp > 0 && <div>{t('main:TotalExp', { exp })}</div>}
                    {nextExp > 0 && <div>{t('main:NextExp', { nextExp })}</div>}
                    {remodelString && <div>{remodelString}</div>}
                  </div>
                }
              </Tooltip>
            }>
              <div className={shipInfoClass}>
                {
                  !hideShipName && (
                    <>
                      <span className="ship-name" style={labelStatusStyle}>
                        {$ship.api_name ? t(`resources:${$ship.api_name}`) : '??'}
                      </span>
                      <span className="ship-lv-text top-space" style={labelStatusStyle}>
                        {level && t('main:Lv', { level })}
                      </span>
                    </>
                  )
                }
              </div>
            </OverlayTrigger>
            <div className="ship-stat">
              <div className="div-row">
                <span className="ship-hp" style={labelStatusStyle}>
                  {ship.api_nowhp} / {ship.api_maxhp}
                </span>
                <div className="status-label">
                  <StatusLabel label={labelStatus} />
                </div>
                <div className={"ship-cond " + getCondStyle(ship.api_cond)}>
                  <FontAwesome name='star' />{ship.api_cond}
                </div>
              </div>
              <span className="hp-progress top-space" style={labelStatusStyle}>
                <ProgressBar bsStyle={getHpStyle(hpPercentage)} now={hpPercentage} />
              </span>
            </div>
          </div>
        </OverlayTrigger>
      </div>
    )
  }
}

export const MiniSquardRow = translate(['main'])(connect((state, { squardId }) =>
  createSelector([
    landbaseSelectorFactory(squardId),
    landbaseEquipDataSelectorFactory(squardId),
  ], (landbase, equipsData) => ({
    landbase,
    equipsData,
    squardId,
  }))
)(({landbase, equipsData, squardId, enableAvatar, compact, t}) => {
  const hideShipName = enableAvatar && compact
  const { api_action_kind, api_name } = landbase
  const tyku = getTyku([equipsData], api_action_kind)
  const statuslabel = (() => {
    switch (api_action_kind) {
    // 0=待機, 1=出撃, 2=防空, 3=退避, 4=休息
    case 0:
      return <Label bsStyle='default'>{t('main:Standby')}</Label>
    case 1:
      return <Label bsStyle='danger'>{t('main:Sortie')}</Label>
    case 2:
      return <Label bsStyle='warning'>{t('main:Defense')}</Label>
    case 3:
      return <Label bsStyle='primary'>{t('main:Retreat')}</Label>
    case 4:
      return <Label bsStyle='success'>{t('main:Rest')}</Label>
    }
  })()
  const shipInfoClass = classNames("ship-info", {
    "ship-avatar-padding": enableAvatar,
    "ship-info-hidden": hideShipName,
    "ship-info-show": !hideShipName,
  })
  return (
    <div className="ship-tile">
      <div className="ship-item">
        { enableAvatar && !!get(equipsData, '0.0.api_slotitem_id') && (
          <Avatar type='equip' mstId={get(equipsData, '0.0.api_slotitem_id')} height={33}>
            {compact && (
              <div className='ship-lv-avatar'>
                {statuslabel}
                <div className="ship-fp">
                  {(tyku.max === tyku.min) ? tyku.min : tyku.min + '+'}
                </div>
              </div>
            )}
          </Avatar>
        ) }
        <div className={shipInfoClass}>
          {
            !hideShipName && (
              <>
                <span className="ship-name">
                  {api_name}
                </span>
                <span className="ship-lv-text top-space">
                  <div className="ship-fp">
                    {t('main:Fighter Power')}: {(tyku.max === tyku.min) ? tyku.min : tyku.min + '+'}
                  </div>
                  {statuslabel}
                </span>
              </>
            )
          }
        </div>
        <div className="ship-stat landbase-stat">
          <div className="div-row">
            <LandbaseSlotitems landbaseId={squardId} isMini={true} />
          </div>
        </div>
      </div>
    </div>
  )
}))
