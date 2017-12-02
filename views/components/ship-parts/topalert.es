import { connect } from 'react-redux'
import React from 'react'
import PropTypes from 'prop-types'
import { Alert, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { join } from 'path-extra'
import { get, join as joinString, memoize } from 'lodash'
import { createSelector } from 'reselect'

import { CountdownTimer } from 'views/components/main/parts/countdown-timer'
import { CountdownNotifier } from 'views/utils/notifiers'
import { recoveryEndTime } from 'views/redux/timers/cond'
import { getTyku, getSaku25, getSaku25a, getSaku33, getFleetSpeed, getSpeedLabel } from 'views/utils/game-utils'
import {
  fleetInBattleSelectorFactory,
  fleetInExpeditionSelectorFactory,
  fleetShipsDataSelectorFactory,
  fleetShipsDataWithEscapeSelectorFactory,
  fleetShipsEquipDataWithEscapeSelectorFactory,
  fleetNameSelectorFactory,
  basicSelector,
  condTickSelector,
  fleetExpeditionSelectorFactory,
  configSelector,
  miscSelector,
  fleetSlotCountSelectorFactory,
} from 'views/utils/selectors'

const {ROOT, i18n} = window
const __ = i18n.main.__.bind(i18n.main)
const { Component } = React

const getFontStyle = () => {
  if (window.isDarkTheme) {
    return {color: '#FFF'}
  } else {
    return {color: '#000'}
  }
}

class CountdownLabel extends Component {
  constructor(props) {
    super(props)
    this.notifier = new CountdownNotifier()
  }
  static propTypes = {
    fleetId: PropTypes.number,
    completeTime: PropTypes.number,
    shouldNotify: PropTypes.bool,
    fleetName: PropTypes.string,
  }
  shouldComponentUpdate = (nextProps, nextState) => {
    return nextProps.completeTime !== this.props.completeTime
  }
  tick = (timeRemaining) => {
    if (this.props.shouldNotify && this.props.completeTime >= 0)
      this.tryNotify()
  }
  static basicNotifyConfig = {
    type: 'morale',
    title: __('Morale'),
    message: (names) => `${joinString(names, ', ')} ${__('have recovered from fatigue')}`,
    icon: join(ROOT, 'assets', 'img', 'operation', 'sortie.png'),
  }
  tryNotify = () => {
    this.notifier.tryNotify({
      ...CountdownLabel.basicNotifyConfig,
      args: this.props.fleetName,
      completeTime: this.props.completeTime,
    })
  }
  render () {
    return (
      <span className="expedition-timer">
        <CountdownTimer countdownId={`resting-fleet-${this.props.fleetId}`}
          completeTime={this.props.completeTime}
          tickCallback={this.tick} />
      </span>
    )
  }
}

const tykuSelectorFactory = memoize((fleetId) =>
  createSelector(fleetShipsEquipDataWithEscapeSelectorFactory(fleetId),
    (equipsData=[]) =>
      getTyku(equipsData)
  )
)

const admiralLevelSelector = createSelector(basicSelector,
  (basic) => basic.api_level
)

const sakuSelectorFactory = memoize((fleetId) =>
  createSelector([
    fleetShipsDataWithEscapeSelectorFactory(fleetId),
    fleetShipsEquipDataWithEscapeSelectorFactory(fleetId),
    admiralLevelSelector,
    fleetSlotCountSelectorFactory(fleetId),
  ], (shipsData=[], equipsData=[], admiralLevel, slotCount) =>({
    saku25: getSaku25(shipsData, equipsData),
    saku25a: getSaku25a(shipsData, equipsData, admiralLevel),
    saku33: getSaku33(shipsData, equipsData, admiralLevel, 1.0, slotCount),
    saku33x3: getSaku33(shipsData, equipsData, admiralLevel, 3.0, slotCount),
    saku33x4: getSaku33(shipsData, equipsData, admiralLevel, 4.0, slotCount),
  }))
)

const speedSelectorFactory = memoize((fleetId) =>
  createSelector([
    fleetShipsDataWithEscapeSelectorFactory(fleetId),
  ], (shipsData=[]) => getFleetSpeed(shipsData),
  )
)

const topAlertSelectorFactory = memoize((fleetId) =>
  createSelector([
    fleetInBattleSelectorFactory(fleetId),
    fleetInExpeditionSelectorFactory(fleetId),
    fleetShipsDataSelectorFactory(fleetId),
    fleetNameSelectorFactory(fleetId),
    condTickSelector,
    fleetExpeditionSelectorFactory(fleetId),
    tykuSelectorFactory(fleetId),
    sakuSelectorFactory(fleetId),
    speedSelectorFactory(fleetId),
    configSelector,
    miscSelector,
  ], (inBattle, inExpedition, shipsData, fleetName, condTick, expedition, tyku, saku, fleetSpeed, config, {canNotify}) => ({
    inExpedition,
    inBattle,
    shipsData,
    fleetName,
    condTick,
    expeditionEndTime: expedition[2],
    tyku,
    saku,
    fleetSpeed,
    condTarget: get(config, 'poi.notify.morale.value', 49),
    canNotify,
  }))
)
export default connect(
  (state, {fleetId}) =>
    topAlertSelectorFactory(fleetId)(state)
)(function TopAlert(props) {
  const {inExpedition, inBattle, shipsData=[], isMini, fleetId, fleetName,
    condTick, expeditionEndTime, tyku, saku, fleetSpeed, condTarget, canNotify} = props
  const {saku25, saku25a, saku33, saku33x3, saku33x4} = saku
  const {speed} = fleetSpeed
  let totalLv = 0
  let minCond = 100
  shipsData.forEach(([_ship]=[]) => {
    if (_ship) {
      totalLv += _ship.api_lv
      minCond = Math.min(minCond, _ship.api_cond)
    }
  })
  let completeTime
  if (inExpedition) {
    completeTime = expeditionEndTime
  } else {
    const conds = shipsData.map(([ship={api_cond: 0}]=[]) => ship.api_cond)
    completeTime = Math.max.apply(null,
      conds.map((cond) => recoveryEndTime(condTick, cond, condTarget)))
  }
  return (
    <div style={{width: '100%'}}>
      {
        isMini ?
          <div style={{display: "flex", justifyContent: "space-around", width: '100%'}}>
            <span style={{flex: "none"}}>{__(getSpeedLabel(speed))} </span>
            <span style={{flex: "none", marginLeft: 5}}>{__('Fighter Power')}: {(tyku.max === tyku.min) ? tyku.min : tyku.min + '+'}</span>
            <span style={{flex: "none", marginLeft: 5}}>{__('LOS')}: {saku33.total.toFixed(2)}</span>
          </div>
          :
          <Alert style={getFontStyle()}>
            <div style={{display: "flex"}}>
              <span style={{flex: "1"}}>{__(getSpeedLabel(speed))} </span>
              <span style={{flex: 1}}>{__('Total Lv')}. {totalLv}</span>
              <span style={{flex: 1}}>
                <OverlayTrigger placement='bottom' overlay={
                  <Tooltip id={`topalert-FP-fleet-${fleetId}`}>
                    <div>{__('Minimum FP')}: {tyku.min}</div>
                    <div>{__('Maximum FP')}: {tyku.max}</div>
                    <div>{__('Basic FP')}: {tyku.basic}</div>
                  </Tooltip>
                }>
                  <span>{__('Fighter Power')}: {(tyku.max === tyku.min) ? tyku.min : tyku.min + '+'}</span>
                </OverlayTrigger>
              </span>
              <span style={{flex: 1}}>
                <OverlayTrigger placement='bottom' overlay={
                  <Tooltip id={`topalert-recon-fleet-${fleetId}`} className='info-tooltip'>
                    <div className='recon-title'>
                      <span>{__('Formula 33')}</span>
                    </div>
                    <div className='info-tooltip-entry'>
                      <span className='info-tooltip-item'>× 1</span>
                      <span>{saku33.total}</span>
                    </div>
                    <div className='info-tooltip-entry'>
                      <span className='info-tooltip-item'>{`× 3 (6-2 & 6-3)`}</span>
                      <span>{saku33x3.total}</span></div>
                    <div className='info-tooltip-entry'>
                      <span className='info-tooltip-item'>{`× 4 (3-5 & 6-1)`}</span>
                      <span>{saku33x4.total}</span>
                    </div>
                    <div className='recon-title'>
                      <span>{__('Formula 2-5')}</span>
                    </div>
                    <div className='info-tooltip-entry'>
                      <span className='info-tooltip-item'>{__('Fall')}</span>
                      <span>{saku25a.total}</span>
                    </div>
                    <div className='info-tooltip-entry'>
                      <span className='info-tooltip-item'>{__('Legacy')}</span>
                      <span>{saku25.total}</span>
                    </div>
                  </Tooltip>
                }>
                  <span>{__('LOS')}: {saku33.total.toFixed(2)}</span>
                </OverlayTrigger>
              </span>
              <span style={{flex: 1}}>{inExpedition ? __('Expedition') : __('Resting')}:
                <span> </span>
                <CountdownLabel fleetId={fleetId}
                  fleetName={fleetName}
                  completeTime={completeTime}
                  shouldNotify={!inExpedition && !inBattle && canNotify} />
              </span>
            </div>
          </Alert>
      }
    </div>
  )
})
