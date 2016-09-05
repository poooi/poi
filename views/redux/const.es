import { indexify } from 'views/utils/tools'

function dataFromBody(body) {
  return {
    $ships: indexify(body.api_mst_ship),
    $shipTypes: indexify(body.api_mst_stype),
    $equips: indexify(body.api_mst_slotitem),
    $equipTypes: indexify(body.api_mst_slotitem_equiptype),
    $mapareas: indexify(body.api_mst_maparea),
    $maps: indexify(body.api_mst_mapinfo),
    $missions: indexify(body.api_mst_mission),
    $useitems: indexify(body.api_mst_useitem),
    $shipgraph: body.api_mst_shipgraph,
  }
}

export function reducer(state={}, {type, body}) {
  switch (type) {
  case '@@Response/kcsapi/api_start2':
    return dataFromBody(body)
  }
  return state
}
