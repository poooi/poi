require 'coffee-react/register'
path = require 'path-extra'
notifier = require 'node-notifier'

# Environments
window.remote = require 'remote'
window.ROOT = path.join(__dirname, '..')
window.EXROOT = remote.getGlobal 'EXROOT'
window.APPDATA_PATH = remote.getGlobal 'APPDATA_PATH'
window.POI_VERSION = remote.getGlobal 'POI_VERSION'
window.SERVER_HOSTNAME = remote.getGlobal 'SERVER_HOSTNAME'

# Shortcuts and Components
window._ = require 'underscore'
window.$ = (param) -> document.querySelector(param)
window.$$ = (param) -> document.querySelectorAll(param)
window.jQuery = require path.join(ROOT, 'components/jquery/dist/jquery')
window.React = require 'react'
window.ReactBootstrap = require 'react-bootstrap'
window.FontAwesome = require 'react-fontawesome'

{remoteStringify} = remote.require './lib/utils'

# Utils
Object.clone = (obj) ->
  JSON.parse JSON.stringify obj
Object.remoteClone = (obj) ->
  JSON.parse remoteStringify obj
window.resolveTime = (seconds) ->
  return '' if seconds < 0
  hours = Math.floor(seconds / 3600)
  seconds -= hours * 3600
  minutes = Math.floor(seconds / 60)
  seconds -= minutes * 60
  seconds = Math.floor(seconds)
  hours = "0#{hours}" if hours < 10
  minutes = "0#{minutes}" if minutes < 10
  seconds = "0#{seconds}" if seconds < 10
  "#{hours}:#{minutes}:#{seconds}"
window.log = (msg) ->
  event = new CustomEvent 'poi.alert',
    bubbles: true
    cancelable: true
    detail:
      message: msg
      type: 'info'
  window.dispatchEvent event
window.success = (msg) ->
  event = new CustomEvent 'poi.alert',
    bubbles: true
    cancelable: true
    detail:
      message: msg
      type: 'success'
  window.dispatchEvent event
window.warn = (msg) ->
  event = new CustomEvent 'poi.alert',
    bubbles: true
    cancelable: true
    detail:
      message: msg
      type: 'warning'
  window.dispatchEvent event
window.error = (msg) ->
  event = new CustomEvent 'poi.alert',
    bubbles: true
    cancelable: true
    detail:
      message: msg
      type: 'danger'
  window.dispatchEvent event
window.notify = (msg, options) ->
  # Basic notification settings
  enabled = config.get('poi.notify.enabled', true)
  sound = config.get('poi.notify.sound', true)
  audio = config.get('poi.notify.audio', "file://#{ROOT}/assets/audio/poi.mp3")
  # Advanced notification settings
  if enabled
    switch options?.type
      when 'construction'
        enabled = config.get('poi.notify.construction.enabled', enabled)
      when 'expedition'
        enabled = config.get('poi.notify.expedition.enabled', enabled)
      when 'repair'
        enabled = config.get('poi.notify.repair.enabled', enabled)
      when 'morale'
        enabled = config.get('poi.notify.morale.enabled', enabled)
      else
        enabled = config.get('poi.notify.others.enabled', enabled)
  if sound
    switch options?.type
      when 'construction'
        audio = config.get('poi.notify.construction.audio', audio)
      when 'expedition'
        audio = config.get('poi.notify.expedition.audio', audio)
      when 'repair'
        audio = config.get('poi.notify.repair.audio', audio)
      when 'morale'
        audio = config.get('poi.notify.morale.audio', audio)
  # Send desktop notification
  if !enabled
    return
  if process.platform == 'win32'
    notifier.notify
      title: 'poi'
      message: msg
      icon: options?.icon || path.join(ROOT, 'assets', 'icons', 'icon.png')
      sound: false
  else
    new Notification 'poi',
      icon: if options?.icon then "file://#{options.icon}" else "file://#{ROOT}/assets/icons/icon.png"
      body: msg
  # Play notification sound
  #   According to MDN Notification API docs: https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification
  #   Parameter `sound` is not supported in any browser yet, so we play sound manually.
  if !sound
    return
  sound = new Audio(audio)
  sound.play()
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
window.proxy = remote.require './lib/proxy'
window.CONST = Object.remoteClone remote.require './lib/constant'

