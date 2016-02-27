require 'coffee-react/register'
require('babel-register')(require('../babel.config'))
path = require 'path-extra'
fs = require 'fs-extra'
os = require 'os'
semver = require 'semver'
glob = require 'glob'

# Environments
window.remote = require('electron').remote
window.ROOT = path.join(__dirname, '..')
window.EXROOT = remote.getGlobal 'EXROOT'
window.APPDATA_PATH = remote.getGlobal 'APPDATA_PATH'
window.PLUGIN_PATH = path.join window.APPDATA_PATH, 'plugins'
window.POI_VERSION = remote.getGlobal 'POI_VERSION'
window.SERVER_HOSTNAME = remote.getGlobal 'SERVER_HOSTNAME'
window.MODULE_PATH = remote.getGlobal 'MODULE_PATH'
window.appIcon = remote.getGlobal 'appIcon'
fs.ensureDirSync window.PLUGIN_PATH
fs.ensureDirSync path.join window.PLUGIN_PATH, 'node_modules'

# Shortcuts and Components
(window.dbg = require path.join(ROOT, 'lib', 'debug')).init()
window._ = require 'underscore'
window.$ = (param) -> document.querySelector(param)
window.$$ = (param) -> document.querySelectorAll(param)
window.jQuery = require path.join(ROOT, 'components/jquery/dist/jquery')
window.React = require 'react'
window.ReactDOM = require 'react-dom'
window.ReactBootstrap = require 'react-bootstrap'
window.FontAwesome = require 'react-fontawesome'
{remoteStringify} = remote.require './lib/utils'

# Utils
Object.clone = (obj) ->
  JSON.parse JSON.stringify obj
Object.remoteClone = (obj) ->
  JSON.parse remoteStringify obj

pad = (n) ->
  if n < 10 then "0#{n}" else n
window.resolveTime = (seconds) ->
  seconds = parseInt seconds
  if seconds >= 0
    s = seconds % 60
    m = Math.trunc(seconds / 60) % 60
    h = Math.trunc(seconds / 3600)
    "#{pad h}:#{pad m}:#{pad s}"
  else
    ''
window.timeToString = (milliseconds) ->
  date = new Date(milliseconds)
  date.toTimeString().slice(0, 8)  # HH:mm:ss

## window.notify
# msg=null: Sound-only notification.
NOTIFY_DEFAULT_ICON = path.join(ROOT, 'assets', 'icons', 'icon.png')
NOTIFY_NOTIFICATION_API = true
if process.platform == 'win32' and semver.lt(os.release(), '6.2.0')
  NOTIFY_NOTIFICATION_API = false
notify_isPlayingAudio = {}
window.notify = (msg, options) ->
  # Notification config
  enabled = config.get('poi.notify.enabled', true)
  volume = config.get('poi.notify.volume', 0.8)
  title = 'poi'
  icon = NOTIFY_DEFAULT_ICON
  audio = config.get('poi.notify.audio', "file://#{ROOT}/assets/audio/poi.mp3")
  type = options?.type || "others"

  if type in ['construction', 'expedition', 'repair', 'morale']
    enabled = config.get("poi.notify.#{type}.enabled", enabled) if enabled
    audio = config.get("poi.notify.#{type}.audio", audio)
  else
    enabled = config.get("poi.notify.others.enabled", enabled) if enabled
  # Overwrite by options
  if options?
    title = options.title if options.title
    icon = options.icon if options.icon
    audio = options.audio if options.audio

  # Send desktop notification
  #   According to MDN Notification API docs: https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification
  #   Parameter `sound` is not supported in any browser yet, so we play sound manually.
  return unless enabled
  if msg?
    if NOTIFY_NOTIFICATION_API
      new Notification title,
        icon: "file://#{icon}"
        body: msg
        silent: true
    else
      try
        appIcon.displayBalloon
          title: title
          icon: icon
          content: msg
        appIcon.on 'balloon-click', remote.getGlobal('mainWindow').focus

  if volume > 0.0001
    sound = new Audio(audio)
    sound.volume = volume
    sound.oncanplaythrough = ->
      if !notify_isPlayingAudio[type]
        notify_isPlayingAudio[type] = true
        sound.play()
    sound.onended = ->
      notify_isPlayingAudio[type] = false

modals = []
window.modalLocked = false
window.toggleModal = (title, content, footer) ->
  modals.push
    title: title
    content: content
    footer: footer
  window.showModal() if !window.modalLocked
