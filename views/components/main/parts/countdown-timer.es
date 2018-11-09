import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Tag, Intent } from '@blueprintjs/core'

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
    if (document.hidden) {
      this.tickAndSchedule()
    } else {
      requestAnimationFrame(this.tickAndSchedule)
    }
  }
  tickAndSchedule = () => {
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

class CountdownTimerInner extends Component {
  constructor(props) {
    super(props)
    this.resolveTime = props.resolveTime || resolveTime
  }
  static getTimeRemaining = (completeTime, currentTime=Date.now()) => {
    if (completeTime < 0) {
      return -1
    } else if (completeTime <= currentTime) {
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
    timeRemaining: this.constructor.getTimeRemaining(this.props.completeTime),
  }
  componentDidMount = () => {
    this.startTick()
  }
  shouldComponentUpdate = (nextProps, nextState) =>
    nextProps.countdownId !== this.props.countdownId ||
    nextProps.completeTime !== this.props.completeTime ||
    nextState.timeRemaining !== this.state.timeRemaining
  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.countdownId !== this.props.countdownId || prevProps.completeTime !== this.props.completeTime) {
      this.startTick() // Doesn't matter if it didn't stop
    }
  }
  componentWillUnmount = () => {
    this.stopTick()
  }
  startTick = () => {
    ticker.reg(this.props.countdownId, this.tick)
  }
  stopTick = () => {
    ticker.unreg(this.props.countdownId)
  }
  tick = (currentTime) => {
    const timeRemaining = this.constructor.getTimeRemaining(this.props.completeTime, currentTime)
    if (timeRemaining < 1) {
      this.stopTick()
    }
    if (this.props.completeTime >= 0) {
      if (typeof this.props.isActive !== 'function' || this.props.isActive() || timeRemaining < 1) {
        this.setState({ timeRemaining })
      }
      try {
        if (this.props.tickCallback) {
          this.props.tickCallback(timeRemaining)
        }
        if (timeRemaining < 1 && this.props.completeCallback) {
          this.props.completeCallback()
        }
      } catch (error) {
        console.error(error.stack)
      }
    }
  }
  render() {
    return this.resolveTime(this.state.timeRemaining)
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
    minimal: PropTypes.bool,            // Use minimal style
  }
  static defaultProps = {
    getNotifyOptions: () => undefined,
    getLabelStyle: () => Intent.NONE,
    resolveTime: resolveTime,
    minimal: true,
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
      this.props.completeTime >= 0 && (
        <Tag className="countdown-timer-label" intent={this.state.style} minimal={this.props.minimal}>
          <CountdownTimerInner countdownId={this.props.timerKey}
            completeTime={this.props.completeTime}
            isActive={this.props.isActive}
            tickCallback={this.tick}
            resolveTime={this.props.resolveTime} />
        </Tag>
      )
    )
  }
}

export function CountdownNotifierLabel(props) {
  return <CountdownNotifierLabelInner {...props} key={props.completeTime} />
}

export const ticker = new Ticker()

window.ticker = ticker
