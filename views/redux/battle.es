
import { Models, Simulator } from 'poi-lib-battle'
const {Battle, Fleet} = Models
import { get } from 'lodash'

function simulate(battle) {
  const simulator = Simulator.auto(battle)

  const deckShipId = [], deckHp = [], deckInitHp = []
  const deck = [].concat(simulator.mainFleet || [], simulator.escortFleet || [])
  deck.map(ship => {
    deckShipId.push((ship && ship.raw) ? ship.raw.api_id : -1)  // use _ships id in deckShipId
    deckHp.push(ship ? ship.nowHP : 0)
    deckInitHp.push(ship ? ship.initHP : 0)
  })
  const enemyShipId = [], enemyHp = []
  const enemy = [].concat(simulator.enemyFleet || [], simulator.enemyEscort || [])
  enemy.map(ship => {
    enemyShipId.push(ship ? ship.id : -1)
    enemyHp.push(ship ? ship.nowHP : 0)
  })

  return {
    deckShipId : deckShipId,
    deckHp     : deckHp,
    deckInitHp : deckInitHp,
    enemyShipId: enemyShipId,
    enemyHp    : enemyHp,
  }
}

function getItem(itemId, state) {
  const _item = get(state, `info.equips.${itemId}`)
  const item = _item ? {
    ...get(state, `const.$equips.${_item.api_slotitem_id}`),
    ..._item,
  } : null
  if (item) {
    // Clean up
    delete item.api_info
  }
  return item
}

function getShip(shipId, state) {
  const _ship = get(state, `info.ships.${shipId}`)
  const ship = _ship ? {
    ...get(state, `const.$ships.${_ship.api_ship_id}`),
    ..._ship,
  } : null
  if (ship) {
    ship.poi_slot = []
    for (const id of ship.api_slot) {
      ship.poi_slot.push(getItem(id, state))
    }
    ship.poi_slot_ex = getItem(ship.api_slot_ex, state)
    // Clean up
    delete ship.api_getmes
    delete ship.api_slot
    delete ship.api_slot_ex
    delete ship.api_yomi
  }
  return ship
}

function getFleet(deckId, state) {
  const deck = get(state, `info.fleets.${deckId - 1}`) || {}
  const ships = deck.api_ship
  if (ships) {
    const fleet = []
    for (const id of ships) {
      fleet.push(getShip(id, state))
    }
    return fleet
  } else {
    return null
  }
}

function getSortieType(state) {
  const combinedFlag = get(state, 'sortie.combinedFlag')
  const sortieFleet = []
  for (const [i, status] of (get(state, 'sortie.sortieStatus') || []).entries()) {
    if (status) sortieFleet.push(i)
  }
  return sortieFleet.length === 2 ? combinedFlag : 0
}

const statusInitState = {
  deckId: -1,
  map: -1,
  bossCell: -1,
  currentCell: -1,
  enemyFormation: 0, // Formation: 0 - 単縦陣, 1 - 複縦陣, 2 - 輪形陣, 3 - 梯形陣, 4 - 単横陣,
  // 5 - 第一警戒航行序列, 6 - 第二警戒航行序列, 7 - 第三警戒航行序列, 8 - 第四警戒航行序列
  colorNo: -1,
  packet: [],
  battle: null,
  time: 0,
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

export function reducer(state=initState, {type, path, body, postBody, time}, store) {
  const {_status} = state
  switch (type) {
  case '@@Response/kcsapi/api_port/port':
    // Initialize all info
    return initState
  case '@@Response/kcsapi/api_req_map/start':
    // Refresh current map info
    return {
      ...state,
      _status: {
        ..._status,
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
  // Normal battle
  case '@@Response/kcsapi/api_req_sortie/battle':
  case '@@Response/kcsapi/api_req_sortie/airbattle':
  case '@@Response/kcsapi/api_req_sortie/ld_airbattle':
  case '@@Response/kcsapi/api_req_combined_battle/battle':
  case '@@Response/kcsapi/api_req_combined_battle/battle_water':
  case '@@Response/kcsapi/api_req_combined_battle/airbattle':
  case '@@Response/kcsapi/api_req_combined_battle/ld_airbattle':
  case '@@Response/kcsapi/api_req_combined_battle/ec_battle':
  case '@@Response/kcsapi/api_req_combined_battle/each_battle':
  case '@@Response/kcsapi/api_req_combined_battle/each_battle_water':
  case '@@Response/kcsapi/api_req_battle_midnight/battle':
  case '@@Response/kcsapi/api_req_battle_midnight/sp_midnight':
  case '@@Response/kcsapi/api_req_combined_battle/midnight_battle':
  case '@@Response/kcsapi/api_req_combined_battle/sp_midnight':
  case '@@Response/kcsapi/api_req_combined_battle/ec_midnight_battle':
  case '@@Response/kcsapi/api_req_combined_battle/ec_night_to_day': {
    const sortieTypeFlag = getSortieType(store)
    const enemyFormation = (body.api_formation || [])[1] || _status.enemyFormation
    const fleetId = [body.api_deck_id, body.api_dock_id].find((x) => x != null)
    const escortId = (sortieTypeFlag > 0) ? 2 : -1
    const battle = _status.battle ? _status.battle : new Battle({
      fleet:  new Fleet({
        type:    sortieTypeFlag,
        main:    getFleet(fleetId, store),
        escort:  getFleet(escortId, store),
      }),
      packet: [],
    })
    const packet = Object.clone(body)
    packet.poi_path = path
    battle.packet.push(packet)
    const result = simulate(battle)

    return {
      ...state,
      _status: {
        ..._status,
        battle,
        result,
        enemyFormation,
        time: _status.time ? _status.time : time,
      },
    }
  }
  case '@@Response/kcsapi/api_req_sortie/battleresult':
  case '@@Response/kcsapi/api_req_combined_battle/battleresult':
    if (_status.result) {
      const result = {
        ..._status.result,
        valid: true,
        time: _status.time,
        rank: body.api_win_rank,
        boss: _status.bossCell == _status.currentCell || _status.colorNo == 5,
        map: _status.map,
        mapCell: _status.currentCell,
        quest: body.api_quest_name,
        enemy: body.api_enemy_info.api_deck_name,
        combined: getSortieType() > 0,
        mvp: getSortieType() > 0 ? [body.api_mvp-1, body.api_mvp_combined-1] : [body.api_mvp-1, body.api_mvp-1],
        dropItem: body.api_get_useitem,
        dropShipId: (body.api_get_ship != null) ? body.api_get_ship.api_ship_id : -1,
        enemyFormation: _status.enemyFormation,
        eventItem: body.api_get_eventitem,
      }
      return {
        ...state,
        result,
        _status: {
          ..._status,
          battle: null,
          time: 0,
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