window.showModal = ->
  return if modals.length == 0
  {title, content, footer} = modals.shift()
  event = new CustomEvent 'poi.modal',
    bubbles: true
    cancelable: true
    detail:
      title: title
      content: content
      footer: footer
  window.dispatchEvent event

# Node modules
window.config = remote.require './lib/config'
window.ipc = remote.require './lib/ipc'
window.proxy = remote.require './lib/proxy'
window.CONST = Object.remoteClone remote.require './lib/constant'

checkLayout = (layout) ->
  if layout isnt 'horizontal' and layout isnt 'vertical' and layout isnt 'L'
    layout = 'horizontal'
    config.set 'poi.layout', layout
  layout

# User configs
language = navigator.language
if !(language in ['zh-CN', 'zh-TW', 'ja-JP', 'en-US'])
  switch language.substr(0,1).toLowerCase()
    when 'zh'
      language = 'zh-TW'
    when 'ja'
      language = 'ja-JP'
    else
      language = 'en-US'
window.layout = checkLayout(config.get 'poi.layout', 'horizontal')
window.doubleTabbed = config.get 'poi.tabarea.double', false
window.webviewWidth = config.get 'poi.webview.width', -1
window.webviewFactor = 1
window.language = config.get 'poi.language', language
window.zoomLevel = config.get 'poi.zoomLevel', 1
window.useSVGIcon = config.get 'poi.useSVGIcon', false
d = if process.platform == 'darwin' then path.join(path.homedir(), 'Pictures', 'Poi') else path.join(global.APPDATA_PATH, 'screenshots')
window.screenshotPath = config.get 'poi.screenshotPath', d
window.notify.morale = config.get 'poi.notify.morale.value', 49
window.notify.expedition = config.get 'poi.notify.expedition.value', 60

# i18n config
window.i18n = {}
i18nFiles = glob.sync(path.join(__dirname, '..', 'i18n', '*'))
for i18nFile in i18nFiles
  namespace = path.basename i18nFile
  window.i18n[namespace] = new (require 'i18n-2')
    locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW'],
    defaultLocale: 'zh-CN',
    directory: i18nFile,
    updateFiles: false,
    indent: "\t",
    extension: '.json'
    devMode: false
  window.i18n[namespace].setLocale(window.language)
window.i18n.resources = {}
window.i18n.resources.__ = (str) -> return str
window.i18n.resources.translate = (locale, str) -> return str
window.i18n.resources.setLocale = (str) -> return

# Alert helpers.
#   Requires: window.i18n
{newAlert} = require './components/info/alert'
DEFAULT_STICKYFOR = 3*1000  # Milliseconds
window.log = (msg, options) -> newAlert Object.assign
  message: msg
  type: 'default'
  priority: 0
  stickyFor: DEFAULT_STICKYFOR
  , options
window.success = (msg, options) -> newAlert Object.assign
  message: msg
  type: 'success'
  priority: 1
  stickyFor: DEFAULT_STICKYFOR
  , options
window.warn = (msg, options) -> newAlert Object.assign
  message: msg
  type: 'warning'
  priority: 2
  stickyFor: DEFAULT_STICKYFOR
  , options
window.error = (msg, options) -> newAlert Object.assign
  message: msg
  type: 'warning'
  priority: 4
  stickyFor: DEFAULT_STICKYFOR
  , options

#Custom css
window.reloadCustomCss = ->
  $('#custom-css')?.setAttribute 'href', "file://#{EXROOT}/hack/custom.css"

# Custom theme
# You should call window.applyTheme() to apply a theme properly.
window.loadTheme = (th) ->
  window.theme = th
  window.isDarkTheme = /(dark|black|slate|superhero|papercyan)/i.test th
  if theme == '__default__'
    $('#bootstrap-css')?.setAttribute 'href', "file://#{ROOT}/components/bootstrap/dist/css/bootstrap.css"
  else
    $('#bootstrap-css')?.setAttribute 'href', "file://#{ROOT}/assets/themes/#{theme}/css/#{theme}.css"
  window.reloadCustomCss()
window.applyTheme = (th) ->
  config.set 'poi.theme', th
  window.loadTheme th
  event = new CustomEvent 'theme.change',
    bubbles: true
    cancelable: true
    detail:
      theme: th
  window.dispatchEvent event

window.allThemes = ['__default__'].concat(require('glob').sync("#{ROOT}/assets/themes/*/").map (dirPath) -> path.basename(dirPath))
config.setDefault 'poi.theme', 'paperdark'
window.loadTheme(config.get 'poi.theme', 'paperdark')

