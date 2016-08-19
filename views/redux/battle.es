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

// === Battle simulation ===
// The following functions will MODIFY sortieHp and enemyHp

function koukuAttack(sortieHp, enemyHp, kouku) {
  if (kouku.api_edam != null) {
    kouku.api_edam.forEach((damage, i) => {
      damage = Math.floor(damage)
      if (damage > 0) {
        enemyHp[i - 1] -= damage
      }
    })
  }
  if (kouku.api_fdam != null) {
    kouku.api_fdam.forEach((damage, i) => {
      damage = Math.floor(damage)
      if (damage > 0) {
        sortieHp[i - 1] -= damage
      }
    })
  }
}

function supportAttack(sortieHp, enemyHp, support) {
  support.forEach((damage, i) => {
    damage = Math.floor(damage)
    if (damage <= 0 || i > 6)
      return
    enemyHp[i - 1] -= damage
  })
}

function raigekiAttack(sortieHp, enemyHp, raigeki) {
  if (raigeki.api_edam != null) {
    raigeki.api_edam.forEach((damage, i) => {
      damage = Math.floor(damage)
      if (damage > 0) {
        enemyHp[i - 1] -= damage
      }
    })
  }
  if (raigeki.api_fdam != null) {
    raigeki.api_fdam.forEach((damage, i) => {
      damage = Math.floor(damage)
      if (damage > 0) {
        sortieHp[i - 1] -= damage
      }
    })
  }
}

function hougekiAttack(sortieHp, enemyHp, hougeki) {
  hougeki.api_at_list.forEach((damageFrom, i) => {
    if (damageFrom == -1)
      return
    hougeki.api_damage[i].forEach((damage, j) => {
      damage = Math.floor(damage)
      const damageTo = hougeki.api_df_list[i][j]
      if (damage <= 0)
        return
      if (damageTo < 7)
        sortieHp[damageTo - 1] -= damage
      else
        enemyHp[damageTo - 1 - 6] -= damage
    })
  })
}

function simulateBattle(state, isCombined, isWater, body) {
  const {sortieHp, enemyHp, combinedHp} = state
  // Land base
  if (body.api_air_base_attack != null ) {
    for (const air_attack of body.api_air_base_attack) {
      if (air_attack.api_stage3 != null) {
        koukuAttack(sortieHp, enemyHp, air_attack.api_stage3)
      }
    }
  }
  // First air battle
  if (body.api_kouku != null) {
    if (body.api_kouku.api_stage3 != null)
      koukuAttack(sortieHp, enemyHp, body.api_kouku.api_stage3)
    if (body.api_kouku.api_stage3_combined != null)
      koukuAttack(combinedHp, enemyHp, body.api_kouku.api_stage3_combined)
  }
  // Second air battle
  if (body.api_kouku2 != null) {
    if (body.api_kouku2.api_stage3 != null)
      koukuAttack(sortieHp, enemyHp, body.api_kouku2.api_stage3)
    if (body.api_kouku2.api_stage3_combined != null)
      koukuAttack(combinedHp, enemyHp, body.api_kouku2.api_stage3_combined)
  }
  // Support battle
  if (body.api_support_info != null) {
    if (body.api_support_info.api_support_airatack != null)
      supportAttack(sortieHp, enemyHp, body.api_support_info.api_support_airatack.api_stage3.api_edam)
    else if (body.api_support_info.api_support_hourai != null)
      supportAttack(sortieHp, enemyHp, body.api_support_info.api_support_hourai.api_damage)
    else
      supportAttack(sortieHp, enemyHp, body.api_support_info.api_damage)
  }
  // Opening battle
  if (body.api_opening_atack != null) {
    if (isCombined)
      raigekiAttack(combinedHp, enemyHp, body.api_opening_atack)
    else
      raigekiAttack(sortieHp, enemyHp, body.api_opening_atack)
  }
  // Night battle
  if (body.api_hougeki != null) {
    if (isCombined)
      hougekiAttack(combinedHp, enemyHp, body.api_hougeki)
    else
      hougekiAttack(sortieHp, enemyHp, body.api_hougeki)
  }
  // First hougeki battle
  if (body.api_hougeki1 != null) {
    if (isCombined && !isWater)
      hougekiAttack(combinedHp, enemyHp, body.api_hougeki1)
    else
      hougekiAttack(sortieHp, enemyHp, body.api_hougeki1)
  }
  // Second hougeki battle
  if (body.api_hougeki2 != null)
    hougekiAttack(sortieHp, enemyHp, body.api_hougeki2)
  // Combined hougeki battle
  if (body.api_hougeki3 != null) {
    if (isCombined && isWater)
      hougekiAttack(combinedHp, enemyHp, body.api_hougeki3)
    else
      hougekiAttack(sortieHp, enemyHp, body.api_hougeki3)
  }
  // Raigeki battle
  if (body.api_raigeki != null) {
    if (isCombined)
      raigekiAttack(combinedHp, enemyHp, body.api_raigeki)
    else
      raigekiAttack(sortieHp, enemyHp, body.api_raigeki)
  }
  return state
}

