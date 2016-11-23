import { join } from 'path-extra'
import classNames from 'classnames'
import { connect } from 'react-redux'
import shallowEqual from 'fbjs/lib/shallowEqual'
import React, { Component } from 'react'
import { createSelector } from 'reselect'
import { ProgressBar, OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { isEqual, pick, omit, memoize } from 'lodash'

import StatusLabel from 'views/components/ship-parts/statuslabel'
import { SlotitemIcon } from 'views/components/etc/icon'
import { getCondStyle, equipIsAircraft, getShipLabelStatus, getHpStyle, getStatusStyle } from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipEquipDataSelectorFactory,
  shipRepairDockSelectorFactory,
  configLayoutSelector,
  configDoubleTabbedSelector,
  escapeStatusSelectorFactory,
} from 'views/utils/selectors'

const { i18n } = window

const slotitemsDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], ([ship, $ship]=[], equipsData, exslot) => ({
    api_maxeq: ($ship || {}).api_maxeq,
    equipsData,
  }))
)

const Slotitems  = connect(
  (state, {shipId}) =>
    slotitemsDataSelectorFactory(shipId)(state),
)(function ({api_maxeq, equipsData}) {
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
          const isAircraft = equipIsAircraft(equipIconId)
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
              <span className="slotitem-name-mini">
                {i18n.resources.__(($equip || {api_name: '??'}).api_name)}
                {level ? <strong style={{color: '#45A9A5'}}> ★{level}</strong> : ''}
                &nbsp;&nbsp;
                {proficiency &&
                  <img className='alv-img' src={join('assets', 'img', 'airplane', `alv${proficiency}.png`)} />
                }
              </span>
              <Label
                className={onslotClassName}
                bsStyle={`${onslotWarning ? 'warning' : 'default'}`}
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
})

const miniShipRowDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipRepairDockSelectorFactory(shipId),
    escapeStatusSelectorFactory(shipId),
    configLayoutSelector,
    configDoubleTabbedSelector,
  ], ([ship, $ship]=[], repairDock, escaped, layout, doubleTabbed) => ({
    ship: ship || {},
    $ship: $ship || {},
    labelStatus: getShipLabelStatus(ship, $ship, repairDock, escaped),
    layout,
    doubleTabbed,
  }))
)

export const MiniShipRow = connect(
  (state, {shipId}) =>
    miniShipRowDataSelectorFactory(shipId),
)(class miniShipRow extends Component {
  static propTypes = {
    ship: React.PropTypes.object,
    $ship: React.PropTypes.object,
    labelStatus: React.PropTypes.number,
    layout: React.PropTypes.string,
    doubleTabbed: React.PropTypes.bool,
  }

  shouldComponentUpdate(nextProps) {
    // Remember to expand the list in case you add new properties to display
    const shipPickProps = ['api_lv', 'api_exp', 'api_id', 'api_nowhp', 'api_maxhp', 'api_cond', 'api_slot', 'api_slot_ex']
    return !shallowEqual(omit(this.props, ['ship']), omit(nextProps, ['ship'])) ||
      !isEqual(pick(this.props.ship, shipPickProps), pick(nextProps.ship, shipPickProps))
  }

  render() {
    const {ship, $ship, labelStatus, layout, doubleTabbed} = this.props
    if (!ship)
      return <div></div>
    const labelStatusStyle = getStatusStyle(labelStatus)
    const hpPercentage = ship.api_nowhp / ship.api_maxhp * 100
    return (
      <div className="ship-tile">
        <OverlayTrigger
          placement={(!doubleTabbed && layout == 'vertical') ? 'left' : 'right'}
          overlay={
            (ship.api_slot[0] !== -1 || ship.api_slot_ex > 0) ?
            <Tooltip id={`ship-pop-${ship.api_id}`} className='ship-pop'>
              <Slotitems shipId={ship.api_id} />
            </Tooltip>
            : <Tooltip id={`ship-pop-${ship.api_id}`} style={{display: 'none'}}></Tooltip>
          }
        >
          <div className="ship-item">
            <OverlayTrigger placement='top' overlay={
              <Tooltip id={`miniship-exp-${ship.api_id}`}>
                Next. {(ship.api_exp || [])[1]}
              </Tooltip>
            }>
              <div className="ship-info">
                <span className="ship-name" style={labelStatusStyle}>
                  {i18n.resources.__($ship.api_name || '??')}
                </span>
                <span className="ship-lv-text top-space" style={labelStatusStyle}>
                  Lv. {ship.api_lv || '??'}
                </span>
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
                <div style={labelStatusStyle}>
                  <span className={"ship-cond " + getCondStyle(ship.api_cond)}>
                    ★{ship.api_cond}
                  </span>
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
})
