/* global ROOT, getStore */
import React, { Component } from 'react'
import { join } from 'path-extra'
import { createSelector } from 'reselect'
import { join as joinString, map, get, range, isEqual } from 'lodash'
import { connect } from 'react-redux'
import { withNamespaces } from 'react-i18next'
import i18next from 'views/env-parts/i18next'
import { Position, Intent, Tooltip } from '@blueprintjs/core'
import styled, { css } from 'styled-components'

import { CountdownNotifierLabel } from './countdown-timer'
import {
  fleetsSelector,
  configSelector,
  fleetShipsDataSelectorFactory,
  fleetInBattleSelectorFactory,
} from 'views/utils/selectors'
import { timeToString } from 'views/utils/tools'
import { CardWrapper } from './styled-components'

export const ExpeditionItem = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  padding: 4px;
`

export const ExpeditionName = styled.span`
  flex: 1;
  margin-right: auto;
  overflow: hidden;
  padding-right: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${({ warning, success }) =>
    warning
      ? css`
          color: #f39c12;
        `
      : success &&
        css`
          color: #00bc8c;
        `}
`

const fleetsExpeditionSelector = createSelector(
  fleetsSelector,
  fleets => map(fleets, 'api_mission'),
)
const fleetsNamesSelector = createSelector(
  fleetsSelector,
  fleets => map(fleets, 'api_name'),
)
const fleetInBattleSelector = createSelector(
  fleetInBattleSelectorFactory,
  inBattle => inBattle,
)

const FleetStatus = withNamespaces(['main'])(
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
      return (
        <ExpeditionName className="expedition-name" success>
          {t('main:In Sortie')}
        </ExpeditionName>
      )
    }

    const notSuppliedShips = fleetShipsData.filter(
      ([ship, $ship] = []) =>
        Math.min(ship.api_fuel / $ship.api_fuel_max, ship.api_bull / $ship.api_bull_max) < 1,
    )
    if (notSuppliedShips.length) {
      return (
        <ExpeditionName className="expedition-name" warning>
          {t('main:Resupply Needed')}
        </ExpeditionName>
      )
    }

    return <ExpeditionName className="expedition-name">{t('main:Ready')}</ExpeditionName>
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

@withNamespaces(['main'])
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
    const {
      fleetsExpedition,
      fleetNames,
      $expeditions,
      canNotify,
      notifyBefore,
      editable,
    } = this.props
    return (
      <CardWrapper elevation={editable ? 2 : 0} interactive={editable}>
        {range(1, 4).map(i => {
          const [status, expeditionId, rawCompleteTime] = fleetsExpedition[i] || [-1, 0, -1]
          const fleetName = get(fleetNames, i, '???')
          const { api_disp_no, api_name } = get($expeditions, expeditionId, {})
          const expeditionName =
            status == -1
              ? this.props.t('main:Locked')
              : `${api_disp_no || '???'} - ${
                  api_name ? this.props.t(`resources:${api_name}`) : '???'
                }`
          const completeTime = status > 0 ? rawCompleteTime : -1

          return (
            <ExpeditionItem className="panel-item expedition-item" key={i}>
              {status === 0 ? (
                <FleetStatus fleetId={i} />
              ) : (
                <ExpeditionName className="expedition-name">{expeditionName}</ExpeditionName>
              )}
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
            </ExpeditionItem>
          )
        })}
      </CardWrapper>
    )
  }
}
