{React, resolveTime} = window


class Ticker
  constructor: ->
    @intervalId = null
    @callbacks = new Map()
  tick: () =>
    now = (new Date()).getTime()
    @callbacks.forEach (f) -> f(now)
  start: ->
    @intervalId = setInterval @tick, 1000
  stop: ->
    @callbacks.clear()
    clearInterval @intervalId
    @intervalId = null
  reg: (key, func) ->
    @callbacks.set key, func
    @start() if !@intervalId?
  unreg: (key) ->
    @callbacks.delete key
    @stop() if @callbacks.size is 0

ticker = new Ticker()


CountdownTimer = React.createClass
  statics:
    getTimeRemaining: (completeTime, currentTime = (new Date()).getTime()) ->
      if completeTime < 0
        -1
      else if completeTime <= currentTime
        0
      else
        Math.round((completeTime - currentTime) / 1000)
  propTypes:
    countdownId: React.PropTypes.string.isRequired
    completeTime: React.PropTypes.number
    tickCallback: React.PropTypes.func
    completeCallback: React.PropTypes.func
  getDefaultProps: ->
    completeTime: -1
    tickCallback: null
    completeCallback: null
  getInitialState: ->
    @timeRemaining = @constructor.getTimeRemaining(@props.completeTime)

    completeTime: @props.completeTime
  componentDidMount: ->
    @startTick()
  componentWillReceiveProps: (nextProps) ->
    @stopTick() if nextProps.countdownId isnt @props.countdownId
    if nextProps.completeTime isnt @state.completeTime
      @setState {completeTime: nextProps.completeTime}
      @timeRemaining = @constructor.getTimeRemaining(nextProps.completeTime)
  shouldComponentUpdate: (nextProps, nextState) ->
    nextProps.countdownId isnt @props.countdownId or nextState.completeTime isnt @state.completeTime
  componentDidUpdate: ->
    @startTick() # Doesn't matter if it didn't stop
  componentWillUnmount: ->
    @stopTick()
  startTick: ->
    ticker.reg @props.countdownId, @tick
  stopTick: ->
    ticker.unreg @props.countdownId
  tick: (currentTime) ->
    actualRemaining = @constructor.getTimeRemaining(@state.completeTime, currentTime)
    @timeRemaining = actualRemaining if Math.abs(@timeRemaining - actualRemaining) > 2
    @timeRemaining = @constructor.getTimeRemaining(@state.completeTime, currentTime)
    @stopTick() if @timeRemaining < 1
    if @state.completeTime >= 0
      @textLabel.textContent = resolveTime @timeRemaining if @textLabel?
      @props.tickCallback(@timeRemaining) if @props.tickCallback?
      @props.completeCallback() if @timeRemaining < 1 and @props.completeCallback?
    @timeRemaining--
  render: ->
    <span ref={(ref) => @textLabel = ref}>{resolveTime @timeRemaining}</span>

module.exports = CountdownTimer