// === Reducer ===

const statusInitState = {
  battled: false,
  deckId: -1,
  combined: false,
  map: -1,
  bossCell: -1,
  currentCell: -1,
  enemyShipId: [],
  enemyFormation: 0, // Formation: 0 - 単縦陣, 1 - 複縦陣, 2 - 輪形陣, 3 - 梯形陣, 4 - 単横陣,
    // 5 - 第一警戒航行序列, 6 - 第二警戒航行序列, 7 - 第三警戒航行序列, 8 - 第四警戒航行序列
  colorNo: -1,
  sortieHp: [],
  combinedHp: [],
  enemyHp: [],
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

export function reducer(state=initState, {type, body, postBody}) {
  const {_status} = state
  const {getStore} = window
  switch (type) {
  case '@@Response/kcsapi/api_req_map/start':
    // Refresh current map info
    return {
      ...state,
      _status: {
        ..._status,
        combined: false,
        battled: false,
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
        battled: false,
        colorNo: body.api_color_no,
        enemyFormation: 0,
      },
    }
  case '@@Response/kcsapi/api_port/port':
    // Initialize all info
    return {
      ...state,
      _status: {
        ..._status,
        deckId: -1,
        combined: false,
        map: -1,
        bossCell: -1,
        currentCell: -1,
        battled: false,
        enemyShipId: [],
        colorNo: -1,
        enemyFormation: 0,
      },
    }
  // Normal battle
  case '@@Response/kcsapi/api_req_sortie/battle':
  case '@@Response/kcsapi/api_req_battle_midnight/battle':
  case '@@Response/kcsapi/api_req_battle_midnight/sp_midnight':
  case '@@Response/kcsapi/api_req_sortie/airbattle':
  case '@@Response/kcsapi/api_req_sortie/ld_airbattle': {
    let enemyFormation = _status.enemyFormation
    if (type !== '@@Response/kcsapi/api_req_battle_midnight/battle')
      enemyFormation = body.api_formation[1]
    const beginStatus = {
      ..._status,
      battled: true,
      combined: false,
      sortieHp: body.api_nowhps.slice(1, 7),
      enemyHp: body.api_nowhps.slice(7, 13),
      enemyShipId: body.api_ship_ke.slice(1, 7),
      enemyFormation,
    }
    return {
      ...state,
      _status: simulateBattle(beginStatus, false, false, body),
    }
  }
  // Event Combined battle
  case '@@Response/kcsapi/api_req_combined_battle/airbattle':
  case '@@Response/kcsapi/api_req_combined_battle/battle':
  case '@@Response/kcsapi/api_req_combined_battle/midnight_battle':
  case '@@Response/kcsapi/api_req_combined_battle/sp_midnight':
  case '@@Response/kcsapi/api_req_combined_battle/ld_airbattle': {
    let enemyFormation = _status.enemyFormation
    if (type !== '@@Response/kcsapi/api_req_combined_battle/midnight_battle')
      enemyFormation = body.api_formation[1]
    const beginStatus = {
      ..._status,
      battled: true,
      combined: true,
      sortieHp: body.api_nowhps.slice(1, 7),
      combinedHp: body.api_nowhps_combined.slice(1, 7),
      enemyHp: body.api_nowhps.slice(7, 13),
      enemyShipId: body.api_ship_ke.slice(1, 7),
      enemyFormation,
    }
    return {
      ...state,
      _status: simulateBattle(beginStatus, true, false, body),
    }
  }
  case '@@Response/kcsapi/api_req_combined_battle/battle_water': {
    const beginStatus = {
      ..._status,
      battled: true,
      combined: true,
      sortieHp: body.api_nowhps.slice(1, 7),
      combinedHp: body.api_nowhps_combined.slice(1, 7),
      enemyHp: body.api_nowhps.slice(7, 13),
      enemyShipId: body.api_ship_ke.slice(1, 7),
      enemyFormation: body.api_formation[1],
    }
    return {
      ...state,
      _status: simulateBattle(beginStatus, true, true, body),
    }
  }
  case '@@Response/kcsapi/api_req_sortie/battleresult':
  case '@@Response/kcsapi/api_req_combined_battle/battleresult':
    if (_status.battled) {
      const {combined, sortieHp, combinedHp} = _status
      const fleets = getStore('info.fleets')
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
        deckShipId: combined ? fleets[0].api_ship.concat(fleets[1].api_ship) : fleets[_status.deckId].api_ship,
        deckHp: combined ? sortieHp.concat(combinedHp) : sortieHp,
        enemyShipId: _status.enemyShipId,
        enemyFormation: _status.enemyFormation,
        enemyHp: _status.enemyHp,
        eventItem: body.api_get_eventitem,
      }
      return {
        ...state,
        result,
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
  // TODO: Backward compatibility for old battle-env event
  // Delete them when backward compatibility support is over
  const e = new CustomEvent('battle.result', {
    bubbles: true,
    cancelable: true,
    detail: battleResult,
  })
  window.dispatchEvent(e)
}
