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
    @timeRemaining = -1

    completeTime: @props.completeTime
  componentDidMount: ->
    @startTick()
  componentWillReceiveProps: (nextProps) ->
    console.log @props.completeTime
    @stopTick() if nextProps.countdownId isnt @props.countdownId
    @setState {completeTime: nextProps.completeTime} if nextProps.completeTime isnt @state.completeTime
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
    if @state.completeTime < 0
      @timeRemaining = -1
      @stopTick()
    else
      @timeRemaining = Math.max 0, Math.floor((@state.completeTime - currentTime) / 1000)
      @textLabel.textContent = resolveTime @timeRemaining if @textLabel?
      @props.tickCallback(@timeRemaining) if @props.tickCallback?
      if @timeRemaining < 1
        @stopTick()
        @props.completeCallback() if @props.completeCallback?
  render: ->
    <span ref={(ref) => @textLabel = ref}>{resolveTime @timeRemaining}</span>

module.exports = CountdownTimer
