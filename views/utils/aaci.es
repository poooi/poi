// ported from KC3kai's AACI module
// url: https://github.com/KC3Kai/KC3Kai/blob/master/src/library/modules/AntiAir.js
// commit a9edbe5
// in thankful acknowledgment of their hard work
// some variable and function naming are modified

import { maxBy } from 'lodash'

// check for $slotitemtypes
const itemTypeIs = n => equip => equip.api_type[2] === n

// type for slot item
const iconIs = n => equip => equip.api_type[3] === n

// 12: 小型電探
// 13: 大型電探
const isRadar = equip => itemTypeIs(12)(equip) || itemTypeIs(13)(equip)

// validAll(f,g...)(x) = f(x) && g(x) && ...
const validAll = (...func) => x => func.every(f => f(x))

const validNot = f => x => !f(x)

const validAny = (...func) => x => func.some(f => f(x))

// AA Radar
// Surface Radar are excluded by checking whether
// the equipment gives AA stat (api_tyku)
const isAARadar = equip => isRadar(equip) && equip.api_tyku > 0

// 36: 高射装置 Anti-aircraft Fire Director
const isAAFD = itemTypeIs(36)

// icon=16: 高角砲
const isHighAngleMount = iconIs(16)

// 18: 対空強化弾
const isType3Shell = itemTypeIs(18)

// 21: 対空機銃
const isAAGun = itemTypeIs(21)

// 3: 大口径主砲
const isLargeCaliberMainGun = itemTypeIs(3)

// full list from wikiwiki (as of Jan 24, 2019)
// 122: 10cm連装高角砲+高射装置
// 130: 12.7cm高角砲+高射装置
// 135: 90mm単装高角砲
// 172: 5inch連装砲 Mk.28 mod.2
// 275: 10cm連装高角砲改+増設機銃
// 295: 12.7cm連装砲A型改三(戦時改修)＋高射装置
// 296: 12.7cm連装砲B型改四(戦時改修)＋高射装置
// 308: 5inch単装砲 Mk.30改＋GFCS Mk.37
const isBuiltinHighAngleMount = equip =>
  [122, 130, 135, 172, 275, 295, 296, 308].includes(equip.api_slotitem_id)

// 131: 25mm三連装機銃 集中配備
// 173: Bofors 40mm四連装機関砲
// 191: QF 2ポンド8連装ポンポン砲
const isCDMG = equip => [131, 173, 191].includes(equip.api_slotitem_id)

// 274: 12cm30連装噴進砲改二
const isRocketK2 = equip => equip.api_slotitem_id === 274

// 275: 10cm連装高角砲改+増設機銃
const isHighAngleMountGun = equip => equip.api_slotitem_id === 275

// 191: QF 2ポンド8連装ポンポン砲
const isQF2Pounder = equip => equip.api_slotitem_id === 191

// 300: 16inch Mk.I三連装砲改+FCR type284
const is16InchMkITriplePlusFCR = equip => equip.api_slotitem_id === 300

// 301: 20連装7inch UP Rocket Launchers
const is20Tube7InchUpRocketLaunchers = equip => equip.api_slotitem_id === 301

const is5InchSingleGunMountMk30 = equip => equip.api_slotitem_id === 313
const is5InchSingleGunMountMk30PlusGFCS = equip => equip.api_slotitem_id === 308
const isGFCSMk37 = equip => equip.api_slotitem_id === 307

// avoid modifying this structure directly, use "declareAACI" instead.
export const AACITable = {}

// typeIcons is a array including [ship icon, equip icon, ...]
// predicateShipMst is a function f: f(mst)
// predicateShipObj is a function f: f(shipObj)
// returns a boolean to indicate whether the ship in question (with equipments)
// is capable of performing such type of AACI
const declareAACI = ({ name = '', id, fixed, modifier, shipValid, equipsValid }) => {
  AACITable[id] = {
    name,
    id,
    fixed,
    modifier,
    shipValid,
    equipsValid,
  }
}

