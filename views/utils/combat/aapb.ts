/*
   reference:

   - http://kancolle.wikia.com/wiki/12cm_30-tube_Rocket_Launcher_Kai_Ni (as of Dec 15, 2018)
   - http://kancolle.wikia.com/wiki/Combat#/Aerial (as of Oct 18, 2018)
   - https://twitter.com/noratako5/status/1062027534026428416
   - https://twitter.com/kankenRJ/status/979524073934893056
   - https://twitter.com/noratako5/status/976988915734228992
   - https://wikiwiki.jp/kancolle/%E5%AF%BE%E7%A9%BA%E7%A0%B2%E7%81%AB#AntiAircraft (as of Nov 27, 2021)
   - https://wikiwiki.jp/kancolle/12cm30連装噴進砲改二 (as of Nov 27, 2021)

    Last update Nov 27, 2021.

 */

import type { GameEquip, GameShip } from './types'

import { isAAFD, isAAGun, isAARadar, isHighAngleMount, isRocketK2 } from './equip-predicates'

// 加重対空値
/*
   note that there are inconsistency conclusions
   between wikiwiki and wikia (indicated below),
   we'll prefer wikiwiki for it's updated more recently (as of Oct 18, 2018)
   unless further experiment proves otherwise.
 */
const getEquipWeightedAA = (equip: GameEquip): number => {
  const tyku = equip.api_tyku ?? 0
  const levelBonus = Math.sqrt(equip.api_level ?? 0)
  // equip AA = (E_fmod * E_AA) + (E_f* * sqrt(lvl))
  if (isAAGun(equip)) {
    if (tyku >= 8) {
      // 素対空8以上
      return 6 * tyku + 6 * levelBonus
    } else {
      // 素対空7以下
      return 6 * tyku + 4 * levelBonus
    }
  }
  if (isHighAngleMount(equip)) {
    /*
       inconsistency:
       - equipment's improvement modifier is always 3 in wikia,
       - while in wikiwiki, HA with AA stat <= 7 has a factor of 2
     */
    if (tyku >= 8) {
      // 素対空8以上
      return 4 * tyku + 3 * levelBonus
    } else {
      // 素対空7以下
      return 4 * tyku + 2 * levelBonus
    }
  }
  if (isAAFD(equip)) {
    /*
       inconsistency:
       - AAFD's improvement modifier is not present in wikia
       - it's 2 in wikiwiki
     */
    return 4 * tyku + 2 * levelBonus
  }
  if (isAARadar(equip)) {
    return 3 * tyku
  }
  return 0
}

const capableShipTypes = [
  // 航空巡洋艦
  6,
  // 軽空母
  7,
  // 航空戦艦
  10,
  // 正規空母
  11,
  // 水上機母艦
  16,
  // 装甲空母
  18,
]

/*
   getShipAAPB(ship: GameShip, equips: GameEquip[]): number

   - return value x means a success rate of `x%`
 */
export const getShipAAPB = (ship: GameShip, equips: GameEquip[]): number => {
  if (!capableShipTypes.includes(ship.api_stype ?? -1)) return 0

  // 12cm30連装噴進砲改二
  const rlk2Count = equips.filter(isRocketK2).length

  if (rlk2Count === 0) return 0

  // 2 = 伊勢型
  const iseClassBonus = ship.api_ctype === 2 ? 25 : 0

  // 艦の素対空値
  /*
     note that deduction from current AA stat might result in some value higher
     than it actually is due to the possible existence of hidden bonus,
     of which everyone enjoys keeping track (thank you Tanaka, you're welcome).
     but here we want to obtain ship's basic AA **excluding** all equipments' bonus,
     for now the easiest approach is to work from $ship and ships' own modernization state.
   */
  const basicAA = (ship.api_tyku?.[0] ?? 0) + ship.api_kyouka[2]
  let adjustedAA = basicAA
  equips.forEach((equip) => {
    adjustedAA += getEquipWeightedAA(equip)
  })

  /*
     wikiwiki:
     - 加重対空値 = A × [X / A] []内は端数切捨て
     - Aは迎撃艦の装備数で変化、何にも装備していない場合は1、アイテムを1つ以上装備している場合は2

     at this point we have rlk2Count > 0, which means the ship in question
     must have equipped something, so we can say A = 2
   */
  adjustedAA = 2 * Math.floor(adjustedAA / 2)
  // as we want to show the percentage, let *100 here to obtain a better precision.
  return ((adjustedAA + 0.9 * ship.api_lucky[0]) * 100) / 281 + 15 * (rlk2Count - 1) + iseClassBonus
}
