/* global ROOT, getStore */
import React, { Component } from 'react'
import { join } from 'path-extra'
import { createSelector } from 'reselect'
import { join as joinString, map, get, range, isEqual } from 'lodash'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import i18next from 'views/env-parts/i18next'
import { Card, Position, Intent } from '@blueprintjs/core'


import { CountdownNotifierLabel } from './countdown-timer'
import {
  fleetsSelector,
  configSelector,
  fleetShipsDataSelectorFactory,
  fleetInBattleSelectorFactory,
} from 'views/utils/selectors'
import { timeToString } from 'views/utils/tools'
import { Tooltip } from 'views/components/etc/panel-tooltip'

import '../assets/expedition-panel.css'

const fleetsExpeditionSelector = createSelector(fleetsSelector, fleets => map(fleets, 'api_mission'))
const fleetsNamesSelector = createSelector(fleetsSelector, fleets => map(fleets, 'api_name'))
const fleetInBattleSelector = createSelector(fleetInBattleSelectorFactory, inBattle => inBattle)

const FleetStatus = translate(['main'])(
  connect((state, { fleetId }) => {
    const fleetShipsData = fleetShipsDataSelectorFactory(fleetId)(state)
    const fleetInBattle = fleetInBattleSelector(fleetId)(state)
    return {
      fleetId,
      fleetShipsData,
      fleetInBattle,
    }
  })(({ fleetInBattle, fleetShipsData, t }) => {
    if (fleetInBattle) {
      return <span className="expedition-name text-success">{t('main:In Sortie')}</span>
    }

    const notSuppliedShips = fleetShipsData.filter(
      ([ship, $ship] = []) => Math.min(ship.api_fuel / $ship.api_fuel_max, ship.api_bull / $ship.api_bull_max) < 1,
    )
    if (notSuppliedShips.length) {
      return <span className="expedition-name text-warning">{t('main:Resupply Needed')}</span>
    }

    return <span className="expedition-name">{t('main:Ready')}</span>
  }),
)

const getTagIntent = (props, timeRemaining) =>
  timeRemaining > 600
    ? Intent.PRIMARY
    : timeRemaining > 60
      ? Intent.WARNING
      : timeRemaining >= 0
        ? Intent.SUCCESS
        : Intent.NONE

const isActive = () => getStore('ui.activeMainTab') === 'main-view'

@translate(['main'])
@connect(state => {
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
})
export class ExpeditionPanel extends Component {
  static basicNotifyConfig = {
    type: 'expedition',
    title: i18next.t('main:Expedition'),
    message: names => `${joinString(names, ', ')} ${i18next.t('main:mission complete')}`,
    icon: join(ROOT, 'assets', 'img', 'operation', 'expedition.png'),
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    return !isEqual(nextProps, this.props)
  }

  render() {
    const { fleetsExpedition, fleetNames, $expeditions, canNotify, notifyBefore, editable } = this.props
    return (
      <Card elevation={editable ? 2 : 0} interactive={editable}>
        {range(1, 4).map(i => {
          const [status, expeditionId, rawCompleteTime] = fleetsExpedition[i] || [-1, 0, -1]
          const fleetName = get(fleetNames, i, '???')
          const { api_disp_no, api_name } = get($expeditions, expeditionId, {})
          const expeditionName =
            status == -1
              ? this.props.t('main:Locked')
              : `${api_disp_no || '???'} - ${api_name ? this.props.t(`resources:${api_name}`) : '???'}`
          const completeTime = status > 0 ? rawCompleteTime : -1

          return (
            <div className="panel-item expedition-item" key={i}>
              {status === 0 ? <FleetStatus fleetId={i} /> : <span className="expedition-name">{expeditionName}</span>}
              <Tooltip
                position={Position.LEFT}
                disabled={completeTime < 0}
                content={
                  <>
                    <strong>{this.props.t('main:Return By')}: </strong>
                    {timeToString(completeTime)}
                  </>
                }
              >
                <CountdownNotifierLabel
                  timerKey={`expedition-${i + 1}`}
                  completeTime={completeTime}
                  getLabelStyle={getTagIntent}
                  getNotifyOptions={() =>
                    canNotify &&
                    completeTime >= 0 && {
                      ...this.constructor.basicNotifyConfig,
                      args: fleetName,
                      completeTime: completeTime,
                      preemptTime: notifyBefore,
                    }
                  }
                  isActive={isActive}
                />
              </Tooltip>
            </div>
          )
        })}
      </Card>
    )
  }
}