const isNotSubmarine = ship => ![13, 14].includes(ship.api_stype)

const isBattleship = ship => [8, 9, 10].includes(ship.api_stype)

// 54 = 秋月型
const isAkizukiClass = ship => ship.api_ctype === 54
// 67 = Queen Elizabeth class
// 78 = Ark Royal class
// 82 = J class
// 88 = Nelson class
const isRoyalNavyShips = ship => [67, 78, 82, 88].includes(ship.api_ctype)

// 6 = 金剛型
const isKongouClassK2 = ship => ship.api_ctype === 6 && ship.api_aftershipid === '0'

const shipIdIs = n => ship => ship.api_ship_id === n

const isMayaK2 = shipIdIs(428)
const isIsuzuK2 = shipIdIs(141)
const isKasumiK2B = shipIdIs(470)
const isSatsukiK2 = shipIdIs(418)
const isKinuK2 = shipIdIs(487)
const isYuraK2 = shipIdIs(488)
const isFumitsukiK2 = shipIdIs(548)
const isUIT25 = shipIdIs(539)
const isI504 = shipIdIs(530)
const isTatsutaK2 = shipIdIs(478)
const isIseK = shipIdIs(82)
const isIseK2 = shipIdIs(553)
const isHyuuGaK = shipIdIs(88)
const isMusashiK = shipIdIs(148)
const isMusashiK2 = shipIdIs(546)
const isHamakazeBK = shipIdIs(558)
const isIsokazeBK = shipIdIs(557)
const isTenryuuK2 = shipIdIs(477)
const isGotlandKai = shipIdIs(579)

// "hasAtLeast(pred)(n)(xs)" is the same as:
// xs.filter(pred).length >= n
const hasAtLeast = (pred, n) => xs => xs.filter(pred).length >= n

// "hasSome(pred)(xs)" is the same as:
// xs.some(pred)
const hasSome = pred => xs => xs.some(pred)

// check if slot num of ship (excluding ex slot) equals or greater
const slotNumAtLeast = n => ship => ship.api_slot_num >= n

/*

   reference:

   - https://wikiwiki.jp/kancolle/航空戦#antiairfire (as of Jan 23, 2019)

 */

// id 1~3: Akizuki-class
declareAACI({
  name: ['Akizuki Class'],
  id: 1,
  fixed: 7,
  modifier: 1.7,
  shipValid: isAkizukiClass,
  equipsValid: validAll(hasAtLeast(isHighAngleMount, 2), hasSome(isRadar)),
})

declareAACI({
  name: ['Akizuki Class'],
  id: 2,
  fixed: 6,
  modifier: 1.7,
  shipValid: isAkizukiClass,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isRadar)),
})

declareAACI({
  name: ['Akizuki Class'],
  id: 3,
  fixed: 4,
  modifier: 1.6,
  shipValid: isAkizukiClass,
  equipsValid: validAll(hasAtLeast(isHighAngleMount, 2)),
})

// id 4: battleships
declareAACI({
  name: ['Battle Ship'],
  id: 4,
  fixed: 6,
  modifier: 1.4,
  shipValid: validAll(isBattleship, slotNumAtLeast(4)),
  equipsValid: validAll(
    hasSome(isLargeCaliberMainGun),
    hasSome(isType3Shell),
    hasSome(isAAFD),
    hasSome(isAARadar),
  ),
})

// id 5: all surface ships
declareAACI({
  id: 5,
  fixed: 4,
  modifier: 1.5,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(3)),
  equipsValid: validAll(hasAtLeast(isBuiltinHighAngleMount, 2), hasSome(isAARadar)),
})

// id 6: battleships
declareAACI({
  name: ['Battle Ship'],
  id: 6,
  fixed: 4,
  modifier: 1.45,
  shipValid: validAll(isBattleship, slotNumAtLeast(3)),
  equipsValid: validAll(hasSome(isLargeCaliberMainGun), hasSome(isType3Shell), hasSome(isAAFD)),
})

