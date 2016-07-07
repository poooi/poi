{React, resolveTime} = window


class Ticker
  constructor: ->
    @counting = false
    @callbacks = new Map()
  tick: () =>
    now = Date.now()
    @callbacks.forEach (f) -> f(now)
  count: () =>
    return if !@counting
    @tick()
    setTimeout @count, 1000
  start: ->
    @counting = true
    @count()
  stop: ->
    @counting = false
  reg: (key, func) ->
    @callbacks.set key, func
    @start() if !@counting
  unreg: (key) ->
    @callbacks.delete key
    @stop() if @callbacks.size is 0

window.ticker = new Ticker()


CountdownTimer = React.createClass
  statics:
    getTimeRemaining: (completeTime, currentTime = Date.now()) ->
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
    window.addEventListener 'countdown.start', @startTick
    window.addEventListener 'countdown.stop', @stopTick
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
    window.removeEventListener 'countdown.start', @startTick
    window.removeEventListener 'countdown.stop', @stopTick
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
      try
        @textLabel.textContent = resolveTime @timeRemaining if @textLabel?
        @props.tickCallback(@timeRemaining) if @props.tickCallback?
        @props.completeCallback() if @timeRemaining < 1 and @props.completeCallback?
      catch error
        console.error(error.stack)
    @timeRemaining--
  render: ->
    <span ref={(ref) => @textLabel = ref}>{resolveTime @timeRemaining}</span>

module.exports = CountdownTimer
