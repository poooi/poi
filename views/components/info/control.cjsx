fs = require 'fs-extra'
path = require 'path-extra'
{openItem} = require 'shell'
{Button, OverlayTrigger, Tooltip, Collapse} = ReactBootstrap
{React, config, remote, err, success, toggleModal} = window
__ = window.i18n.others.__.bind(i18n.others)
__n = window.i18n.others.__n.bind(i18n.others)

# Controller icon bar
{capturePageInMainWindow} = remote.require './lib/utils'
{openFocusedWindowDevTools} = remote.require './lib/window'
PoiControl = React.createClass
  getInitialState: ->
    muted: false
    alwaysOnTop: false
    extend: false
    resizeable: config.get 'poi.content.resizeable', true
  handleCapturePage: ->
    bound = $('kan-game webview').getBoundingClientRect()
    rect =
      x: Math.ceil bound.left
      y: Math.ceil bound.top
      width: Math.floor bound.width
      height: Math.floor bound.height
    capturePageInMainWindow rect, window.screenshotPath, (err, filename) ->
      if err?
        error __ 'Failed to save the screenshot'
      else
        success "#{__ 'screenshot saved to'} #{filename}"
  handleOpenCacheFolder: ->
    try
      dir = config.get 'poi.cachePath', remote.getGlobal('DEFAULT_CACHE_PATH')
      fs.ensureDirSync dir
      openItem dir
    catch e
      toggleModal __ 'Open cache dir', __ "Failed. Perhaps you don't have permission to it."
  handleOpenMakaiFolder: ->
    dir = config.get 'poi.cachePath', remote.getGlobal('DEFAULT_CACHE_PATH')
    dir = path.join dir, 'kcs', 'resources', 'swf', 'ships'
    try
      fs.ensureDirSync dir
      openItem dir
    catch e
      toggleModal __ 'Open makai dir', __ "Failed. Perhaps you don't have permission to it."
  handleOpenScreenshotFolder: ->
    try
      fs.ensureDirSync window.screenshotPath
      openItem window.screenshotPath
    catch e
      toggleModal __ 'Open screenshot dir', __ "Failed. Perhaps you don't have permission to it."
  handleSetMuted: ->
    muted = !@state.muted
    config.set 'poi.content.muted', muted
    $('kan-game webview').setAudioMuted muted
    @setState {muted}
  handleSetAlwaysOnTop: ->
    alwaysOnTop = !@state.alwaysOnTop
    config.set 'poi.content.alwaysOnTop', alwaysOnTop
    remote.getCurrentWindow().setAlwaysOnTop alwaysOnTop
    @setState {alwaysOnTop}
  handleSetResizable: ->
    resizeable = !@state.resizeable
    config.set 'poi.content.resizeable', resizeable
    remote.getCurrentWindow().setResizable resizeable
    @setState {resizeable}
  handleOpenDevTools: ->
    openFocusedWindowDevTools()
  handleOpenWebviewDevTools: ->
    $('kan-game webview').openDevTools
      detach: true
  handleJustifyLayout: (e) ->
    window.dispatchEvent new Event('resize')
    e.preventDefault()
  handleUnlockWebview: ->
    $('kan-game webview').executeJavaScript "document.documentElement.style.overflow = 'auto'"
  handleSetExtend: ->
    extend = !@state.extend
    @setState {extend}
  componentDidUpdate: (prevProps, prevState) ->
    if prevState.extend != @state.extend
      event = new CustomEvent 'alert.change',
        bubbles: true
        cancelable: true
        detail:
          alertWidth: @alertWidth
      window.dispatchEvent event
    @alertWidth = document.getElementById('alert-container').offsetWidth
  componentDidMount: ->
    setTimeout =>
      try
        if config.get 'poi.content.muted', false
          @handleSetMuted()
        if config.get 'poi.content.alwaysOnTop', false
          @handleSetAlwaysOnTop()
      catch e
        false
    , 1000
  render: ->
    <div className='poi-control-container'>
      <OverlayTrigger placement='right' overlay={<Tooltip id='poi-developers-tools-button'>{__ 'Developer Tools'}</Tooltip>}>
        <Button onClick={@handleOpenDevTools} onContextMenu={@handleOpenWebviewDevTools} bsSize='small'><FontAwesome name='gears' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='right' overlay={<Tooltip id='poi-screenshot-button'>{__ 'Take a screenshot'}</Tooltip>}>
        <Button onClick={@handleCapturePage} bsSize='small'><FontAwesome name='camera-retro' /></Button>
      </OverlayTrigger>
      <OverlayTrigger placement='right' overlay={<Tooltip id='poi-volume-button'>{if @state.muted then __ 'Volume on' else __ 'Volume off'}</Tooltip>}>
        <Button onClick={@handleSetMuted} bsSize='small' className={if @state.muted then 'active' else ''}><FontAwesome name={if @state.muted then 'volume-off' else 'volume-up'} /></Button>
      </OverlayTrigger>
      <Collapse in={@state.extend} dimension='width' className="poi-control-extender">
        <div>
          <OverlayTrigger placement='right' overlay={<Tooltip id='poi-cache-button'>{__ 'Open cache dir'}</Tooltip>}>
            <Button onClick={@handleOpenCacheFolder}  onContextMenu={@handleOpenMakaiFolder} bsSize='small'><FontAwesome name='bolt' /></Button>
          </OverlayTrigger>
          <OverlayTrigger placement='right' overlay={<Tooltip id='poi-screenshot-dir-button'>{__ 'Open screenshot dir'}</Tooltip>}>
            <Button onClick={@handleOpenScreenshotFolder} bsSize='small'><FontAwesome name='photo' /></Button>
          </OverlayTrigger>
          <OverlayTrigger placement='right' overlay={<Tooltip id='poi-adjust-button'>{__ 'Auto adjust'}</Tooltip>}>
            <Button onClick={@handleJustifyLayout} onContextMenu={@handleUnlockWebview} bsSize='small'><FontAwesome name='arrows-alt' /></Button>
          </OverlayTrigger>
          <OverlayTrigger placement='right' overlay={<Tooltip id='poi-always-on-top-button'>{if @state.alwaysOnTop then __ 'Dont always on top' else __ 'Always on top'}</Tooltip>}>
            <Button onClick={@handleSetAlwaysOnTop} bsSize='small' className={if @state.alwaysOnTop then 'active' else ''}><FontAwesome name={if @state.alwaysOnTop then 'arrow-down' else 'arrow-up'} /></Button>
          </OverlayTrigger>
          <OverlayTrigger placement='right' overlay={<Tooltip id='poi-always-on-top-button'>{if @state.resizeable then __ 'Not resizeable' else __ 'Resizeable'}</Tooltip>}>
            <Button onClick={@handleSetResizable} bsSize='small' className={if @state.resizeable then '' else 'active'}><FontAwesome name={if @state.resizeable then 'unlock-alt' else 'lock'} /></Button>
          </OverlayTrigger>
        </div>
      </Collapse>
      <Button onClick={@handleSetExtend} bsSize='small' className={if @state.extend then 'active' else ''}><FontAwesome name={if @state.extend then 'angle-left' else 'angle-right'} /></Button>
    </div>

module.exports =
  PoiControl: PoiControl
