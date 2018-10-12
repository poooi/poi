const { ROOT } = window
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { join as joinString, range, get } from 'lodash'
import { join } from 'path-extra'
import { createSelector } from 'reselect'
import cls from 'classnames'
import FA from 'react-fontawesome'
import { translate } from 'react-i18next'
import { Position, Intent } from '@blueprintjs/core'
import styled from 'styled-components'

import { Avatar } from 'views/components/etc/avatar'
import { CountdownNotifierLabel } from '../countdown-timer'
import {
  repairsSelector,
  constSelector,
  shipsSelector,
  miscSelector,
  inRepairShipsIdSelector,
  createDeepCompareArraySelector,
} from 'views/utils/selectors'
import { indexify, timeToString } from 'views/utils/tools'
import { Tooltip } from '../panel-tooltip'

import '../../assets/repair-panel.css'

const PanelItem = styled.div`
  flex: 1;
  flex-basis: ${props => `${100 / props.dimension}%`};
  max-width: ${props => `${100 / props.dimension}%`};
`

const inRepairShipsDataSelector = createSelector([inRepairShipsIdSelector, shipsSelector], (inRepairShipsId, ships) =>
  inRepairShipsId.map(shipId => ships[shipId]),
)

const EmptyDock = ({ state }) => (
  <div className="empty-dock">
    <FA name={state === 0 ? 'bath' : 'lock'} />
  </div>
)



const getTagIntent = (props, timeRemaining) =>
  timeRemaining > 600
    ? Intent.PRIMARY
    : timeRemaining > 60
      ? Intent.WARNING
      : timeRemaining >= 0
        ? Intent.SUCCESS
        : Intent.NONE


@translate(['main'])
@connect(
  createDeepCompareArraySelector(
    [
      repairsSelector,
      constSelector,
      inRepairShipsDataSelector,
      miscSelector,
      state => get(state, 'config.poi.appearance.avatar', true),
    ],
    (repairs, { $ships }, inRepairShips, { canNotify }, enableAvatar) => ({
      repairs,
      $ships,
      inRepairShips,
      canNotify,
      enableAvatar,
    }),
  ),
)
export class RepairPanel extends Component {
  basicNotifyConfig = {
    type: 'repair',
    title: this.props.t('main:Docking'),
    message: names => `${joinString(names, ', ')} ${this.props.t('main:repair completed')}`,
    icon: join(ROOT, 'assets', 'img', 'operation', 'repair.png'),
    preemptTime: 60,
  }


  render() {
    const { canNotify, repairs, $ships, inRepairShips, enableAvatar, dimension } = this.props
    // The reason why we use an array to pass in inRepairShips and indexify it
    // into ships, is because by passing an array we can make use of
    // createDeepCompareArraySelector which only deep compares arrays, and
    // by indexifying it into an object, it becomes easier to use.
    const ships = indexify(inRepairShips)
    return (
      <>
        {range(0, 4).map(i => {
          const emptyRepair = {
            api_complete_time: 0,
            api_complete_time_str: '0',
            api_item1: 0,
            api_item2: 0,
            api_item3: 0,
            api_item4: 0,
            api_ship_id: 0,
            api_state: 0,
          }
          const dock = repairs[i] || emptyRepair
          const dockName =
            dock.api_state == -1
              ? this.props.t('main:Locked')
              : dock.api_state == 0
                ? this.props.t('main:Empty')
                : this.props.t(`resources:${$ships[ships[dock.api_ship_id].api_ship_id].api_name}`)
          const completeTime = dock.api_complete_time || -1
          let hpPercentage
          if (dock.api_state > 0) {
            hpPercentage =
              100 * get(ships, [dock.api_ship_id, 'api_nowhp']) / get(ships, [dock.api_ship_id, 'api_maxhp'])
          }
          return (
            <PanelItem
              key={i}
              className={cls('panel-item', 'ndock-item', { avatar: enableAvatar })}
              dimension={dimension}
            >
              {enableAvatar && (
                <>
                  {dock.api_state > 0 ? (
                    <Avatar
                      height={20}
                      mstId={get(ships, [dock.api_ship_id, 'api_ship_id'])}
                      isDamaged={hpPercentage <= 50}
                    />
                  ) : (
                    <EmptyDock state={dock.api_state} />
                  )}
                </>
              )}
              <span className="ndock-name">{dockName}</span>

              <Tooltip
                position={Position.LEFT}
                disabled={dock.api_state < 0}
                content={
                  <div>
                    <strong>{this.props.t('main:Finish By')}: </strong>
                    {timeToString(completeTime)}
                  </div>
                }
              >
                <CountdownNotifierLabel
                  timerKey={`ndock-${i + 1}`}
                  completeTime={completeTime}
                  getLabelStyle={getTagIntent}
                  getNotifyOptions={() =>
                    canNotify &&
                    completeTime >= 0 && {
                      ...this.basicNotifyConfig,
                      args: dockName,
                      completeTime: completeTime,
                    }
                  }
                />
              </Tooltip>
            </PanelItem>
          )
        })}
      </>
    )
  }
}
