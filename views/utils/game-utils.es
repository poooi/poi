/*
 * This file contains utility functions that is related to the game mechanism,
 * or formatting instructions to game data.
 */

import { between } from './tools'

const aircraftExpTable = [0, 10, 25, 40, 55, 70, 85, 100, 121]
const aircraftLevelBonus = {
  '6': [0, 0, 2, 5, 9, 14, 14, 22, 22],   // 艦上戦闘機
  '7': [0, 0, 0, 0, 0, 0, 0, 0, 0],       // 艦上爆撃機
  '8': [0, 0, 0, 0, 0, 0, 0, 0, 0],       // 艦上攻撃機
  '11': [0, 1, 1, 1, 1, 3, 3, 6, 6],      // 水上爆撃機
  '45': [0, 0, 2, 5, 9, 14, 14, 22, 22],  // 水上戦闘機
  '39': [0, 0, 0, 0, 0, 0, 0, 0, 0],      // 噴式景雲改
  '40': [0, 0, 0, 0, 0, 0, 0, 0, 0],      // 橘花改
}

export function getMaterialStyle(percent) {
  if (percent <= 50) {
    return 'danger'
  } else if (percent <= 75){
    return 'warning'
  } else if (percent < 100) {
    return 'info'
  } else {
    return 'success'
  }
}

export function getCondStyle(cond) {
  let s = 'poi-ship-cond-'
  if (cond > 52)
    s += '53'
  else if (cond > 49)
    s += '50'
  else if (cond == 49)
    s += '49'
  else if (cond > 39)
    s += '40'
  else if (cond > 29)
    s += '30'
  else if (cond > 19)
    s += '20'
  else
    s += '0'
  s += window.isDarkTheme ? ' dark' : ' light'
  return s
}

export function getStatusStyle(status) {
  if (status != null) {
    const flag = status == 0 || status == 1 // retreat or repairing
    if (flag != null && flag) {
      return {opacity: 0.4}
    }
  } else {
    return {}
  }
}

export function getShipLabelStatus(ship, $ship, inRepair, escaped) {
  if (!ship || !$ship) {
    return -1
  }
  if (escaped) {
    // retreated
    return 0
  } else if (inRepair) {
    // repairing
    return 1
  } else if (Math.min(ship.api_fuel / $ship.api_fuel_max, ship.api_bull / $ship.api_bull_max) < 1) {
    // supply
    return 2
  } else if ([1, 2, 3, 4, 5, 6].includes(ship.api_sally_area)) {
    // special: locked phase
    // returns 2 for locked phase 1, 3 for phase 2, etc
    return ship.api_sally_area + 2
  }
  return -1
}

export function getHpStyle(percent) {
  if (percent <= 25) {
    return 'danger'
  } else if (percent <= 50){
    return 'warning'
  } else if (percent <= 75){
    return 'info'
  } else {
    return 'success'
  }
}

// equipIconId: as in $equip.api_type[3]
export function equipIsAircraft(equipIconId) {
  return equipIconId != null && (
    between(equipIconId, 6, 10) ||
    between(equipIconId, 21, 22) ||
    [33, 39, 40].includes(equipIconId)
  )
}

export function getTyku(equipsData) {
  let minTyku = 0
  let maxTyku = 0
  let basicTyku = 0
  for (let i = 0; i < equipsData.length; i++) {
    if (!equipsData[i]) {
      continue
    }
    for (let j = 0; j < equipsData[i].length; j++) {
      if (!equipsData[i][j]) {
        continue
      }
      const [_equip, $equip, onslot] = equipsData[i][j]
      let tempTyku = 0.0
      let tempAlv
      // Basic tyku
      if (_equip.api_alv) {
        tempAlv = _equip.api_alv
      } else {
        tempAlv = 0
      }
      // 改修：艦戦×0.2、爆戦×0.25
      const levelFactor = $equip.api_baku > 0 ? 0.25 : 0.2
      if ([6, 7, 8].includes($equip.api_type[3])) {
        // 艦载機
        tempTyku += Math.sqrt(onslot) * ($equip.api_tyku + (_equip.api_level || 0) * levelFactor)
        tempTyku += aircraftLevelBonus[$equip.api_type[3]][tempAlv]
        basicTyku += Math.floor(Math.sqrt(onslot) * $equip.api_tyku)
        minTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv] / 10))
        maxTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv + 1] / 10))
      } else if ($equip.api_type[3] == 10 && ($equip.api_type[2] == 11 || $equip.api_type[2] == 45)) {
        // 水上機
        tempTyku += Math.sqrt(onslot) * $equip.api_tyku
        tempTyku += aircraftLevelBonus[$equip.api_type[2]][tempAlv]
        basicTyku += Math.floor(Math.sqrt(onslot) * $equip.api_tyku)
        minTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv] / 10))
        maxTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv + 1] / 10))
      } else if ([39, 40].includes($equip.api_type[3])) {
        // 噴式機
        tempTyku += Math.sqrt(onslot) * ($equip.api_tyku + (_equip.api_level || 0) * levelFactor)
        tempTyku += aircraftLevelBonus[$equip.api_type[3]][tempAlv]
        basicTyku += Math.floor(Math.sqrt(onslot) * $equip.api_tyku)
        minTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv] / 10))
        maxTyku += Math.floor(tempTyku + Math.sqrt(aircraftExpTable[tempAlv + 1] / 10))
      }
    }
  }
  return {
    basic: basicTyku,
    min: minTyku,
    max: maxTyku,
  }
}

