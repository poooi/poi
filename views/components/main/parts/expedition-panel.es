const { ROOT, i18n, timeToString } = window
import { Panel, Label, OverlayTrigger, Tooltip } from 'react-bootstrap'
import React, { Component } from 'react'
import { join } from 'path-extra'
import { createSelector } from 'reselect'
import { join as joinString, map, get, range, isEqual } from 'lodash'
import { connect } from 'react-redux'
const __ = i18n.main.__.bind(i18n.main)

import CountdownTimer from './countdown-timer'
import { fleetsSelector } from 'views/utils/selectors'
import { CountdownNotifier } from 'views/utils/notifiers'

class CountdownLabel extends Component {
  getLabelStyle = (timeRemaining) => {
    return (
      timeRemaining > 600 ? 'primary' :
      timeRemaining > 60 ? 'warning' :
      timeRemaining >= 0 ? 'success' :
      'default'
    )
  }
  constructor(props) {
    super(props)
    this.notifier = new CountdownNotifier()
    this.state = {
      style: this.getLabelStyle(CountdownTimer.getTimeRemaining(this.props.completeTime)),
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.completeTime != this.props.completeTime) {
      this.setState({
        style: this.getLabelStyle(CountdownTimer.getTimeRemaining(nextProps.completeTime)),
      })
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.completeTime != this.props.completeTime || nextState.style != this.state.style
  }
  tick = (timeRemaining) => {
    if (this.props.completeTime >= 0)
      this.tryNotify() 
    const style = this.getLabelStyle(timeRemaining)
    if (style != this.state.style)
      this.setState({style: style})
  }
  static basicNotifyConfig = {
    type: 'expedition',
    title: __('Expedition'),
    message: (names) => `${joinString(names, ', ')} ${__('mission complete')}`,
    icon: join(ROOT, 'assets', 'img', 'operation', 'expedition.png'),
  }
  tryNotify = () => {
    const notifyBefore = Math.max(window.notify.expedition || 0, 1)
    this.notifier.tryNotify({
      ...CountdownLabel.basicNotifyConfig,
      args: this.props.fleetName,
      completeTime: this.props.completeTime,
      preemptTime: notifyBefore * 1000,
    })
  }
  render() {
    return (
      <OverlayTrigger placement='left' overlay={
        (this.props.completeTime > 0) ? (
          <Tooltip id={`expedition-return-by-${this.props.dockIndex}`}>
            <strong>{__("Return by : ")}</strong>{timeToString(this.props.completeTime)}
          </Tooltip>
        ) : (
          <span />
        )
      }>
        <Label className="expedition-timer" bsStyle={this.state.style}>
        {
          (this.props.completeTime > 0) ? (
            <CountdownTimer countdownId={`expedition-${this.props.dockIndex+1}`}
                            completeTime={this.props.completeTime}
                            tickCallback={this.tick} />
          ) : undefined
        }
        </Label>
      </OverlayTrigger>
    )
  }
}

const fleetsExpeditionSelector = createSelector(fleetsSelector,
  (fleets) => map(fleets, 'api_mission')
)
const fleetsNamesSelector = createSelector(fleetsSelector,
  (fleets) => map(fleets, 'api_name')
)

// TODO: Add canNotify as Kdock does
export default connect(
  (state) => {
    const fleetsExpedition = fleetsExpeditionSelector(state)
    const fleetNames = fleetsNamesSelector(state)
    const $expeditions = state.const.$missions
    return {
      fleetsExpedition, 
      fleetNames,
      $expeditions,
    }
  }
)(class MissionPanel extends Component {
  shouldComponentUpdate = (nextProps, nextState) => {
    return !isEqual(nextProps, this.props)
  }
  render() {
    return (
      <Panel bsStyle="default">
      {
        range(1, 4).map((i) => {
          const [status, expeditionId, completeTime] = this.props.fleetsExpedition[i] || [-1, 0, -1]
          const fleetName = get(this.props.fleetNames, i, '???')
          const expeditionName =
            status == -1 ? __('Locked') :
            status == 0 ? __('Ready') :
            get(this.props.$expeditions, [expeditionId, 'api_name'], __('???'))
          return (
            <div className="panel-item expedition-item" key={i} >
              <span className="expedition-name">{expeditionName}</span>
              <CountdownLabel
                dockIndex={i}
                fleetName={fleetName}
                completeTime={completeTime}
              />
            </div>
          )
        })
      }
      </Panel>
    )
  }
})