// id 7~9: all surface ships
declareAACI({
  id: 7,
  fixed: 3,
  modifier: 1.35,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(3)),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAFD), hasSome(isAARadar)),
})

declareAACI({
  id: 8,
  fixed: 4,
  modifier: 1.4,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(2)),
  equipsValid: validAll(hasSome(isBuiltinHighAngleMount), hasSome(isAARadar)),
})

declareAACI({
  id: 9,
  fixed: 2,
  modifier: 1.3,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(2)),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAFD)),
})

// id: 10~11 Maya K2
declareAACI({
  name: ['摩耶改二'],
  id: 10,
  fixed: 8,
  modifier: 1.65,
  shipValid: isMayaK2,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isCDMG), hasSome(isAARadar)),
})

declareAACI({
  name: ['摩耶改二'],
  id: 11,
  fixed: 6,
  modifier: 1.5,
  shipValid: isMayaK2,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isCDMG)),
})

declareAACI({
  id: 12,
  fixed: 3,
  modifier: 1.25,
  shipValid: validAll(isNotSubmarine, slotNumAtLeast(3)),
  equipsValid: validAll(hasSome(isCDMG), hasAtLeast(isAAGun, 2), hasSome(isAARadar)),
})

// id 13: <unknown>

// id 14~15: Isuzu K2
declareAACI({
  name: ['五十鈴改二'],
  id: 14,
  fixed: 4,
  modifier: 1.45,
  shipValid: isIsuzuK2,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun), hasSome(isAARadar)),
})

declareAACI({
  name: ['五十鈴改二'],
  id: 15,
  fixed: 3,
  modifier: 1.3,
  shipValid: isIsuzuK2,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun)),
})

// id 16~17 Kasumi K2B
declareAACI({
  name: ['霞改二乙'],
  id: 16,
  fixed: 4,
  modifier: 1.4,
  shipValid: isKasumiK2B,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun), hasSome(isAARadar)),
})

declareAACI({
  name: ['霞改二乙'],
  id: 17,
  fixed: 2,
  modifier: 1.25,
  shipValid: isKasumiK2B,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun)),
})

// id 18: Satsuki K2
declareAACI({
  name: ['皐月改二'],
  id: 18,
  fixed: 2,
  modifier: 1.2,
  shipValid: isSatsukiK2,
  equipsValid: validAll(hasSome(isCDMG)),
})

// id 19~20: Kinu K2
// any HA with builtin AAFD will not work
declareAACI({
  name: ['鬼怒改二'],
  id: 19,
  fixed: 5,
  modifier: 1.45,
  shipValid: isKinuK2,
  equipsValid: validAll(
    validNot(hasSome(isBuiltinHighAngleMount)),
    hasSome(isHighAngleMount),
    hasSome(isCDMG),
  ),
})

declareAACI({
  name: ['鬼怒改二'],
  id: 20,
  fixed: 3,
  modifier: 1.25,
  shipValid: isKinuK2,
  equipsValid: validAll(hasSome(isCDMG)),
})

// id 21: Yura K2
declareAACI({
  name: ['由良改二'],
  id: 21,
  fixed: 5,
  modifier: 1.45,
  shipValid: isYuraK2,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAARadar)),
})

// id 22: Fumitsuki K2
declareAACI({
  name: ['文月改二'],
  id: 22,
  fixed: 2,
  modifier: 1.2,
  shipValid: isFumitsukiK2,
  equipsValid: validAll(hasSome(isCDMG)),
})

// id 23: UIT-25 & I-504
declareAACI({
  name: ['UIT-25', '伊504'],
  id: 23,
  fixed: 1,
  modifier: 1.05,
  shipValid: validAny(isUIT25, isI504),
  equipsValid: validAll(hasSome(validAll(isAAGun, validNot(isCDMG)))),
})

