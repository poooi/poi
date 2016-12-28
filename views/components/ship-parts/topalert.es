import { connect } from 'react-redux'
import React from 'react'
import { Alert, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { join } from 'path-extra'
import { get, join as joinString, memoize } from 'lodash'
import { createSelector } from 'reselect'

import { CountdownTimer } from 'views/components/main/parts/countdown-timer'
import { CountdownNotifier } from 'views/utils/notifiers'
import { recoveryEndTime } from 'views/redux/timers/cond'
import { getTyku, getSaku25, getSaku25a, getSaku33 } from 'views/utils/game-utils'
import {
  fleetInBattleSelectorFactory,
  fleetInExpeditionSelectorFactory,
  fleetShipsDataSelectorFactory,
  fleetShipsEquipDataSelectorFactory,
  fleetShipsEquipDataWithEscapeSelectorFactory,
  fleetNameSelectorFactory,
  basicSelector,
  condTickSelector,
  fleetExpeditionSelectorFactory,
  configSelector,
  miscSelector,
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
    fleetId: React.PropTypes.number,
    completeTime: React.PropTypes.number,
    shouldNotify: React.PropTypes.bool,
    fleetName: React.PropTypes.string,
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
    fleetShipsDataSelectorFactory(fleetId),
    fleetShipsEquipDataSelectorFactory(fleetId),
    admiralLevelSelector,
  ], (shipsData=[], equipsData=[], admiralLevel) =>({
    saku25: getSaku25(shipsData, equipsData),
    saku25a: getSaku25a(shipsData, equipsData, admiralLevel),
    saku33: getSaku33(shipsData, equipsData, admiralLevel),
  }))
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
    configSelector,
    miscSelector,
  ], (inBattle, inExpedition, shipsData, fleetName, condTick, expedition, tyku, saku, config, {canNotify}) => ({
    inExpedition,
    inBattle,
    shipsData,
    fleetName,
    condTick,
    expeditionEndTime: expedition[2],
    tyku,
    saku,
    condTarget: get(config, 'poi.notify.morale.value', 49),
    canNotify,
  }))
)
export default connect(
  (state, {fleetId}) =>
    topAlertSelectorFactory(fleetId)(state)
)(function TopAlert(props) {
  const {inExpedition, inBattle, shipsData=[], isMini, fleetId, fleetName, condTick, expeditionEndTime, tyku, saku, condTarget, canNotify} = props
  const {saku25, saku25a, saku33} = saku
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
    completeTime = expeditionEndTime + 3 * 60 *1000
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
        <span style={{flex: "none"}}>Lv. {totalLv} </span>
        <span style={{flex: "none", marginLeft: 5}}>{__('Fighter Power')}: {tyku.max}</span>
        <span style={{flex: "none", marginLeft: 5}}>{__('LOS')}: {saku33.total.toFixed(2)}</span>
      </div>
      :
      <Alert style={getFontStyle()}>
        <div style={{display: "flex"}}>
          <span style={{flex: 1}}>{__('Total Lv')}. {totalLv}</span>
          <span style={{flex: 1}}>
            <OverlayTrigger placement='bottom' overlay={
              <Tooltip id={`topalert-FP-fleet-${fleetId}`}>
                <span>{__('Minimum FP')}: {tyku.min} {__('Maximum FP')}: {tyku.max}</span>
              </Tooltip>
            }>
              <span>{__('Fighter Power')}: {tyku.max}</span>
            </OverlayTrigger>
          </span>
          <span style={{flex: 1}}>
            <OverlayTrigger placement='bottom' overlay={
              <Tooltip id={`topalert-recon-fleet-${fleetId}`}>
                <div>{__('2-5 fall formula')}: {saku25a.ship} + {saku25a.item} - {saku25a.teitoku} = {saku25a.total}</div>
                <div>{__('2-5 old formula')}: {saku25.ship} + {saku25.recon} + {saku25.radar} = {saku25.total}</div>
                <div>{__('Formula 33')}: {saku33.total}</div>
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
