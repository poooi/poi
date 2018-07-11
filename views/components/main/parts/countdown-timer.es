import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Label } from 'react-bootstrap'

import { resolveTime } from 'views/utils/tools'
import { CountdownNotifier } from 'views/utils/notifiers'

class Ticker {
  constructor() {
    this.counting = false
    this.callbacks = new Map()
  }
  tick = () => {
    const now = Date.now()
    this.callbacks.forEach((f) => f(now))
  }
  count = () => {
    if (!this.counting) {
      return
    }
    this.tick()
    setTimeout(this.count, 1000)
  }
  start = () => {
    this.counting = true
    this.count()
  }
  stop = () => {
    this.counting = false
  }
  reg = (key, func) => {
    this.callbacks.set(key, func)
    if (!this.counting) {
      this.start()
    }
  }
  unreg = (key) => {
    this.callbacks.delete(key)
    if (this.callbacks.size === 0) {
      this.stop()
    }
  }
}

window.ticker = new Ticker()


class CountdownTimerInner extends Component {
  constructor(props) {
    super(props)
    this.timeRemaining = this.constructor.getTimeRemaining(this.props.completeTime)
    this.resolveTime = props.resolveTime || resolveTime
  }
  static getTimeRemaining = (completeTime, currentTime=Date.now()) => {
    if (completeTime < 0) {
      return -1
    } else if ( completeTime <= currentTime) {
      return 0
    } else {
      return Math.round((completeTime - currentTime) / 1000)
    }
  }
  static propTypes = {
    countdownId: PropTypes.string.isRequired,
    completeTime: PropTypes.number,
    tickCallback: PropTypes.func,
    completeCallback: PropTypes.func,
  }
  static defaultProps = {
    completeTime: -1,
    tickCallback: null,
    completeCallback: null,
  }
  state = {
    completeTime: this.props.completeTime,
  }
  componentDidMount = () => {
    this.startTick()
  }
  shouldComponentUpdate = (nextProps, nextState) =>
    nextProps.countdownId !== this.props.countdownId || nextState.completeTime !== this.state.completeTime
  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.completeTime !== this.state.completeTime) {
      this.timeRemaining = this.constructor.getTimeRemaining(this.props.completeTime)
    }
    this.startTick() // Doesn't matter if it didn't stop
  }
  componentWillUnmount = () => {
    this.stopTick()
  }
  startTick = () => {
    window.ticker.reg(this.props.countdownId, this.tick)
  }
  stopTick = () => {
    window.ticker.unreg(this.props.countdownId)
  }
  tick = (currentTime) => {
    const actualRemaining = this.constructor.getTimeRemaining(this.state.completeTime, currentTime)
    if (Math.abs(this.timeRemaining - actualRemaining) > 2) {
      this.timeRemaining = actualRemaining
    }
    this.timeRemaining = this.constructor.getTimeRemaining(this.state.completeTime, currentTime)
    if (this.timeRemaining < 1) {
      this.stopTick()
    }
    if (this.state.completeTime >= 0)
      try {
        if (this.textLabel) {
          this.textLabel.textContent = this.resolveTime(this.timeRemaining)
        }
        if (this.props.tickCallback) {
          this.props.tickCallback(this.timeRemaining)
        }
        if (this.timeRemaining < 1 && this.props.completeCallback) {
          this.props.completeCallback()
        }
      } catch (error) {
        console.error(error.stack)
      }
    this.timeRemaining--
  }
  render() {
    return <span ref={(ref) => {this.textLabel = ref}}>{this.resolveTime(this.timeRemaining)}</span>
  }
}

export function CountdownTimer(props) {
  return <CountdownTimerInner {...props} key={props.completeTime} />
}

class CountdownNotifierLabelInner extends Component {
  static propTypes = {
    timerKey: PropTypes.string.isRequired,  // A globally unique string for the timer
    completeTime: PropTypes.number.isRequired,
    getNotifyOptions: PropTypes.func,   // (props, timeRemaining) => options | undefined
    getLabelStyle: PropTypes.func,      // (props, timeRemaining) => bsStyle
    resolveTime: PropTypes.func,        // (timeRemaining) => interpreted time string
  }
  static defaultProps = {
    getNotifyOptions: () => undefined,
    getLabelStyle: () => 'default',
    resolveTime: resolveTime,
  }
  constructor(props) {
    super(props)
    this.notifier = new CountdownNotifier()
    this.state = {
      style: this.getLabelStyle(props),
    }
  }
  componentDidMount() {
    const style = this.getLabelStyle(this.props)
    if (this.state.style !== style) {
      this.setState({ style })
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.completeTime !== this.props.completeTime || nextState.style !== this.state.style
  }
  getLabelStyle = (props) => {
    return props.getLabelStyle(props, CountdownTimerInner.getTimeRemaining(props.completeTime))
  }
  tick = (timeRemaining) => {
    const notifyOptions = this.props.getNotifyOptions(this.props)
    if (notifyOptions)
      this.notifier.tryNotify(notifyOptions)
    const style = this.getLabelStyle(this.props)
    if (style !== this.state.style)
      this.setState({style: style})
  }
  render() {
    return (
      <Label className="countdown-timer-label" bsStyle={this.state.style}>
        {
          this.props.completeTime >= 0 &&
          <CountdownTimerInner countdownId={this.props.timerKey}
            completeTime={this.props.completeTime}
            tickCallback={this.tick}
            resolveTime={this.props.resolveTime} />
        }
      </Label>
    )
  }
}

export function CountdownNotifierLabel(props) {
  return <CountdownNotifierLabelInner {...props} key={props.completeTime} />
}
