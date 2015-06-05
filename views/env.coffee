require 'coffee-react/register'

# Environments
window.remote = require 'remote'
window.ROOT = __dirname
window.APPDATA_PATH = remote.getGlobal 'APPDATA_PATH'
window.POI_VERSION = remote.getGlobal 'POI_VERSION'
window.SERVER_HOSTNAME = remote.getGlobal 'SERVER_HOSTNAME'

# Shortcuts and Components
window._ = require 'underscore'
window.$ = (param) -> document.querySelector(param)
window.$$ = (param) -> document.querySelectorAll(param)
window.jQuery = require './components/jquery/dist/jquery'
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
window.notify = (msg) ->
  new Notification 'poi',
    icon: "file://#{ROOT}/assets/icons/icon.png"
    body: msg
window.toggleModal = (title, content, footer) ->
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
  locked = true
  while responses.length > 0
    [method, path, body, postBody] = responses.shift()
    # Important! Clone a copy of proxy objects!
    body = Object.remoteClone body
    postBody = Object.remoteClone postBody
    switch path
      # Game datas prefixed by $
      when '/kcsapi/api_start2'
        window.$ships = []
        window.$ships[ship.api_id] = ship for ship in body.api_mst_ship
        window.$shipTypes = []
        window.$shipTypes[stype.api_id] = stype for stype in body.api_mst_stype
        window.$slotitems = []
        window.$slotitems[slotitem.api_id] = slotitem for slotitem in body.api_mst_slotitem
        window.$mapareas = []
        window.$mapareas[maparea.api_id] = maparea for maparea in body.api_mst_maparea
        window.$maps = []
        window.$maps[map.api_id] = map for map in body.api_mst_mapinfo
        window.$missions = []
        window.$missions[mission.api_id] = mission for mission in body.api_mst_mission
      # User datas prefixed by _
      when '/kcsapi/api_get_member/basic'
        window._teitokuLv = body.api_level
      when '/kcsapi/api_req_sortie/battleresult'
        window._teitokuLv = body.api_member_lv
      when '/kcsapi/api_port/port'
        window._ships = body.api_ship
      when '/kcsapi/api_get_member/slot_item'
        window._slotitems = body
      when '/kcsapi/api_req_kousyou/getship'
        window._ships.push body.api_ship
        for item in body.api_slotitem
          window._slotitems.push item
      when '/kcsapi/api_req_kousyou/createitem'
        window._slotitems.push body.api_slot_item if body.api_create_flag == 1
      when '/kcsapi/api_req_kousyou/destroyship'
        idx = _.sortedIndex window._ships, {api_id: parseInt(postBody.api_ship_id)}, 'api_id'
        for itemId in window._ships[idx].api_slot
          continue if itemId == -1
          itemIdx = _.sortedIndex window._slotitems, {api_id: itemId}, 'api_id'
          window._slotitems.splice itemIdx, 1
        window._ships.splice idx, 1
      when '/kcsapi/api_req_kousyou/destroyitem2'
        for itemId in postBody.api_slotitem_ids.split(',')
          idx = _.sortedIndex window._slotitems, {api_id: parseInt(itemId)}, 'api_id'
          window._slotitems.splice idx, 1
      when '/kcsapi/api_req_hokyu/charge'
        for ship in body.api_ship
          idx = _.sortedIndex window._ships, {api_id: ship.api_id}, 'api_id'
          window._ships[idx] = _.extend window._ships[idx], ship
      when '/kcsapi/api_get_member/ship_deck'
        for ship in body.api_ship_data
          idx = _.sortedIndex window._ships, {api_id: ship.api_id}, 'api_id'
          window._ships[idx] = ship
      when '/kcsapi/api_req_kaisou/slotset'
        idx = _.sortedIndex window._ships, {api_id: parseInt(postBody.api_id)}, 'api_id'
        window._ships[idx].api_slot[parseInt(postBody.api_slot_idx)] = parseInt(postBody.api_item_id)
      when '/kcsapi/api_get_member/ship3'
        for ship in body.api_ship_data
          idx = _.sortedIndex window._ships, {api_id: ship.api_id}, 'api_id'
          window._ships[idx] = ship
      when '/kcsapi/api_req_kousyou/remodel_slot'
        if body.api_use_slot_id?
          for itemId in body.api_use_slot_id
            itemIdx = _.sortedIndex window._slotitems, {api_id: itemId}, 'api_id'
            window._slotitems.splice itemIdx, 1
        if body.api_remodel_flag == 1 and body.api_after_slot?
          afterSlot = body.api_after_slot
          itemId = afterSlot.api_id
          itemIdx = _.sortedIndex window._slotitems, {api_id: itemId}, 'api_id'
          window._slotitems[itemIdx] = afterSlot
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
  window.dispatchEvent new Event 'resize'

views = ['layout', 'app', 'update']
for view in views
  require "./views/#{view}"