# Not sure where this function should go, leave it here just for now, for easy access.
window.getCondStyle = (cond) ->
  s = 'poi-ship-cond-'
  if cond > 52
    s += '53'
  else if cond > 49
    s += '50'
  else if cond == 49
    s += '49'
  else if cond > 39
    s += '40'
  else if cond > 29
    s += '30'
  else if cond > 19
    s += '20'
  else
    s += '0'
  s += if isDarkTheme then ' dark' else ' light'


# Global data resolver

handleProxyGameOnRequest = (method, path, body) ->
  # Parse the json object
  try
    body = JSON.parse body
    event = new CustomEvent 'game.request',
      bubbles: true
      cancelable: true
      detail:
        method: method
        path: path
        body: body
    window.dispatchEvent event
  catch e
    console.log e

start2Version = 0
initStart2Value = ->
  if localStorage.start2Version?
    start2Version = parseInt localStorage.start2Version
    # We need a hack to deal with Infinity for historical reasons.
    if start2Version > 0xFFFFFFFF
      start2Version = 0
      localStorage.start2Version = 0
  if localStorage.start2Body?
    body = JSON.parse localStorage.start2Body
    window.$ships = []
    $ships[ship.api_id] = ship for ship in body.api_mst_ship
    window.$shipTypes = []
    $shipTypes[stype.api_id] = stype for stype in body.api_mst_stype
    window.$slotitems = []
    $slotitems[slotitem.api_id] = slotitem for slotitem in body.api_mst_slotitem
    window.$slotitemTypes = []
    $slotitemTypes[slotitemtype.api_id] = slotitemtype for slotitemtype in body.api_mst_slotitem_equiptype
    window.$mapareas = []
    $mapareas[maparea.api_id] = maparea for maparea in body.api_mst_maparea
    window.$maps = []
    $maps[map.api_id] = map for map in body.api_mst_mapinfo
    window.$missions = []
    $missions[mission.api_id] = mission for mission in body.api_mst_mission
    window.$useitems = []
    $useitems[useitem.api_id] = useitem for useitem in body.api_mst_useitem
initStart2Value()

