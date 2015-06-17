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
  if process.platform == 'win32'
    notifier.notify
      title: 'poi'
      message: msg
      icon: options?.icon || path.join(ROOT, 'assets', 'icons', 'icon.png')
      sound: config.get('poi.notify.sound', true)
  else
    new Notification 'poi',
      icon: if options?.icon then "file://#{options.icon}" else "file://#{ROOT}/assets/icons/icon.png"
      body: msg
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

# User configs
window.layout = config.get 'poi.layout', 'horizonal'
window.gameScale = config.get 'poi.scale', 5.0 / 7.0
# Custom theme
window.theme = config.get 'poi.theme', '__default__'
if theme == '__default__'
  $('#bootstrap-css')?.setAttribute 'href', "file://#{ROOT}/components/bootstrap/dist/css/bootstrap.css"
else
  $('#bootstrap-css')?.setAttribute 'href', "file://#{ROOT}/assets/themes/#{theme}/css/#{theme}.css"
window.addEventListener 'theme.change', (e) ->
  window.theme = e.detail.theme
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
    switch path
      # Game datas prefixed by $
      when '/kcsapi/api_start2'
        window.$ships = []
        $ships[ship.api_id] = ship for ship in body.api_mst_ship
        window.$shipTypes = []
        $shipTypes[stype.api_id] = stype for stype in body.api_mst_stype
        window.$slotitems = []
        $slotitems[slotitem.api_id] = slotitem for slotitem in body.api_mst_slotitem
        window.$mapareas = []
        $mapareas[maparea.api_id] = maparea for maparea in body.api_mst_maparea
        window.$maps = []
        $maps[map.api_id] = map for map in body.api_mst_mapinfo
        window.$missions = []
        $missions[mission.api_id] = mission for mission in body.api_mst_mission
      # User datas prefixed by _
      when '/kcsapi/api_get_member/basic'
        window._teitokuLv = body.api_level
      when '/kcsapi/api_req_sortie/battleresult'
        window._teitokuLv = body.api_member_lv
      when '/kcsapi/api_port/port'
        window._ships = {}
        _ships[ship.api_id] = extendShip ship for ship in body.api_ship
      when '/kcsapi/api_get_member/slot_item'
        window._slotitems = {}
        _slotitems[item.api_id] = extendSlotitem item for item in body
      when '/kcsapi/api_req_kousyou/getship'
        _ships[body.api_ship.api_id] = extendShip body.api_ship
        if body.api_slotitem?
          _slotitems[item.api_id] = extendSlotitem item for item in body.api_slotitem
      when '/kcsapi/api_req_kousyou/createitem'
        _slotitems[body.api_slot_item.api_id] = extendSlotitem body.api_slot_item if body.api_create_flag == 1
      when '/kcsapi/api_req_kousyou/destroyship'
        idx = parseInt(postBody.api_ship_id)
        for itemId in _ships[idx].api_slot
          continue if itemId == -1
          delete _slotitems[itemId]
        delete _ships[idx]
      when '/kcsapi/api_req_kousyou/destroyitem2'
        for itemId in postBody.api_slotitem_ids.split(',')
          delete _slotitems[parseInt(itemId)]
      when '/kcsapi/api_req_hokyu/charge'
        for ship in body.api_ship
          _ships[ship.api_id] = _.extend _ships[ship.api_id], ship
      when '/kcsapi/api_get_member/ship_deck'
        for ship in body.api_ship_data
          _ships[ship.api_id] = extendShip ship
      when '/kcsapi/api_req_kaisou/slotset'
        _ships[parseInt(postBody.api_id)].api_slot[parseInt(postBody.api_slot_idx)] = parseInt(postBody.api_item_id)
      when '/kcsapi/api_get_member/ship3'
        for ship in body.api_ship_data
          _ships[ship.api_id] = extendShip ship
      when '/kcsapi/api_req_kousyou/remodel_slot'
        if body.api_use_slot_id?
          for itemId in body.api_use_slot_id
            delete _slotitems[itemId]
        if body.api_remodel_flag == 1 and body.api_after_slot?
          afterSlot = body.api_after_slot
          itemId = afterSlot.api_id
          _slotitems[itemId] = extendSlotitem afterSlot
      when '/kcsapi/api_req_kaisou/powerup'
        for shipId in postBody.api_id_items.split(',')
          idx = parseInt(shipId)
          for itemId in _ships[idx].api_slot
            continue if itemId == -1
            delete _slotitems[itemId]
          delete _ships[idx]
        _ships[body.api_ship.api_id] = extendShip body.api_ship
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
