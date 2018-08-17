import { indexify } from 'views/utils/tools'
import { keyBy } from 'lodash'

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
    $graphs: indexify(body.api_mst_shipgraph),
    $shipgraph: body.api_mst_shipgraph, // FIXME: finally deprecate $shipgraph in favor of $graphs
    /*
       IMPORTANT: do not indexify api_mst_shipupgrade,
       because api_id does not suggest uniqueness in this part
       due to having cyclic remodel chains.
     */
    $shipUpgrades: body.api_mst_shipupgrade,
    $exslotEquips: body.api_mst_equip_exslot,
    $exslotEquipShips: keyBy(body.api_mst_equip_exslot_ship, 'api_slotitem_id'),
  }
}

export function reducer(state={}, {type, body}) {
  switch (type) {
  case '@@Response/kcsapi/api_start2/getData':
    return dataFromBody(body)
  }
  return state
}
