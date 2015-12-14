fs = require 'fs-extra'
path = require 'path-extra'
glob = require 'glob'
i18n = require 'i18n'
{__, __n} = i18n
{showItemInFolder, openItem, openExternal} = require 'shell'
{ROOT, EXROOT, _, $, $$, React, ReactDOM, ReactBootstrap} = window
{Button, Alert, OverlayMixin, Modal, OverlayTrigger, Tooltip, Collapse} = ReactBootstrap
{config, proxy, remote, log, success, warn, error, toggleModal} = window

# i18n configure
i18n.configure
  locales:['en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
  defaultLocale: 'zh-CN',
  directory: path.join(ROOT, 'i18n'),
  updateFiles: false,
  indent: "\t",
  extension: '.json'
i18n.setLocale(window.language)

# Set zoom level
document.getElementById('poi-app-container').style.transformOrigin = '0 0'
document.getElementById('poi-app-container').style.WebkitTransform = "scale(#{window.zoomLevel})"
document.getElementById('poi-app-container').style.width = "#{Math.floor(100 / window.zoomLevel)}%"

# Hackable panels
window.hack = {}

# Module path
require('module').globalPaths.push(path.join(ROOT, "node_modules"))

# poi menu
if process.platform == 'darwin'
  exeCodeOnWindowHasReloadArea = (win, f) ->
    if win?.reloadArea?
      code = "$('#{win.reloadArea}').#{f}"
      win.webContents.executeJavaScript(code)
  template = [
    {
      label: 'Poi'
      submenu: [
        {
          label: 'About Poi'
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Services'
          role: 'services'
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Hide Poi'
          accelerator: 'CmdOrCtrl+H'
          role: 'hide'
        },
        {
          label: 'Hide Others'
          accelerator: 'CmdOrCtrl+Shift+H'
          role: 'hideothers'
        },
        {
          label: 'Show All'
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Warn Before Quitting'
          type: 'checkbox'
          checked: config.get('poi.confirm.quit', false)
          click: (item, focusedWindow) ->
            config.set('poi.confirm.quit', item.checked)
        },
        { type: 'separator' },
        {
          label: 'Quit Poi'
          accelerator: 'CmdOrCtrl+Q'
          click: ->
            # The terminate selector will ignore the 'poi.confirm.quit' setting
            # and try to close any (plugin) window it can close first.
            # So here we should only try to close the main window and let it handle all the rest.
            remote.getCurrentWindow().focus()
            window.close()
        }
      ]
    },
    {
      label: 'Edit'
      submenu: [
        {
          label: 'Undo'
          accelerator: 'CmdOrCtrl+Z'
          role: 'undo'
        },
        {
          label: 'Redo'
          accelerator: 'Shift+CmdOrCtrl+Z'
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: 'Cut'
          accelerator: 'CmdOrCtrl+X'
          role: 'cut'
        },
        {
          label: 'Copy'
          accelerator: 'CmdOrCtrl+C'
          role: 'copy'
        },
        {
          label: 'Paste'
          accelerator: 'CmdOrCtrl+V'
          role: 'paste'
        },
        {
          label: 'Select All'
          accelerator: 'CmdOrCtrl+A'
          role: 'selectall'
        }
      ]
    },
    {
      label: 'View'
      submenu: [
        {
          label: 'Reload'
          accelerator: 'CmdOrCtrl+R'
          click: (item, focusedWindow) ->
            exeCodeOnWindowHasReloadArea(focusedWindow, 'reload()')
        },
        {
          label: 'Stop'
          accelerator: 'CmdOrCtrl+.'
          click: (item, focusedWindow) ->
            exeCodeOnWindowHasReloadArea(focusedWindow, 'stop()')
        },
        { type: 'separator' },
        {
          label: 'Open Developer Tools'
          accelerator: 'Alt+CmdOrCtrl+I'
          click: (item, focusedWindow) ->
            focusedWindow.openDevTools({detach: true})
        },
        {
          label: 'Open Developer Tools of WebView'
          click: (item, focusedWindow) ->
            exeCodeOnWindowHasReloadArea(focusedWindow, 'openDevTools({detach: true})')
        }
      ]
    },
    {
      label: 'Themes'
      submenu: [
        {
          label: 'Apply Theme'
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Next Theme'
          accelerator: 'CmdOrCtrl+T'
          click: (item, focusedWindow) ->
            all = window.allThemes
            nextTheme = all[(all.indexOf(window.theme) + 1) % all.length]
            window.applyTheme nextTheme
        },
        {
          label: 'Previous Theme'
          accelerator: 'CmdOrCtrl+Shift+T'
          click: (item, focusedWindow) ->
            all = window.allThemes
            prevTheme = all[(all.indexOf(window.theme) + all.length - 1) % all.length]
            window.applyTheme prevTheme
        }
      ]
    },
    {
      label: 'Window'
      role: 'window'
      submenu: [
        {
          label: 'Minimize'
          accelerator: 'CmdOrCtrl+M'
          role: 'minimize'
        },
        {
          label: 'Close'
          accelerator: 'CmdOrCtrl+W'
          role: 'close'
        },
        { type: 'separator' },
        {
          label: 'Bring All to Front'
          role: 'front'
        }
      ]
    },
    {
      label: 'Help'
      role: 'help'
      submenu: [
        {
          label: 'Wiki'
          click: ->
            openExternal 'https://github.com/poooi/poi/wiki'
        },
        {
          label: 'Poi Statistics'
          click: ->
            openExternal 'http://db.kcwiki.moe/'
        },
        { type: 'separator' },
        {
          label: 'Report Issue'
          click: ->
            openExternal 'https://github.com/poooi/poi/issues'
        },
        {
          label: 'Search Issues'
          click: ->
            openExternal 'https://github.com/issues?q=+is%3Aissue+user%3Apoooi'
        }
      ]
    }
  ]
  window.allThemes.map (th) ->
    template[3].submenu[0].submenu.push
      label: if th is '__default__' then 'Default' else th.charAt(0).toUpperCase() + th.slice(1)
      type: 'radio'
      checked: window.theme is th
      click: (item, focusedWindow) ->
        if th isnt window.theme
          window.applyTheme th
  {Menu} = remote.require('electron')
  appMenu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(appMenu)
  # Ugly hard-coded hack... Hope Electron can provide some better interface in the future...
  themeMenuList = appMenu.items[3].submenu.items[0].submenu.items
  window.addEventListener 'theme.change', (e) ->
    themeMenuList[window.allThemes.indexOf(e.detail.theme)].checked = true

# Main tabbed area
ControlledTabArea =
  if config.get('poi.tabarea.double', false)
    require './double-tabareas'
  else
    require './single-tabarea'

# Alert info
PoiAlert = React.createClass
  getInitialState: ->
    message: __ 'Waiting for response...'
    type: 'default'
    overflow: false
    messagewidth: 0

  updateAlert:  ->
    # Must set innerHTML before getting offsetWidth
    document.getElementById('alert-area').innerHTML = @message
    if document.getElementById('alert-container').offsetWidth < document.getElementById('alert-area').offsetWidth
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
  componentWillUnmount: ->
    window.removeEventListener 'poi.alert', @handleAlert
  render: ->
    <Alert id='alert-container' bsStyle={null} style={overflow: 'hidden'} className="alert-#{@messageType}">
      <div className='alert-position' style={width: @state.messageWidth}>
        <span id='alert-area' className={@state.overflowAnim}>
          {@state.message}
        </span>
      </div>
    </Alert>

# Map Reminder
PoiMapReminder = React.createClass
  getInitialState: ->
    battling: __ 'Not in sortie'
  mapRanks: ['', '丙', '乙', '甲']
  handleResponse: (e) ->
    reqPath = e.detail.path
    {body} = e.detail
    switch reqPath
      when '/kcsapi/api_port/port'
        @setState
          battling: __ 'Not in sortie'
      when '/kcsapi/api_req_map/start'
        txt = "#{__ 'Sortie area'}: #{body.api_maparea_id}-#{body.api_mapinfo_no}"
        mapId = "#{body.api_maparea_id}#{body.api_mapinfo_no}"
        if window._eventMapRanks?[mapId]?
          txt += " " + @mapRanks[window._eventMapRanks[mapId]]
        @setState
          battling: txt
  componentDidMount: ->
    window.addEventListener 'game.response', @handleResponse
  componentWillUnmount: ->
    window.removeEventListener 'game.response', @handleResponse
  render: ->
    <Alert className={"alert-default"}  bsStyle={null}
        style={if !window.isDarkTheme then color: 'black' else color: 'white'}>
      {@state.battling}
    </Alert>

# Controller icon bar
{capturePageInMainWindow} = remote.require './lib/utils'
PoiControl = React.createClass
  getInitialState: ->
    muted: false
    alwaysOnTop: false
    extend: false
    resizeable: true
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
    remote.getCurrentWindow().openDevTools
      detach: true
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
  componentDidMount: ->
    setTimeout =>
      try
        if config.get 'poi.content.muted', false
          @handleSetMuted()
        if config.get 'poi.content.alwaysOnTop', false
          @handleSetAlwaysOnTop()
        if !(config.get 'poi.content.resizeable', true)
          @handleSetResizable()
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

# Notification modal
ModalTrigger = React.createClass
  getInitialState: ->
    isModalOpen: false
    title: null
    content: null
  handleToggle: ->
    window.modalLocked = false
    @setState
      isModalOpen: false
    window.showModal()
  handleModal: (e) ->
    window.modalLocked = true
    @setState
      isModalOpen: true
      title: e.detail.title
      content: e.detail.content
      footer: e.detail.footer
  componentDidMount: ->
    window.addEventListener 'poi.modal', @handleModal
  componentWillUnmount: ->
    window.removeEventListener 'poi.modal', @handleModal
  renderFooter: (footer) ->
    return unless footer? and footer.length? and footer.length > 0
    self = @
    footer.map (button, index) ->
      <Button key={index} onClick={
        (e) ->
          self.handleToggle()
          button.func()
      } bsStyle={button.style}>{button.name}</Button>
  render: ->
    <Modal autoFocus={true}
           animation={true}
           show={@state.isModalOpen}
           onHide={@handleToggle}>
      <Modal.Header closeButton>
        <Modal.Title>{@state.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {@state.content}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={@handleToggle}>{__ 'Close'}</Button>
        {@renderFooter @state.footer}
      </Modal.Footer>
    </Modal>

# Custom css injector
CustomCssInjector = React.createClass
  render: ->
    cssPath = path.join window.EXROOT, 'hack', 'custom.css'
    fs.ensureFileSync cssPath
    <link rel='stylesheet' id='custom-css' href={cssPath} />

ReactDOM.render <PoiAlert id='poi-alert' />, $('poi-alert')
ReactDOM.render <PoiMapReminder id='poi-map-reminder'/>, $('poi-map-reminder')
ReactDOM.render <PoiControl />, $('poi-control')
ReactDOM.render <ModalTrigger />, $('poi-modal-trigger')
ReactDOM.render <ControlledTabArea />, $('poi-nav-tabs')
ReactDOM.render <CustomCssInjector />, $('poi-css-injector')

# Readme contents
dontShowAgain = ->
  config.set('poi.first', POI_VERSION)
if config.get('poi.first', '0.0.0') != POI_VERSION
  title = 'README'
  content =
    <div>
      <p>诶嘿！欢迎使用 poi v{POI_VERSION}！使用之前看看下面！</p>
      <p style={color: '#FFCCFF', fontWeight: 'bold', fontSize: 'large'}>poi 不会修改任何游戏内的发包与收包，但是请使用可信的 poi 版本和可信的插件！</p>
      <p>poi 默认不使用代理。更改代理的设置在设置面板中可以找到。
      <ul>
        <li>使用岛风go的选择HTTP代理，地址是127.0.0.1，端口8099。（默认情况下）</li>
        <li>使用自己本地的Shadowsocks或者Socks5代理的选择Socks5代理。</li>
        <li>使用VPN的选择不使用代理就好了。</li>
      </ul></p>
      <p>poi 如果有显示错误，可以手动调整一下内容大小，布局会自动适配。</p>
      <p>如果 poi 的运行不流畅，可以在设置中关闭一部分插件，对插件的操作重启后生效。</p>
      <p>更多帮助参考 poi wiki - https://github.com/poooi/poi/wiki </p>
      <p>poi 交流群：378320628</p>
      <p>为 poi 贡献代码和编写插件 - GitHub: https://github.com/poooi/poi </p>
    </div>
  footer = [
    name: __ 'I know'
    func: dontShowAgain
    style: 'success'
  ]
  window.toggleModal title, content, footer

refreshFlash = ->
  $('kan-game webview').executeJavaScript """
    var doc;
    if (document.getElementById('game_frame')) {
      doc = document.getElementById('game_frame').contentDocument;
    } else {
      doc = document;
    }
    var flash = doc.getElementById('flashWrap');
    if(flash) {
      var flashInnerHTML = flash.innerHTML;
      flash.innerHTML = '';
      flash.innerHTML = flashInnerHTML;
    }
  """
# F5 & Ctrl+F5 & Alt+F5
window.addEventListener 'keydown', (e) ->
  if process.platform == 'darwin' and e.keyCode is 82 and e.metaKey
    if e.shiftKey # cmd + shift + r
      $('kan-game webview').reloadIgnoringCache()
    else if e.altKey # cmd + alt + r
      refreshFlash()
    else # cmd + r
      # Catched by menu
      # $('kan-game webview').reload()
      false
  else if e.keyCode is 116
    if e.ctrlKey # ctrl + f5
      $('kan-game webview').reloadIgnoringCache()
    else if e.altKey # alt + f5
      refreshFlash()
    else if !e.metaKey # f5
      $('kan-game webview').reload()

# Confirm before quit
confirmExit = false
exitPoi = ->
  confirmExit = true
  window.close()
window.onbeforeunload = (e) ->
  if confirmExit || !config.get('poi.confirm.quit', false)
    e.returnValue = true
  else
    toggleModal __('Exit'), __('Confirm?'), [
      name: __ 'Confirm'
      func: exitPoi
      style: 'warning'
    ]
    e.returnValue = false

window.addEventListener 'game.request', (e) ->
  {method} = e.detail
  resPath = e.detail.path
window.addEventListener 'game.response', (e) ->
  {method, body, postBody} = e.detail
  resPath = e.detail.path
  console.log [resPath, body, postBody] if process.env.DEBUG?
  log "#{__ 'Hit'} #{method} #{resPath}"
window.addEventListener 'network.error.retry', (e) ->
  {counter} = e.detail
  error __n 'Network error, Retrying %s time', 'Network error, Retrying %s times', counter
window.addEventListener 'network.invalid.code', (e) ->
  {code} = e.detail
  error __ 'Network error: HTTP %s', code
window.addEventListener 'network.error', ->
  error __ 'Connection failed.'