responses = []
locked = false
resolveResponses = ->
  extendShip = (ship) ->
    _.extend _.clone(window.$ships[ship.api_ship_id]), ship
  extendSlotitem = (item) ->
    _.extend _.clone(window.$slotitems[item.api_slotitem_id]), item
  locked = true
  while responses.length > 0
    `var path;` # HACK: Force shadowing an variable `path`;
    [method, path, body, postBody] = responses.shift()
    try
      # Delete api_token
      delete postBody.api_token if postBody?.api_token?
      # Fix api
      body.api_level = parseInt body.api_level if body?.api_level?
      body.api_member_lv = parseInt body.api_member_lv if body?.api_member_lv?
      switch path
        # Game datas prefixed by $
        when '/kcsapi/api_start2'
          start2Version += 1
          window.$ships = []
          $ships[ship.api_id] = ship for ship in body.api_mst_ship
          window.$shipTypes = []
          $shipTypes[stype.api_id] = stype for stype in body.api_mst_stype
          window.$slotitems = []
          $slotitems[slotitem.api_id] = slotitem for slotitem in body.api_mst_slotitem
          window.$slotitemTypes = []
          $slotitemTypes[slotitemtype.api_id] = slotitemtype for slotitemtype in body.api_mst_slotitem_equiptype
          window.$mapareas = []
          $mapareas[maparea.api_id] = maparea for maparea in body.api_mst_maparea
          window.$maps = []
          $maps[map.api_id] = map for map in body.api_mst_mapinfo
          window.$missions = []
          $missions[mission.api_id] = mission for mission in body.api_mst_mission
          window.$useitems = []
          $useitems[useitem.api_id] = useitem for useitem in body.api_mst_useitem
          # updating start2Body while avoiding body from being updated by multi-plugins
          if not localStorage.start2Version? or start2Version > localStorage.start2Version
            localStorage.start2Version = start2Version % 0xFFFFFFFF
            localStorage.start2Body = JSON.stringify body
          window.dispatchEvent new Event 'initialize.complete'
        # User datas prefixed by _
        when '/kcsapi/api_get_member/basic'
          window._teitokuLv = body.api_level
          window._nickName = body.api_nickname
          window._nickNameId = body.api_nickname_id
          window._teitokuExp = body.api_experience
          window._teitokuId = body.api_member_id
        when '/kcsapi/api_get_member/deck'
          window._decks[deck.api_id - 1] = deck for deck in body
        when '/kcsapi/api_get_member/mapinfo'
          window._eventMapRanks = {}
          for map in body
            if map.api_eventmap?.api_selected_rank?
              window._eventMapRanks[map.api_id] = map.api_eventmap.api_selected_rank
        when '/kcsapi/api_get_member/ndock'
          window._ndocks = body.map (e) -> e.api_ship_id
        when '/kcsapi/api_get_member/ship_deck'
          window._decks[deck.api_id - 1] = deck for deck in body.api_deck_data
          for ship in body.api_ship_data
            _ships[ship.api_id] = extendShip ship
        when '/kcsapi/api_get_member/ship2'
          for ship in body
            _ships[ship.api_id] = extendShip ship
        when '/kcsapi/api_get_member/ship3'
          window._decks[deck.api_id - 1] = deck for deck in body.api_deck_data
          for ship in body.api_ship_data
            _ships[ship.api_id] = extendShip ship
        when '/kcsapi/api_get_member/slot_item'
          window._slotitems = {}
          _slotitems[item.api_id] = extendSlotitem item for item in body
        when '/kcsapi/api_port/port'
          window._ships = {}
          _ships[ship.api_id] = extendShip ship for ship in body.api_ship
          window._decks = body.api_deck_port
          window._ndocks = body.api_ndock.map (e) -> e.api_ship_id
          window._teitokuLv = body.api_basic.api_level
        when '/kcsapi/api_req_hensei/change'
          decks = window._decks
          deckId = parseInt(postBody.api_id) - 1
          idx = parseInt(postBody.api_ship_idx)
          curId = decks[deckId].api_ship[idx]
          shipId = parseInt(postBody.api_ship_id)
          # Remove all
          if idx == -1
            decks[deckId].api_ship[i] = -1 for i in [1..5]
          # Empty -> One
          else if curId == -1
            [x, y] = [-1, -1]
            for deck, i in decks
              for ship, j in deck.api_ship
                if ship == shipId
                  [x, y] = [i, j]
                  break
            decks[deckId].api_ship[idx] = shipId
            # Empty to ship in deck
            if x != -1 && y != -1
              if y <= 4
                for i in [y..4]
                  decks[x].api_ship[i] = decks[x].api_ship[i + 1]
              decks[x].api_ship[5] = -1
          # One -> Empty
          else if shipId == -1
            if idx <= 4
              for i in [idx..4]
                decks[deckId].api_ship[i] = decks[deckId].api_ship[i + 1]
            decks[deckId].api_ship[5] = -1
          else
            [x, y] = [-1, -1]
            for deck, i in decks
              for ship, j in deck.api_ship
                if ship == shipId
                  [x, y] = [i, j]
                  break
            decks[deckId].api_ship[idx] = shipId
            # Exchange
            decks[x].api_ship[y] = curId if x != -1 && y != -1
        when '/kcsapi/api_req_hensei/lock'
          _ships[parseInt(postBody.api_ship_id)].api_locked = body.api_locked
        when '/kcsapi/api_req_hensei/preset_select'
          decks = window._decks
          deckId = parseInt(postBody.api_deck_id) - 1
          decks[deckId] = body
        when '/kcsapi/api_req_hokyu/charge'
          for ship in body.api_ship
            _ships[ship.api_id] = _.extend _ships[ship.api_id], ship
        when '/kcsapi/api_req_kaisou/powerup'
          for shipId in postBody.api_id_items.split(',')
            idx = parseInt(shipId)
            for itemId in _ships[idx].api_slot
              continue if itemId == -1
              delete _slotitems[itemId]
            delete _ships[idx]
          _ships[body.api_ship.api_id] = extendShip body.api_ship
          window._decks = body.api_deck
        when '/kcsapi/api_req_kaisou/slotset'
          _ships[parseInt(postBody.api_id)].api_slot[parseInt(postBody.api_slot_idx)] = parseInt(postBody.api_item_id)
        when '/kcsapi/api_req_kaisou/slot_exchange_index'
          _ships[parseInt(postBody.api_id)].api_slot = body.api_slot
        when '/kcsapi/api_req_kaisou/lock'
          _slotitems[parseInt(postBody.api_slotitem_id)].api_locked = body.api_locked
        when '/kcsapi/api_req_kousyou/createitem'
          _slotitems[body.api_slot_item.api_id] = extendSlotitem body.api_slot_item if body.api_create_flag == 1
        when '/kcsapi/api_req_kousyou/destroyitem2'
          for itemId in postBody.api_slotitem_ids.split(',')
            delete _slotitems[parseInt(itemId)]
        when '/kcsapi/api_req_kousyou/destroyship'
          decks = window._decks
          removeId = parseInt(postBody.api_ship_id)
          [x, y] = [-1, -1]
          for deck, i in decks
            for shipId, j in deck.api_ship
              if shipId == removeId
                [x, y] = [i, j]
                break
          if x != -1 && y != -1
            if y == 5
              decks[x].api_ship[y] = -1
            else
              for idx in [y..4]
                decks[x].api_ship[idx] = decks[x].api_ship[idx + 1]
              decks[x].api_ship[5] = -1
          for itemId in _ships[removeId].api_slot
            continue if itemId == -1
            delete _slotitems[itemId]
          delete _ships[removeId]
        when '/kcsapi/api_req_kousyou/getship'
          _ships[body.api_ship.api_id] = extendShip body.api_ship
          if body.api_slotitem?
            _slotitems[item.api_id] = extendSlotitem item for item in body.api_slotitem
        when '/kcsapi/api_req_kousyou/remodel_slot'
          if body.api_use_slot_id?
            for itemId in body.api_use_slot_id
              delete _slotitems[itemId]
          if body.api_remodel_flag == 1 and body.api_after_slot?
            afterSlot = body.api_after_slot
            itemId = afterSlot.api_id
            _slotitems[itemId] = extendSlotitem afterSlot
        when '/kcsapi/api_req_map/select_eventmap_rank'
          window._eventMapRanks["#{postBody.api_maparea_id}#{postBody.api_map_no}"] = postBody.api_rank
        when '/kcsapi/api_req_mission/result'
          window._teitokuLv = body.api_member_lv
        when '/kcsapi/api_req_nyukyo/speedchange'
          shipId = _ndocks[postBody.api_ndock_id - 1]
          _ships[shipId].api_nowhp = _ships[shipId].api_maxhp
          _ships[shipId].api_cond = Math.max(40, _ships[shipId].api_cond)
          _ndocks[postBody.api_ndock_id - 1] = 0
        when '/kcsapi/api_req_nyukyo/start'
          if postBody.api_highspeed == '1'
            shipId = parseInt postBody.api_ship_id
            _ships[shipId].api_nowhp = _ships[shipId].api_maxhp
            _ships[shipId].api_cond = Math.max(40, _ships[shipId].api_cond)
        when '/kcsapi/api_req_practice/battle_result'
          window._teitokuExp = body.api_experience
          window._teitokuLv = body.api_member_lv
        when '/kcsapi/api_req_sortie/battleresult'
          window._teitokuExp = body.api_experience
          window._teitokuLv = body.api_member_lv
      event = new CustomEvent 'game.response',
        bubbles: true
        cancelable: true
        detail:
          method: method
          path: path
          body: body
          postBody: postBody
      window.dispatchEvent event
    catch err
      console.error err
  locked = false