// id 24: Tenryuu K2 & Tatsuta K2
declareAACI({
  name: ['天龍改二', '龍田改二'],
  id: 24,
  fixed: 3,
  modifier: 1.25,
  shipValid: validAny(isTenryuuK2, isTatsutaK2),
  equipsValid: validAll(hasSome(validAll(isAAGun, validNot(isCDMG))), hasSome(isHighAngleMount)),
})

// id 25: Ise-class Kai
declareAACI({
  name: ['伊勢改', '日向改'],
  id: 25,
  fixed: 7,
  modifier: 1.55,
  shipValid: validAny(isIseK, isHyuuGaK),
  equipsValid: validAll(hasSome(isRocketK2), hasSome(isAARadar), hasSome(isType3Shell)),
})

// id 26: Musashi K2
declareAACI({
  name: ['武蔵改二'],
  id: 26,
  fixed: 6,
  modifier: 1.4,
  shipValid: isMusashiK2,
  equipsValid: validAll(hasSome(isHighAngleMountGun), hasSome(isAARadar)),
})

// id 27: <unknown>

// id 28: Ise-class Kai & Musashi Kai/K2
declareAACI({
  name: ['伊勢改', '伊勢改二', '日向改', '武蔵改', '武蔵改二'],
  id: 28,
  fixed: 4,
  modifier: 1.4,
  shipValid: validAny(isIseK, isIseK2, isHyuuGaK, isMusashiK, isMusashiK2),
  equipsValid: validAll(hasSome(isRocketK2), hasSome(isAARadar)),
})

// id 29: Hamakaze B Kai & Isokaze B Kai
declareAACI({
  name: ['浜風乙改', '磯風乙改'],
  id: 29,
  fixed: 5,
  modifier: 1.55,
  shipValid: validAny(isHamakazeBK, isIsokazeBK),
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isRadar)),
})

// id 30: Tenryuu K2 & Gotland Kai
declareAACI({
  name: ['天龍改二', 'Gotland Kai'],
  id: 30,
  fixed: 3,
  modifier: 1.3,
  shipValid: validAny(isTenryuuK2, isGotlandKai),
  equipsValid: hasAtLeast(isHighAngleMount, 3),
})

// id 31: Tenryuu K2
declareAACI({
  name: ['天龍改二'],
  id: 31,
  fixed: 2,
  modifier: 1.25,
  shipValid: isTenryuuK2,
  equipsValid: hasAtLeast(isHighAngleMount, 2),
})

// id 32: HMS & Kongou-class K2
declareAACI({
  name: ['HMS Royal Navy', 'Kongou Class Kai 2'],
  id: 32,
  fixed: 3,
  modifier: 1.2,
  shipValid: validAny(isRoyalNavyShips, isKongouClassK2),
  equipsValid: validAll(
    hasSome(isQF2Pounder),
    validAny(hasSome(is20Tube7InchUpRocketLaunchers), hasSome(is16InchMkITriplePlusFCR)),
  ),
})

// id 33: Gotland Kai
declareAACI({
  name: ['Gotland Kai'],
  id: 33,
  fixed: 3,
  modifier: 1.25,
  shipValid: isGotlandKai,
  equipsValid: validAll(hasSome(isHighAngleMount), hasSome(isAAGun)),
})

const isJohnstonOrKai = validAny(shipIdIs(562), shipIdIs(689))

// id 34~37: Johnston
declareAACI({
  name: ['Johnston'],
  id: 34,
  fixed: 7,
  modifier: 1.6,
  shipValid: isJohnstonOrKai,
  equipsValid: hasAtLeast(is5InchSingleGunMountMk30PlusGFCS, 2),
})

