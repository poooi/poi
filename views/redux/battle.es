/*
battle.result =
  rank: String
  boss: Boolean
  map: Integer(2-3 => 23)
  enemyHp: Array of Integer
  deckHp: Array of Integer
  enemyShipId: Array of Integer
  deckShipId: Array of Integer
*/

import { Models, Simulator } from 'poi-lib-battle'
const {BattleType, Battle, Fleet} = Models

function handleResult(battle, packet) {
  // HACK: Skip pratice battle.
  // TODO: Update when lib-battle updated.
  if (battle.type === BattleType.Pratice)
    return

  const simulator = new Simulator(battle.fleet)
  let stages = []
  for (const packet of battle.packet) {
    stages = stages.concat(simulator.simulate(packet))
  }

  const deckShipId = [], deckHp = []
  const deck = [].concat(simulator.mainFleet || [], simulator.escortFleet || [])
  deck.map(ship => {
    if (ship != null) {
      deckShipId.push(ship.raw != null ? ship.raw.api_id : -1) // use _ships id in deckShipId
      deckHp.push(ship.nowHP)
    }
  })
  const enemyShipId = [], enemyHp = []
  const enemy = [].concat(simulator.enemyFleet || [], simulator.enemyEscort || [])
  enemy.map(ship => {
    if (ship != null) {
      enemyShipId.push(ship.id)
      enemyHp.push(ship.nowHP)
    }
  })
  const result = {
    rank: packet.api_win_rank,
    boss: battle.type === BattleType.Boss,
    map:  battle.map,
    deckShipId: deckShipId,
    deckHp:     deckHp,
    enemyShipId: enemyShipId,
    enemyHp:     enemyHp,
  }

  return result
}

function getItem(itemId) {
  const _item = window.getStore(`info.equips.${itemId}`)
  const item = _item ? {
    ...window.getStore(`const.$equips.${_item.api_slotitem_id}`),
    ..._item,
  } : null
  if (item) {
    // Clean up
    delete item.api_info
  }
  return item
}

function getShip(shipId) {
  const _ship = window.getStore(`info.ships.${shipId}`)
  const ship = _ship ? {
    ...window.getStore(`const.$ships.${_ship.api_ship_id}`),
    ..._ship,
  } : null
  if (ship) {
    ship.poi_slot = []
    for (const id of ship.api_slot) {
      ship.poi_slot.push(getItem(id))
    }
    ship.poi_slot_ex = getItem(ship.api_slot_ex)
    // Clean up
    delete ship.api_getmes
    delete ship.api_slot
    delete ship.api_slot_ex
    delete ship.api_yomi
  }
  return ship
}

function getFleet(deckId) {
  const deck = window.getStore(`info.fleets.${deckId - 1}`) || {}
  const ships = deck.api_ship
  if (ships) {
    const fleet = []
    for (const id of ships) {
      fleet.push(getShip(id))
    }
    return fleet
  } else {
    return null
  }
}

const statusInitState = {
  deckId: -1,
  combined: false,
  map: -1,
  bossCell: -1,
  currentCell: -1,
  enemyFormation: 0, // Formation: 0 - 単縦陣, 1 - 複縦陣, 2 - 輪形陣, 3 - 梯形陣, 4 - 単横陣,
    // 5 - 第一警戒航行序列, 6 - 第二警戒航行序列, 7 - 第三警戒航行序列, 8 - 第四警戒航行序列
  colorNo: -1,
  packet: [],
  battle: null,
}

const resultInitState = {
  valid: false,
}

const initState = {
  // _status: Temporary middle results
  _status: statusInitState,
  // result: The result of a completed battle. Only changes on battle completion
  result: resultInitState,
}