// Saku (2-5 旧式)
// 偵察機索敵値×2 ＋ 電探索敵値 ＋ √(艦隊の装備込み索敵値合計 - 偵察機索敵値 - 電探索敵値)
export function getSaku25(shipsData, equipsData) {
  let reconSaku = 0
  let shipSaku = 0
  let radarSaku = 0
  let totalSaku = 0
  for (let i = 0; i < equipsData.length; i++) {
    if (!shipsData[i] || !equipsData[i])
      continue
    const [_ship] = shipsData[i]
    shipSaku += _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      if (!equipsData[i][j]) {
        continue
      }
      const $equip = equipsData[i][j][1]
      switch ($equip.api_type[3]) {
      case 9:
        reconSaku += $equip.api_saku
        shipSaku -= $equip.api_saku
        break
      case 10:
        if ($equip.api_type[2] == 10) {
          reconSaku += $equip.api_saku
          shipSaku -= $equip.api_saku
        }
        break
      case 11:
        radarSaku += $equip.api_saku
        shipSaku -= $equip.api_saku
        break
      default:
        break
      }
    }
  }
  reconSaku = reconSaku * 2.00
  shipSaku = Math.sqrt(shipSaku)
  totalSaku = reconSaku + radarSaku + shipSaku

  return {
    recon: parseFloat(reconSaku.toFixed(2)),
    radar: parseFloat(radarSaku.toFixed(2)),
    ship: parseFloat(shipSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}


// Saku (2-5 秋式)
// 索敵スコア = 艦上爆撃機 × (1.04) + 艦上攻撃機 × (1.37) + 艦上偵察機 × (1.66) + 水上偵察機 × (2.00)
//            + 水上爆撃機 × (1.78) + 小型電探 × (1.00) + 大型電探 × (0.99) + 探照灯 × (0.91)
//            + √(各艦毎の素索敵) × (1.69) + (司令部レベルを5の倍数に切り上げ) × (-0.61)
export function getSaku25a(shipsData, equipsData, teitokuLv) {
  let totalSaku = 0
  let shipSaku = 0
  let equipSaku = 0
  let teitokuSaku = 0
  for (let i = 0; i < equipsData.length; i++) {
    if (!shipsData[i] || !equipsData[i])
      continue
    const [_ship] = shipsData[i]
    let shipPureSaku = _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      if (!equipsData[i][j]) {
        continue
      }
      const $equip = equipsData[i][j][1]
      shipPureSaku -= $equip.api_saku
      switch ($equip.api_type[3]) {
      case 7:
        equipSaku += $equip.api_saku * 1.04
        break
      case 8:
        equipSaku += $equip.api_saku * 1.37
        break
      case 9:
        equipSaku += $equip.api_saku * 1.66
        break
      case 10:
        if ($equip.api_type[2] == 10) {
          equipSaku += $equip.api_saku * 2.00
        } else if ($equip.api_type[2] == 11) {
          equipSaku += $equip.api_saku * 1.78
        }
        break
      case 11:
        if ($equip.api_type[2] == 12) {
          equipSaku += $equip.api_saku * 1.00
        }
        else if ($equip.api_type[2] == 13) {
          equipSaku += $equip.api_saku * 0.99
        }
        break
      case 24:
        equipSaku += $equip.api_saku * 0.91
        break
      default:
        break
      }
    }
    shipSaku += Math.sqrt(shipPureSaku) * 1.69
  }
  teitokuSaku = 0.61 * Math.floor((teitokuLv + 4) / 5) * 5
  totalSaku = shipSaku + equipSaku - teitokuSaku

  return {
    ship: parseFloat(shipSaku.toFixed(2)),
    item: parseFloat(equipSaku.toFixed(2)),
    teitoku: parseFloat(teitokuSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}

// Saku (33)
// 索敵スコア = Sigma(CiSi) + Sigma(sqrt(s)) - Ceil(0.4H) + 2M
//     Si(改修): 電探(1.25 * Sqrt(Star)) 水上偵察機(1.2 * Sqrt(Star))
//     Ci(装備):
//              6 0.6 艦上戦闘機
//              7 0.6 艦上爆撃機
//              8 0.8 艦上攻撃機
//              9 1.0 艦上偵察機
//             10 1.2 水上偵察機
//             11 1.1 水上爆撃機
//             12 0.6 小型電探
//             13 0.6 大型電探
//             26 0.6 対潜哨戒機
//             29 0.6 探照灯
//             34 0.6 司令部施設
//             35 0.6 航空要員
//             39 0.6 水上艦要員
//             40 0.6 大型ソナー
//             41 0.6 大型飛行艇
//             42 0.6 大型探照灯
//             45 0.6 水上戦闘機
//             93 大型電探(II) null
//             94 艦上偵察機(II) null
//     S(各艦毎の素索敵)
//     H(レベル)
//     M(空き数)

export function getSaku33(shipsData, equipsData, teitokuLv, mapModifier=1.0) {
  let totalSaku = 0
  let shipSaku = 0
  let equipSaku = 0
  let teitokuSaku = 0
  let shipCount = 6
  for (let i = 0; i < equipsData.length; i++) {
    if (!shipsData[i] || !equipsData[i])
      continue
    shipCount -= 1
    const [_ship] = shipsData[i]
    let shipPureSaku = _ship.api_sakuteki[0]
    for (let j = 0; j < equipsData[i].length; j++) {
      if (!equipsData[i][j]) {
        continue
      }
      const [_equip, $equip] = equipsData[i][j]
      shipPureSaku -= $equip.api_saku
      switch ($equip.api_type[2]) {
      case 8:
        equipSaku += $equip.api_saku * 0.8
        break
      case 9:
        equipSaku += $equip.api_saku * 1.0
        break
      case 10:
        equipSaku += ($equip.api_saku + 1.2 * Math.sqrt(_equip.api_level || 0)) * 1.2
        break
      case 11:
        equipSaku += $equip.api_saku * 1.1
        break
      case 12:
        equipSaku += ($equip.api_saku + 1.25 * Math.sqrt(_equip.api_level || 0)) * 0.6
        break
      case 13:
        equipSaku += ($equip.api_saku + 1.25 * Math.sqrt(_equip.api_level || 0)) * 0.6
        break
      default:
        equipSaku += $equip.api_saku * 0.6
        break
      }
    }
    shipSaku += Math.sqrt(shipPureSaku)
  }
  equipSaku *= mapModifier
  teitokuSaku = Math.ceil(teitokuLv * 0.4)
  totalSaku = shipSaku + equipSaku - teitokuSaku + 2 * shipCount

  return {
    ship: parseFloat(shipSaku.toFixed(2)),
    item: parseFloat(equipSaku.toFixed(2)),
    teitoku: parseFloat(teitokuSaku.toFixed(2)),
    total: parseFloat(totalSaku.toFixed(2)),
  }
}

// returns fleet's minimal api_soku value, returns 0 when all elements undefined
export function getFleetSpeed (shipsData) {
  const fleetSpeed = shipsData.reduce((speed, ship) => {
    return (typeof ship != 'undefined' || !Number.isNaN(speed)) 
    ? Math.min(speed, ship.api_soku) 
    : ship.api_soku
  }, NaN)

  return {
    fleetSpeed: Number.isNaN(fleetSpeed) ? 0 : fleetSpeed,
  }
}


export async function isInGame () {
  try {
    return (
      document.querySelector('webview').getURL() === "http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/" ||
      await new Promise((resolve, reject) => {
        document.querySelector('webview').executeJavaScript(
          `document.querySelector('embed') !== null`,
          (e) => resolve(e)
        )
      })
    )
  } catch (e) {
    return false
  }
}
