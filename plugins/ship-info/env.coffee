window.remote = require 'remote'
window.path = require 'path'

# This part partly copy form ROOT/views/env.coffee
# Without useless code
# Environments ROOT: xxx/poi/
window.ROOT = path.join(__dirname, "..", "..")
# Shortcuts and Components
window._ = require 'underscore'
window.$ = (param) -> document.querySelector(param)
window.$$ = (param) -> document.querySelectorAll(param)
window.jQuery = require(ROOT + '/components/jquery/dist/jquery')
window.React = require 'react'
window.ReactBootstrap = require 'react-bootstrap'
# Node modules
window.config = remote.require './lib/config'
window.proxy = remote.require './lib/proxy'

{remoteStringify} = remote.require './lib/utils'

theme = config.get 'poi.theme', '__default__'
if theme != '__default__'
  $('#bootstrap-css').setAttribute 'href', "../../assets/themes/#{theme}/css/#{theme}.css"
else
  $('#bootstrap-css').setAttribute 'href', '../../components/bootstrap/dist/css/bootstrap.css'

# Utils
# Object.clone = require 'clone'
Object.remoteClone = (obj) ->
  JSON.parse remoteStringify obj

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
      when '/kcsapi/api_req_kaisou/slotset'
        idx = _.sortedIndex window._ships, {api_id: parseInt(postBody.api_id)}, 'api_id'
        window._ships[idx].api_slot[parseInt(postBody.api_slot_idx)] = parseInt(postBody.api_item_id)
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
