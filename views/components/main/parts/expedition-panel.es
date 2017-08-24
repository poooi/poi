const { ROOT, i18n } = window
import { Panel, OverlayTrigger, Tooltip } from 'react-bootstrap'
import React, { Component } from 'react'
import { join } from 'path-extra'
import { createSelector } from 'reselect'
import { join as joinString, map, get, range, isEqual } from 'lodash'
import { connect } from 'react-redux'
const __ = i18n.main.__.bind(i18n.main)

import { CountdownNotifierLabel } from './countdown-timer'
import {
  fleetsSelector,
  configSelector,
  fleetShipsDataSelectorFactory,
  fleetInBattleSelectorFactory,
} from 'views/utils/selectors'
import { timeToString } from 'views/utils/tools'

const fleetsExpeditionSelector = createSelector(fleetsSelector,
  (fleets) => map(fleets, 'api_mission')
)
const fleetsNamesSelector = createSelector(fleetsSelector,
  (fleets) => map(fleets, 'api_name')
)
const fleetInBattleSelector = createSelector(fleetInBattleSelectorFactory,
  (inBattle) => inBattle
)

const FleetStatus = connect((state, {fleetId}) => {
  const fleetShipsData = fleetShipsDataSelectorFactory(fleetId)(state)
  const fleetInBattle = fleetInBattleSelector(fleetId)(state)
  return {
    fleetId,
    fleetShipsData,
    fleetInBattle,
  }
})(class fleetStatus extends Component {
  fleetNotSupplied = () => {
    const notSuppliedShips = []
    const {fleetShipsData} = this.props
    fleetShipsData.map(shipData => {
      const ship = shipData[0]
      const $ship = shipData[1]
      if (Math.min(ship.api_fuel / $ship.api_fuel_max, ship.api_bull / $ship.api_bull_max) < 1){
        notSuppliedShips.push(ship.api_ship_id)
      }
    })
    if (notSuppliedShips.length > 0) {return true}
    else {return false}
  }
  render() {
    const {fleetInBattle} = this.props
    if (fleetInBattle) {return (<span className="expedition-name text-success">{__('In Sortie')}</span>)}
    else if (this.fleetNotSupplied()) {return (<span className="expedition-name text-warning">{__('Resupply needed')}</span>)}
    else {return (<span className="expedition-name">{__('Ready')}</span>)}
  }
})

export default connect(
  (state) => {
    const fleetsExpedition = fleetsExpeditionSelector(state)
    const fleetNames = fleetsNamesSelector(state)
    const $expeditions = state.const.$missions
    const notifyBefore = get(configSelector(state), 'poi.notify.expedition.value', 60)
    return {
      fleetsExpedition,
      fleetNames,
      $expeditions,
      notifyBefore,
      canNotify: state.misc.canNotify,
    }
  }
)(class ExpeditionPanel extends Component {
  shouldComponentUpdate = (nextProps, nextState) => {
    return !isEqual(nextProps, this.props)
  }
  getLabelStyle = (props, timeRemaining) => {
    return (
      timeRemaining > 600 ? 'primary' :
        timeRemaining > 60 ? 'warning' :
          timeRemaining >= 0 ? 'success' :
            'default'
    )
  }
  static basicNotifyConfig = {
    type: 'expedition',
    title: __('Expedition'),
    message: (names) => `${joinString(names, ', ')} ${__('mission complete')}`,
    icon: join(ROOT, 'assets', 'img', 'operation', 'expedition.png'),
  }
  render() {
    const {fleetsExpedition, fleetNames, $expeditions, canNotify, notifyBefore} = this.props
    return (
      <Panel bsStyle="default">
        {
          range(1, 4).map((i) => {
            const [status, expeditionId, rawCompleteTime] = fleetsExpedition[i] || [-1, 0, -1]
            const fleetName = get(fleetNames, i, '???')
            const useStatusPanel = () => {
              if (status == 0) {return true}
              else {return false}
            }
            const expeditionName =
            status == -1 ? __('Locked') : get($expeditions, [expeditionId, 'api_name'], __('???'))
            const completeTime = status > 0 ? rawCompleteTime : -1
            return (
              <div className="panel-item expedition-item" key={i} >
                {useStatusPanel() ? (
                  <FleetStatus fleetId={i} />
                ) : (
                  <span className="expedition-name">{expeditionName}</span>

                )}
                <OverlayTrigger placement='left' overlay={
                  <Tooltip id={`expedition-return-by-${i}`} style={completeTime < 0 && {display: 'none'}}>
                    <strong>{__("Return by : ")}</strong>{timeToString(completeTime)}
                  </Tooltip>
                }>
                  <div>
                    <CountdownNotifierLabel
                      timerKey={`expedition-${i+1}`}
                      completeTime={completeTime}
                      getLabelStyle={this.getLabelStyle}
                      getNotifyOptions={() => canNotify && (completeTime >= 0) && {
                        ...this.constructor.basicNotifyConfig,
                        args: fleetName,
                        completeTime: completeTime,
                        preemptTime: notifyBefore,
                      }}
                    />
                  </div>
                </OverlayTrigger>
              </div>
            )
          })
        }
      </Panel>
    )
  }
})