export function reducer(state=initState, {type, body, postBody, path}) {
  const {_status} = state
  switch (type) {
  case '@@Response/kcsapi/api_req_map/start':
    // Refresh current map info
    return {
      ...state,
      _status: {
        ..._status,
        combined: false,
        battle: null,
        map: body.api_maparea_id * 10 + body.api_mapinfo_no,
        bossCell: body.api_bosscell_no,
        currentCell: body.api_no,
        deckId: parseInt(postBody.api_deck_id) - 1,
        colorNo: body.api_color_no,
        enemyFormation: 0,
      },
    }
  case '@@Response/kcsapi/api_req_map/next':
    return {
      ...state,
      _status: {
        ..._status,
        currentCell: body.api_no,
        battle: null,
        colorNo: body.api_color_no,
        enemyFormation: 0,
      },
    }
  case '@@Response/kcsapi/api_port/port':
    // Initialize all info
    return {
      ...state,
      ...initState,
    }
  // Normal battle
  case '@@Response/kcsapi/api_req_sortie/battle':
  case '@@Response/kcsapi/api_req_battle_midnight/battle':
  case '@@Response/kcsapi/api_req_battle_midnight/sp_midnight':
  case '@@Response/kcsapi/api_req_sortie/airbattle':
  case '@@Response/kcsapi/api_req_sortie/ld_airbattle': // Event Combined battle
  case '@@Response/kcsapi/api_req_combined_battle/airbattle':
  case '@@Response/kcsapi/api_req_combined_battle/battle':
  case '@@Response/kcsapi/api_req_combined_battle/midnight_battle':
  case '@@Response/kcsapi/api_req_combined_battle/sp_midnight':
  case '@@Response/kcsapi/api_req_combined_battle/ld_airbattle':
  case '@@Response/kcsapi/api_req_combined_battle/battle_water': {
    const enemyFormation = (body.api_formation || [])[1] || _status.enemyFormation
    const fleetId = [body.api_deck_id, body.api_dock_id].find((x) => x != null)
    const escortId = (_status.combined) ? 2 : -1
    const packet = Object.clone(body)
    packet.poi_path = path
    packet.poi_time = null
    const battle = _status.battle ? _status.battle : new Battle({
      type:   null,
      map:    _status.map,
      desc:   null,
      time:   null,
      fleet:  new Fleet({
        type:    _status.combined ? 1 : 0,
        main:    getFleet(fleetId),
        escort:  getFleet(escortId),
        support: null,
        LBAC:    null,
      }),
      packet: [],
    })
    battle.packet.push(packet)
    const result = handleResult(battle, packet)

    return {
      ...state,
      _status: {
        ..._status,
        battle,
        result,
        enemyFormation,
      },
    }
  }
  case '@@Response/kcsapi/api_req_sortie/battleresult':
  case '@@Response/kcsapi/api_req_combined_battle/battleresult':
    if (_status.result) {
      const {deckHp, enemyHp, deckShipId, enemyShipId} = _status.result
      const result = {
        valid: true,
        rank: body.api_win_rank,
        boss: _status.bossCell == _status.currentCell || _status.colorNo == 5,
        map: _status.map,
        mapCell: _status.currentCell,
        quest: body.api_quest_name,
        enemy: body.api_enemy_info.api_deck_name,
        combined: _status.combined,
        mvp: _status.combined ? [body.api_mvp-1, body.api_mvp_combined-1] : [body.api_mvp-1, body.api_mvp-1],
        dropItem: body.api_get_useitem,
        dropShipId: (body.api_get_ship != null) ? body.api_get_ship.api_ship_id : -1,
        deckShipId,
        deckHp,
        enemyShipId,
        enemyFormation: _status.enemyFormation,
        enemyHp,
        eventItem: body.api_get_eventitem,
      }
      return {
        ...state,
        result,
        _status: {
          ..._status,
          battle: null,
        },
      }
    }
    break
  }
  return state
}

// Subscriber, used on battle completion.
// Need to observe on state battle.result
export function dispatchBattleResult(dispatch, battleResult, oldBattleResult) {
  if (!battleResult.valid)
    return
  dispatch({
    type: '@@BattleResult',
    result: battleResult,
  })
  const e = new CustomEvent('battle.result', {
    bubbles: true,
    cancelable: true,
    detail: battleResult,
  })
  window.dispatchEvent(e)
}
