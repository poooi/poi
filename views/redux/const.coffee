reduceReducers = require 'reduce-reducers'
  
dataFromBody = (body) ->
  $ships: indexify(body.api_mst_ship)
  $shipTypes: indexify(body.api_mst_stype)
  $slotitems: indexify(body.api_mst_slotitem)
  $slotitemTypes: indexify(body.api_mst_slotitem_equiptype)
  $mapareas: indexify(body.api_mst_maparea)
  $maps: indexify(body.api_mst_mapinfo)
  $missions: indexify(body.api_mst_mission)
  $useitems: indexify(body.api_mst_useitem)

module.exports.reducer = reduceReducers(
  listenToResponse '/kcsapi/api_start2', 
    (state={}, {body}) -> dataFromBody body
)
