import React from 'react'

const {resolveTime} = window

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


class CountdownTimer extends React.Component {
  constructor(props) {
    super(props)
    this.timeRemaining = this.constructor.getTimeRemaining(this.props.completeTime)
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
    countdownId: React.PropTypes.string.isRequired,
    completeTime: React.PropTypes.number,
    tickCallback: React.PropTypes.func,
    completeCallback: React.PropTypes.func,
  }
  defaultProps = {
    completeTime: -1,
    tickCallback: null,
    completeCallback: null,
  }
  state = {
    completeTime: this.props.completeTime,
  }
  componentDidMount = () => {
    this.startTick()
    window.addEventListener('countdown.start', this.startTick)
    window.addEventListener('countdown.stop', this.stopTick)
  }
  componentWillReceiveProps = (nextProps) => {
    if (nextProps.countdownId !== this.props.countdownId) {
      this.stopTick()
    }
    if (nextProps.completeTime !== this.state.completeTime) {
      this.setState({completeTime: nextProps.completeTime})
      this.timeRemaining = this.constructor.getTimeRemaining(nextProps.completeTime)
    }
  }
  shouldComponentUpdate = (nextProps, nextState) =>
    nextProps.countdownId !== this.props.countdownId || nextState.completeTime !== this.state.completeTime
  componentDidUpdate = () => {
    this.startTick() // Doesn't matter if it didn't stop
  }
  componentWillUnmount = () => {
    this.stopTick()
    window.removeEventListener('countdown.start', this.startTick)
    window.removeEventListener('countdown.stop', this.stopTick)
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
          this.textLabel.textContent = resolveTime(this.timeRemaining)
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
    return <span ref={(ref) => {this.textLabel = ref}}>{resolveTime(this.timeRemaining)}</span>
  }
}

export default CountdownTimer