declareAACI({
  name: ['Johnston'],
  id: 35,
  fixed: 6,
  modifier: 1.55,
  shipValid: isJohnstonOrKai,
  equipsValid: validAll(
    hasSome(is5InchSingleGunMountMk30PlusGFCS),
    hasSome(is5InchSingleGunMountMk30),
  ),
})

declareAACI({
  name: ['Johnston'],
  id: 36,
  fixed: 6,
  modifier: 1.55,
  shipValid: isJohnstonOrKai,
  equipsValid: validAll(hasAtLeast(is5InchSingleGunMountMk30, 2), hasSome(isGFCSMk37)),
})

declareAACI({
  name: ['Johnston'],
  id: 37,
  fixed: 4,
  modifier: 1.55,
  shipValid: isJohnstonOrKai,
  equipsValid: hasAtLeast(is5InchSingleGunMountMk30, 2),
})

// return: a list of sorted AACI objects order by effect desc,
//   as most effective AACI gets priority to be triggered.
// param: AACI IDs from possibleAACIs functions
// param: a optional sorting callback to customize ordering
const sortAaciIds = (
  aaciIds,
  sortCallback = (a, b) => b.fixed - a.fixed || b.modifier - a.modifier,
) => {
  let aaciList = []
  if (!!aaciIds && Array.isArray(aaciIds)) {
    aaciIds.forEach(id => {
      if (AACITable[id]) {
        aaciList.push(AACITable[id])
      }
    })
    aaciList = aaciList.sort(sortCallback)
  }
  return aaciList
}

// Order by AACI id desc
export const sortFleetPossibleAaciList = triggeredShipAaciIds =>
  sortAaciIds(triggeredShipAaciIds, (a, b) => b.id - a.id)

// return a list of AACIs that meet the requirement of ship and equipmenmt
// ship: ship
// equips: [[equip, onslot] for equip on ship]
export const getShipAvailableAACIs = (ship, equips) =>
  Object.keys(AACITable)
    .filter(key => {
      const type = AACITable[key]
      return type.shipValid(ship) && type.equipsValid(equips)
    })
    .map(key => Number(key))

// return a list of all possible AACIs for the ship herself
export const getShipAllAACIs = ship =>
  Object.keys(AACITable)
    .filter(key => {
      const type = AACITable[key]
      return type.shipValid(ship)
    })
    .map(key => Number(key))

// return the AACIs to trigger for a ship, it will be array due to exceptions
export const getShipAACIs = (ship, equips) => {
  const AACIs = getShipAvailableAACIs(ship, equips)
  const maxFixed = maxBy(AACIs, id => (AACITable[id] || {}).fixed || 0) || 0
  // Kinu kai 2 exception
  if (AACIs.includes(19)) {
    return [19, 20]
  }
  if (maxFixed === 8 && AACIs.includes(20)) {
    return [8, 20]
  }
  if (maxFixed === 8 && AACIs.includes(7)) {
    return [7, 8]
  }
  // Kasumi Kai 2 B since 17 and 9 have same shotdown
  if (AACIs.includes(17) && maxFixed === 9) {
    return [17]
  }
  // Isuzu Kai 2 since 14 and 8 have same shotdown
  if (AACIs.includes(14) && maxFixed === 8) {
    return [14]
  }
  // Satsuki Kai 2
  if (AACIs.includes(18)) {
    return [...new Set([maxFixed, 18])]
  }
  // Fumitsuki Kai 2, not verified, only assumption
  if (AACIs.includes(22)) {
    return [...new Set([maxFixed, 22])]
  }

  return maxFixed ? [maxFixed] : []
}

// collections of AACIs to trigger of each ship
export const getFleetAvailableAACIs = (ships, equips) => {
  const aaciSet = {}
  ships.forEach((ship, index) => {
    getShipAACIs(ship, equips[index].map(([equip, onslot]) => equip)).forEach(id => {
      aaciSet[id] = true
    })
  })
  return Object.keys(aaciSet).map(key => Number(key))
}
