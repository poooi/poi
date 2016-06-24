import {relative, join} from 'path-extra'
import classNames from 'classnames'
import {connect} from 'react-redux'
import {createSelector} from 'reselect'
const {_, $, $$, React, ReactBootstrap, ROOT, FontAwesome, toggleModal} = window
const {$ships, $shipTypes, _ships} = window
const {Button, ButtonGroup} = ReactBootstrap
const {ProgressBar, OverlayTrigger, Tooltip, Alert, Overlay, Label, Panel, Popover} = ReactBootstrap
const __ = i18n.main.__.bind(i18n.main)
const __n = i18n.main.__n.bind(i18n.main)
import StatusLabel from './statuslabel'
import {SlotitemIcon} from '../etc/icon'

import {equipIsAircraft, getShipLabelStatus, getHpStyle, getStatusStyle, getShipLabelStatu} from './utils'

function getFontStyle(theme) {
  return window.isDarkTheme ? {color: '#FFF'} : {color: '#000'}
}

const Slotitems  = connect(
  () => createSelector([
      makeThisShipDataSelector(),
      makeThisShipEquipDataSelector(),
      constSelector,
    ], ([ship, $ship]=[], equipsData) => ({
      ship: ship || {},
      $ship: $ship || {},
      equipsData,
    }))
)(({ship, $ship, equipsData}) => 
  <div className="slotitems-mini" style={{display: "flex", flexFlow: "column"}}>
  {
    equipsData.filter(Boolean).map((equipData, equipIdx) => {
      const [equip, $equip, onslot] = equipData
      const equipIconId = $equip.api_type[3]
      const level = equip.api_level
      const proficiency = equip.api_alv
      const isAircraft = equipIsAircraft(equipIconId)
      const maxOnslot = ($ship.api_maxeq || [])[equipIdx]
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
)

export const MiniShipRow  = connect(
  () => createSelector([
      makeThisShipDataSelector(),
      makeThisShipRepairDockSelector(),
    ], ([ship, $ship]=[], repairDock) => ({
      ship: ship || {},
      $ship: $ship || {},
      repairDock,
      labelStatus: getShipLabelStatus(ship, $ship, repairDock),
    }))
)(({ship, $ship, labelStatus, repair}) => {
  if (!ship)
    return <div></div>
  const labelStatusStyle = getStatusStyle(labelStatus)
  const hasEquips = ship.api_slot.filter((n) => n != -1).length
  const hpPercentage = ship.api_nowhp / ship.api_maxhp * 100
  const tooltipClassName = classNames("ship-pop", {
    "hidden": !hasEquips,
  })
  return (
    <div className="ship-tile">
      <OverlayTrigger
        placement={((!window.doubleTabbed) && (window.layout == 'vertical')) ? 'left' : 'right'} 
        overlay={
          <Tooltip id={`ship-pop-${ship.api_id}`} className={tooltipClassName}>
            <div className="item-name">
              <Slotitems shipId={ship.api_id} />
            </div>
          </Tooltip>
      }>
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
})
