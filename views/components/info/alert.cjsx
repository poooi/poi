{React, ReactDOM} = window
{Collapse} = ReactBootstrap
__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)
keyCount = 0

# Alert info
PoiAlert = React.createClass
  getInitialState: ->
    message: __ 'Waiting for response...'
    type: 'default'
    overflow: false
    messagewidth: 0
    history: []
    showHistory: false
    alertStyle: {}
    historyStyle: {}

  updateAlert: (e, overflow, alertChanged) ->
    displayMessage = @message
    @setState
      message: displayMessage
      overflowAnim: if overflow then 'overflow-anim' else ''
    if alertChanged then @handleAlertChanged()

  alertWidthChange: (e) ->
    @alertWidth = e.detail.alertWidth
    if @state.overflowAnim isnt ''
      @message = @messageOld
    @needUpdate = true
    @updateAlert(null, @state.overflowAnim)

  handleMessageScroll: (overflow) ->
    overflowed = @state.overflowAnim isnt ''
    return if overflow is overflowed && !@needUpdate
    if overflow
      if React.isValidElement @message
        @message = <span>{@message}<span>　　　　　</span>{@message}<span>　　　　　</span></span>
      else
        @message = "#{@message}　　　　　#{@message}　　　　　"
    @updateAlert(null, overflow)

  handleAlertChanged: (e) ->
    @setState
      messageWidth: document.getElementById('alert-area').offsetWidth
    contentWidth = document.getElementById('alert-area').offsetWidth
    overflow = @alertWidth < contentWidth
    @handleMessageScroll(overflow)

  handleAlert: (e) ->
    # Format:
    #     message: <string-to-display>
    #     type: 'default'|'success'|'warning'|'danger'
    #     priority: 0-5, the higher the more important
    #     stickyFor: time in milliseconds

    # Make a message sticky to avoid from refreshing
    thisPriority = e.detail.priority || 0
    update = !@stickyEnd || @stickyEnd < (new Date).getTime()
    update = update || !@stickyPriority || @stickyPriority <= thisPriority
    if (update)
      @stickyPriority = thisPriority
      if e.detail.stickyFor
        @stickyEnd = (new Date).getTime() + e.detail.stickyFor
      else
        @stickyEnd = null
      if !@dontReserve
        history = @state.history
        history.push <div key={keyCount++} className='alert alert-history-contents'>{@messageOld}</div>
        if history.length > 5 then history.shift()
        @setState {history}
      @message = e.detail.message
      @messageOld = @message
      @dontReserve = e.detail.dontReserve
      @messageType = e.detail.type
      @updateAlert()
      @handleThemeChange()

  toggleHistory: ->
    @setState
      showHistory: !@state.showHistory

  handleThemeChange: ->
    setTimeout =>
      alertStyle = {}
      if @messageType == 'default'
        alertStyle.backgroundColor = window.getComputedStyle($('body'))?.backgroundColor
      try
        alertHeight = $('#alert-container').offsetHeight
        historyHeight = $('.alert-history-contents').offsetHeight
      catch error
        alertHeight = 28
        historyHeight = 30
      historyStyle = bottom: @state.history.length * historyHeight + alertHeight
      @setState {alertStyle, historyStyle}
    , 350

  componentDidMount: ->
    window.addEventListener 'poi.alert', @handleAlert
    window.addEventListener 'alert.change', @alertWidthChange
    window.addEventListener 'theme.change', @handleThemeChange
    @alertWidth = document.getElementById('alert-container').offsetWidth
    @message = @state.message
    @messageOld = @message
    @needUpdate = false
    observer = new MutationObserver(@handleAlertChanged)
    target = document.getElementById('alert-area')
    options =
      childList: true
      attributes: true
      subtree: true
    observer.observe(target, options)
  componentDidUpdate: ->
    setTimeout =>
      @alertWidth = document.getElementById('alert-container').offsetWidth
    , 350
    if @needUpdate then @handleAlertChanged()
    @needUpdate = false
  componentWillUnmount: ->
    window.removeEventListener 'poi.alert', @handleAlert
    window.removeEventListener 'alert.change', @alertWidthChange
    window.removeEventListener 'theme.change', @handleThemeChange
  render: ->
    <div>
      <div id='alert-container'
           style={@state.alertStyle}
           className="alert alert-#{@messageType} alert-container"
           onClick={@toggleHistory}>
        <div className='alert-position' style={width: @state.messageWidth}>
          <span id='alert-area' className={@state.overflowAnim}>
            {@state.message}
          </span>
        </div>
      </div>
      <div id='alert-history'
           className="alert-history panel #{if @state.showHistory then 'alert-history-show' else 'alert-history-hidden'}"
           style={@state.historyStyle}
           onClick={@toggleHistory}>
        {@state.history}
      </div>
    </div>

newAlert = (details) ->
  event = new CustomEvent 'poi.alert',
    bubbles: true
    cancelable: true
    detail: details
  window.dispatchEvent event

module.exports =
  PoiAlert: PoiAlert,
  newAlert: newAlert
