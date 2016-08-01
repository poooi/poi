const { ROOT } = window
import React, { Component } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import { join as joinString, range } from 'lodash'
import { join } from 'path-extra'
import { createSelector } from 'reselect'

const { i18n } = window

const __ = i18n.main.__.bind(i18n.main)

import { CountdownNotifierLabel } from './countdown-timer'
import { 
  repairsSelector,
  constSelector,
  shipsSelector,
  miscSelector,
} from 'views/utils/selectors'

export default connect(
  createSelector([
    repairsSelector,
    constSelector,
    shipsSelector,
    miscSelector,
  ], (repairs, {$ships}, ships, {canNotify}) => ({
    repairs,
    $ships,
    ships,
    canNotify,
  }))
)(class RepairPanel extends Component {
  getLabelStyle = (props, timeRemaining) => {
    return (
      timeRemaining > 600 ? 'primary' :
      timeRemaining > 60 ? 'warning' :
      timeRemaining >= 0 ? 'success' :
      'default'
    )
  }
  static basicNotifyConfig = {
    type: 'repair',
    title: __('Docking'),
    message: (names) => `${joinString(names, ', ')} ${__('repair completed')}`,
    icon: join(ROOT, 'assets', 'img', 'operation', 'repair.png'),
    preemptTime: 60 * 1000,
  }
  render() {
    const {canNotify, repairs, $ships, ships} = this.props
    return (
      <div>
        {
          range(0, 4).map((i) => {
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
              dock.api_state == -1 ? __('Locked') :
              dock.api_state == 0 ? __('Empty') :
              i18n.resources.__($ships[ships[dock.api_ship_id].api_ship_id].api_name)
            const completeTime = dock.api_complete_time || -1
            return (
              <div key={i} className="panel-item ndock-item">
                <span className="ndock-name">{dockName}</span>

              <OverlayTrigger placement='left' overlay={
                (dock.api_state > 0) ? (
                  <Tooltip id={`ndock-finish-by-${i}`}>
                    <strong>{__("Finish by : ")}</strong>{window.timeToString(completeTime)}
                  </Tooltip>
                ) : (
                  <noscript />
                )
              }>
                <CountdownNotifierLabel
                  timerKey={`ndock-${i+1}`}
                  completeTime={completeTime}
                  getLabelStyle={this.getLabelStyle}
                  getNotifyOptions={() => canNotify && (completeTime >= 0) && {
                    ...this.constructor.basicNotifyConfig,
                    args: dockName,
                    completeTime: completeTime,
                  }}
                />
              </OverlayTrigger>
              </div>
            )
          })
        }
      </div>
    )
  }
})
