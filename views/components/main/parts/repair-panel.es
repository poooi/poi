const { ROOT, _ } = window
import React, { Component } from 'react'
import { Label, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { join } from 'path-extra'
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
            <strong>{__("Finish by : ")}</strong>{timeToString(this.props.completeTime)}
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