handleProxyGameOnResponse = (method, path, body, postBody) ->
  # Parse the json object
  try
    responses.push [method, path, JSON.parse(body), JSON.parse(postBody)]
    resolveResponses() if !locked
  catch e
    console.log e

handleProxyGameStart = ->
  window.dispatchEvent new Event 'game.start'

handleProxyGamePayitem = ->
  window.dispatchEvent new Event 'game.payitem'

handleProxyNetworkErrorRetry = (counter) ->
  event = new CustomEvent 'network.error.retry',
    bubbles: true
    cancelable: true
    detail:
      counter: counter
  window.dispatchEvent event

handleProxyNetworkInvalidCode = (code) ->
  event = new CustomEvent 'network.invalid.code',
    bubbles: true
    cancelable: true
    detail:
      code: code
  window.dispatchEvent event

handleProxyNetworkError = ->
  window.dispatchEvent new Event 'network.error'

proxyListener =
  'game.on.request': handleProxyGameOnRequest
  'game.on.response': handleProxyGameOnResponse
  'game.start': handleProxyGameStart
  'game.payitem': handleProxyGamePayitem
  'network.error.retry': handleProxyNetworkErrorRetry
  'network.invalid.code': handleProxyNetworkInvalidCode
  'network.error': handleProxyNetworkError

window.listenerStatusFlag = false

addProxyListener = ()->
  if not window.listenerStatusFlag
    window.listenerStatusFlag = true
    for eventName, handler of proxyListener
      proxy.addListener eventName, handler

addProxyListener()

window.addEventListener 'load', ->
  addProxyListener()

window.addEventListener 'unload', ->
  if window.listenerStatusFlag
    window.listenerStatusFlag = false
    for eventName, handler of proxyListener
      proxy.removeListener eventName, handler
