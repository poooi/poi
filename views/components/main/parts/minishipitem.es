import { join } from 'path-extra'
import classNames from 'classnames'
import { connect } from 'react-redux'
import shallowCompare from 'react-addons-shallow-compare'
import { Component } from 'react'
import { createSelector } from 'reselect'
import { ProgressBar, OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { isEqual, pick } from 'lodash'

const __ = i18n.main.__.bind(i18n.main)
const __n = i18n.main.__n.bind(i18n.main)

import StatusLabel from '../../ship-parts/statuslabel'
import { SlotitemIcon } from '../../etc/icon'

import { equipIsAircraft, getShipLabelStatus, getHpStyle, getStatusStyle, getShipLabelStatu } from '../../ship-parts/utils'

const Slotitems  = connect(
  () => createSelector([
      makeThisShipDataSelector(),
      makeThisShipEquipDataSelector(),
    ], ([ship, $ship]=[], equipsData) => ({
      api_id: (ship || {}).api_id,
      api_maxeq: ($ship || {}).api_maxeq,
      equipsData,
    }))
)(function ({api_id, api_maxeq, equipsData}) {
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

export const MiniShipRow = connect(
  () => createSelector([
      makeThisShipDataSelector(),
      makeThisShipRepairDockSelector(),
    ], ([ship, $ship]=[], repairDock) => ({
      ship: ship || {},
      $ship: $ship || {},
      labelStatus: getShipLabelStatus(ship, $ship, repairDock),
    }))
)(class extends Component {
  shouldComponentUpdate(nextProps) {
    // Remember to expand the list in case you add new properties to display
    const shipPickProps = ['api_lv', 'api_exp', 'api_id', 'api_nowhp', 'api_maxhp', 'api_cond']
    return shallowCompare(this, nextProps) &&
      (!isEqual(pick(this.props.ship, shipPickProps), pick(nextProps.ship, shipPickProps)) ||
      !isEqual(this.props.labelStatus, nextProps.labelStatus))
  }

  render() {
    const {ship, $ship, labelStatus} = this.props
    if (!ship)
      return <div></div>
    const labelStatusStyle = getStatusStyle(labelStatus)
    const hpPercentage = ship.api_nowhp / ship.api_maxhp * 100
    return (
      <div className="ship-tile">
        <OverlayTrigger
          placement={((!window.doubleTabbed) && (window.layout == 'vertical')) ? 'left' : 'right'}
          overlay={
            <Tooltip id={`ship-pop-${ship.api_id}`} className='ship-pop'>
              <Slotitems shipId={ship.api_id} />
            </Tooltip>
          }
        >
          <div className="ship-item">
            <OverlayTrigger placement='top' overlay={
              <Tooltip id={`miniship-exp-${ship.api_id}`}>
                Next. {ship.api_exp[1]}
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
                  <span className={"ship-cond " + window.getCondStyle(ship.api_cond)}>
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
