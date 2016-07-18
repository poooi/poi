const { ROOT, i18n, timeToString } = window
import { Panel, Label, OverlayTrigger, Tooltip } from 'react-bootstrap'
import React, { Component } from 'react'
import { join } from 'path-extra'
import { map, get, range, once, isEqual } from 'lodash'
import { connect } from 'react-redux'
const __ = i18n.main.__.bind(i18n.main)

import CountdownTimer from './countdown-timer'

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
    this.notify = once(this.props.notify)
    this.state = {
      style: this.getLabelStyle(CountdownTimer.getTimeRemaining(this.props.completeTime)),
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.completeTime != this.props.completeTime) {
      this.notify = once(nextProps.notify)
      this.setState({
        style: this.getLabelStyle(CountdownTimer.getTimeRemaining(nextProps.completeTime)),
      })
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.completeTime != this.props.completeTime || nextState.style != this.state.style
  }
  tick = (timeRemaining) => {
    const notifyBefore = Math.max(window.notify.expedition || 0, 1)
    if (0 < timeRemaining && timeRemaining <= notifyBefore)
      this.notify()
    const style = this.getLabelStyle(timeRemaining)
    if (style != this.state.style)
      this.setState({style: style})
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

// TODO: Add canNotify as Kdock does
export default connect(
  (state) => {
    const fleetsExpedition = map(state.info.fleets, 'api_mission')
    const fleetNames = map(state.info.fleets, 'api_name')
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
  notify = (fleetName) => {
    window.notify(`${fleetName} ${__('mission complete')}`, {
      type: 'expedition',
      title: __('Expedition'),
      icon: join(ROOT, 'assets', 'img', 'operation', 'expedition.png'),
    })
  }
  render() {
    return (
      <Panel bsStyle="default">
      {
        range(1, 4).map((i) => {
          const [status, expeditionId, completeTime] = this.props.fleetsExpedition[i] || [-1, 0, -1]
          const expeditionName =
            status == -1 ? __('Locked') :
            status == 0 ? __('Ready') :
            get(this.props.$expeditions, [expeditionId, 'api_name'], __('???'))
          const fleetName = this.props.fleetNames[i] || '???'
          return (
            <div className="panel-item expedition-item" key={i} >
              <span className="expedition-name">{expeditionName}</span>
              <CountdownLabel
                dockIndex={i}
                completeTime={completeTime}
                notify={this.notify.bind(this, fleetName)}
              />
            </div>
          )
        })
      }
      </Panel>
    )
  }
})
