const { ROOT, i18n } = window
import { Panel, OverlayTrigger, Tooltip } from 'react-bootstrap'
import React, { Component } from 'react'
import { join } from 'path-extra'
import { createSelector } from 'reselect'
import { join as joinString, map, get, range, isEqual } from 'lodash'
import { connect } from 'react-redux'
const __ = i18n.main.__.bind(i18n.main)

import { CountdownNotifierLabel } from './countdown-timer'
import { fleetsSelector, configSelector, shipsSelector} from 'views/utils/selectors'
import { timeToString } from 'views/utils/tools'

const fleetsExpeditionSelector = createSelector(fleetsSelector,
  (fleets) => map(fleets, 'api_mission')
)
const fleetsNamesSelector = createSelector(fleetsSelector,
  (fleets) => map(fleets, 'api_name')
)

export default connect(
  (state) => {
    const fleetsExpedition = fleetsExpeditionSelector(state)
    const fleetNames = fleetsNamesSelector(state)
    const $expeditions = state.const.$missions
    const $ships = state.const.$ships
    const notifyBefore = get(configSelector(state), 'poi.notify.expedition.value', 60)
    const ships = shipsSelector(state)
    const fleets = fleetsSelector(state)
    return {
      fleetsExpedition,
      fleetNames,
      $expeditions,
      $ships,
      notifyBefore,
      canNotify: state.misc.canNotify,
      ships,
      fleets,
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
  whetherFleetSupplied = (fleetShips) => {
    const notSuppliedShips = []
    const {ships, $ships} = this.props
    Object.keys(ships).map(shipId => {
      const ship = ships[shipId]
      const $ship = $ships[ship.api_ship_id]
      if (Math.min(ships[shipId].api_fuel / $ship.api_fuel_max, ships[shipId].api_bull / $ship.api_bull_max) < 1){
        notSuppliedShips.push(shipId)
      }
    })
    const whetherAllShipsSupplied = () => {
      const notSuppliedShip = [...new Set(fleetShips)].filter(x => new Set(notSuppliedShips).has(x.toString()))
      if (notSuppliedShip.length > 0) {return false}
      else {return true}
    }
    return whetherAllShipsSupplied()
  }
  static basicNotifyConfig = {
    type: 'expedition',
    title: __('Expedition'),
    message: (names) => `${joinString(names, ', ')} ${__('mission complete')}`,
    icon: join(ROOT, 'assets', 'img', 'operation', 'expedition.png'),
  }
  render() {
    const {fleetsExpedition, fleetNames, $expeditions, canNotify, notifyBefore, fleets} = this.props
    return (
      <Panel bsStyle="default">
        {
          range(1, 4).map((i) => {
            const [status, expeditionId, rawCompleteTime] = fleetsExpedition[i] || [-1, 0, -1]
            const fleetName = get(fleetNames, i, '???')
            const fleetShips = fleets[i].api_ship.filter((n) => n != -1)
            const expeditionName =
            status == -1 ? __('Locked') :
              status == 0 ?  __('Ready') :
                get($expeditions, [expeditionId, 'api_name'], __('???'))
            const completeTime = status > 0 ? rawCompleteTime : -1
            return (
              <div className="panel-item expedition-item" key={i} >
                {this.whetherFleetSupplied(fleetShips) ? (
                  <span className="expedition-name">{expeditionName}</span>
                ) : (
                  <span className="expedition-name text-warning">{__('Resupply needed')}</span>
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
