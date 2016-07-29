const { ROOT } = window
import React, { Component } from 'react'
import { Label, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import { range, once } from 'lodash'
import { join } from 'path-extra'
import { createSelector } from 'reselect'

const { i18n } = window

const __ = i18n.main.__.bind(i18n.main)

import CountdownTimer from './countdown-timer'
import { 
  repairsSelector,
  constSelector,
  shipsSelector,
} from 'views/utils/selectors'

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
    if (timeRemaining <= 60)
      this.notify()
    const style = this.getLabelStyle(timeRemaining)
    if (style != this.state.style)
      this.setState({style: style})
  }
  render() {
    return (
      <OverlayTrigger placement='left' overlay={
        (this.props.style === 'primary' || this.props.style === 'warning') ? (
          <Tooltip id={`ndock-finish-by-${this.props.dockIndex}`}>
            <strong>{__("Finish by : ")}</strong>{window.timeToString(this.props.completeTime)}
          </Tooltip>
        ) : (
          <span />
        )
      }>
        <Label className="ndock-timer" bsStyle={this.state.style}>
        {
          (this.props.completeTime >= 0) ? (
            <CountdownTimer countdownId={`ndock-${this.props.dockIndex+1}`}
                            completeTime={this.props.completeTime}
                            tickCallback={this.tick} />
          ) : undefined
        }
        </Label>
      </OverlayTrigger>
    )
  }
}

export default connect(
  createSelector([
    repairsSelector,
    constSelector,
    shipsSelector,
  ], (repairs, {$ships}, ships) => ({
    repairs,
    $ships,
    ships,
  }))
)(class RepairPanel extends Component {
  constructor(props) {
    super(props)
    this.canNotify = false
  }
  handleResponse = (e) => {
    const {path} = e.detail
    switch (path) {
    case '/kcsapi/api_start2':
      this.canNotify = false
      break
    case '/kcsapi/api_port/port':
      this.canNotify = true
      break
    }
  }
  notify = (dockName) => {
    window.notify(`${dockName} ${__("repair completed")}`, {
      type: 'repair',
      title: __('Docking'),
      icon: join(ROOT, 'assets', 'img', 'operation', 'repair.png'),
    })
  }
  render() {
    const {repairs, $ships, ships} = this.props
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
                <CountdownLabel dockIndex={i}
                                completeTime={completeTime}
                                notify={this.notify.bind(this, dockName)}/>
              </div>
            )
          })
        }
      </div>
    )
  }
})