# User configs
window.layout = config.get 'poi.layout', 'horizonal'
window.webviewWidth = config.get 'poi.webview.width', -1

# Custom theme
window.theme = config.get 'poi.theme', '__default__'
window.isDarkTheme = theme.indexOf('dark') != -1 or theme == 'slate' or theme == 'superhero'
if theme == '__default__'
  $('#bootstrap-css')?.setAttribute 'href', "file://#{ROOT}/components/bootstrap/dist/css/bootstrap.css"
else
  $('#bootstrap-css')?.setAttribute 'href', "file://#{ROOT}/assets/themes/#{theme}/css/#{theme}.css"
window.addEventListener 'theme.change', (e) ->
  window.theme = e.detail.theme
  window.isDarkTheme = theme.indexOf('dark') != -1 or theme == 'slate' or theme == 'superhero'
  if theme == '__default__'
    $('#bootstrap-css')?.setAttribute 'href', "file://#{ROOT}/components/bootstrap/dist/css/bootstrap.css"
  else
    $('#bootstrap-css')?.setAttribute 'href', "file://#{ROOT}/assets/themes/#{theme}/css/#{theme}.css"

# Global data resolver
proxy.addListener 'game.on.request', (method, path, body) ->
  # Important! Clone a copy of proxy objects!
  body = Object.remoteClone body
  event = new CustomEvent 'game.request',
    bubbles: true
    cancelable: true
    detail:
      method: method
      path: path
      body: body
  window.dispatchEvent event

start2Version = 0
initStart2Value = ->
  if localStorage.start2Version?
    start2Version = localStorage.start2Version
  body = localStorage.start2Body
  if body?
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
    [method, path, body, postBody] = responses.shift()
    # Important! Clone a copy of proxy objects!
    body = Object.remoteClone body
    postBody = Object.remoteClone postBody
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
        if start2Version > localStorage.start2Version
          localStorage.start2Version = start2Version
          localStorage.start2Body = body
      # User datas prefixed by _
      when '/kcsapi/api_get_member/basic'
        window._teitokuLv = body.api_level
        window._nickNameId = body.api_nickname_id
      when '/kcsapi/api_get_member/deck'
        window._decks[deck.api_id - 1] = deck for deck in body
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
      when '/kcsapi/api_req_mission/result'
        window._teitokuLv = body.api_member_lv
      when '/kcsapi/api_req_nyukyo/speedchange'
        shipId = _ndocks[postBody.api_ndock_id - 1]
        _ships[shipId].api_nowhp = _ships[shipId].api_maxhp
      when '/kcsapi/api_req_nyukyo/start'
        if postBody.api_highspeed == '1'
          shipId = parseInt postBody.api_ship_id
          _ships[shipId].api_nowhp = _ships[shipId].api_maxhp
      when '/kcsapi/api_req_practice/battle_result'
        window._teitokuLv = body.api_member_lv
      when '/kcsapi/api_req_sortie/battleresult'
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
  locked = false
proxy.addListener 'game.on.response', (method, path, body, postBody) ->
  responses.push [method, path, body, postBody]
  resolveResponses() if !locked
proxy.addListener 'game.start', ->
  window.dispatchEvent new Event 'game.start'
proxy.addListener 'game.payitem', ->
  window.dispatchEvent new Event 'game.payitem'
proxy.addListener 'network.error.retry', (counter) ->
  event = new CustomEvent 'network.error.retry',
    bubbles: true
    cancelable: true
    detail:
      counter: counter
  window.dispatchEvent event
proxy.addListener 'network.invalid.code', (code) ->
  event = new CustomEvent 'network.invalid.code',
    bubbles: true
    cancelable: true
    detail:
      code: code
  window.dispatchEvent event
proxy.addListener 'network.error', ->
  window.dispatchEvent new Event 'network.error'
