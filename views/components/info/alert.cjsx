{React, ReactDOM} = window
__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

# Alert info
PoiAlert = React.createClass
  getInitialState: ->
    message: __ 'Waiting for response...'
    type: 'default'
    overflow: false
    messagewidth: 0

  updateAlert: (e) ->
    # Must set innerHTML before getting offsetWidth
    if React.isValidElement @message
      displayMessage = @message
      ReactDOM.render @message, document.getElementById('alert-area')
      if e
        containerWidth = e.detail.alertWidth
      else
        containerWidth = document.getElementById('alert-container').offsetWidth
      if containerWidth < document.getElementById('alert-area').offsetWidth
        overflow = true
      else
        overflow = false
    else
      document.getElementById('alert-area').innerHTML = @message
      if e
        containerWidth = e.detail.alertWidth
      else
        containerWidth = document.getElementById('alert-container').offsetWidth
      if containerWidth < document.getElementById('alert-area').offsetWidth
        # Twice messages each followed by 5 full-width spaces
        displayMessage = "#{@message}　　　　　#{@message}　　　　　"
        overflow = true
      else
        displayMessage = @message
        overflow = false
      # Must set innerHTML again before getting offsetWidth
      document.getElementById('alert-area').innerHTML = displayMessage
    @setState
      message: displayMessage
      overflowAnim: if overflow then 'overflow-anim' else ''
      messageWidth: document.getElementById('alert-area').offsetWidth

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
      @message = e.detail.message
      @messageType = e.detail.type
      @updateAlert()

  componentDidMount: ->
    window.addEventListener 'poi.alert', @handleAlert
    window.addEventListener 'alert.change', @updateAlert
    @message = @state.message
  componentWillUnmount: ->
    window.removeEventListener 'poi.alert', @handleAlert
    window.removeEventListener 'alert.change', @updateAlert
  render: ->
    <div id='alert-container' style={overflow: 'hidden'} className="alert alert-#{@messageType}">
      <div className='alert-position' style={width: @state.messageWidth}>
        <span id='alert-area' className={@state.overflowAnim}>
          {@state.message}
        </span>
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
